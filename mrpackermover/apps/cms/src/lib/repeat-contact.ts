import type { PayloadRequest } from 'payload';
import { CLOSED_STAGES, FRESH_STAGES } from '../components/dashboard/lead-status.js';

/**
 * One customer, one lead.
 *
 * A customer who fills the website form and then rings the IVR (or the other way round,
 * or sends the price checker and then the full form) used to become two leads, often
 * with two different salespeople ringing the same person. Now a new contact from a phone
 * number that already has an OPEN lead from the last 30 days joins that lead instead.
 *
 * Who owns it then (the owner's rule, 29 Oct 2026):
 *   - Somebody has already spoken to the customer (Contacted, Follow up, Call later,
 *     Quoted, Scheduled): the lead STAYS with them, whoever took the IVR call, and they
 *     are told - the lead goes back to "new to you" with a note in its history saying
 *     the customer called and who the call went to.
 *   - Nobody has reached the customer yet (New / Assigned / Reassigned, Call not picked,
 *     Call not connected) and the IVR call went to someone else: the lead MOVES to the
 *     person who took the call - they are the one who has actually got hold of them.
 *   - A form or any other repeat contact never moves a lead; it fills in what the lead
 *     was missing and tells the owner.
 *
 * A closed lead (Won, Lost, Invalid, Duplicate), or one older than the window, is not
 * joined: the customer is back with a new move, and that is a new lead.
 */
export const REPEAT_WINDOW_DAYS = 30;

/** Nobody has got hold of the customer on this lead yet. */
export const NOT_REACHED: string[] = [...FRESH_STAGES, 'call-not-picked', 'call-not-connected'];

/** The ten-digit core of an Indian mobile, whatever the format - or null. */
export function phoneKey(phone: unknown): string | null {
  const d = String(phone ?? '').replace(/\D/g, '');
  const core =
    d.length === 12 && d.startsWith('91')
      ? d.slice(2)
      : d.length === 11 && d.startsWith('0')
        ? d.slice(1)
        : d;
  return /^\d{10}$/.test(core) ? core : null;
}

export interface OpenLead {
  id: string | number;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
  assignedTo?: unknown;
  rawPayload?: unknown;
  noteLog?: Record<string, unknown>[] | null;
  [key: string]: unknown;
}

const idOf = (v: unknown): string =>
  v && typeof v === 'object'
    ? String((v as { id?: unknown }).id ?? '')
    : v == null
      ? ''
      : String(v);

/**
 * The open lead this phone number already has, if any. Where there are several (older
 * duplicates), one somebody has already spoken to wins, then the oldest - the lead the
 * customer was first given to.
 */
export async function findOpenLead(req: PayloadRequest, phone: string): Promise<OpenLead | null> {
  const key = phoneKey(phone);
  if (!key) return null;
  const since = new Date(Date.now() - REPEAT_WINDOW_DAYS * 86400000).toISOString();
  const res = await req.payload.find({
    collection: 'leads',
    where: {
      and: [
        { phone: { like: key } },
        { status: { not_in: CLOSED_STAGES } },
        { createdAt: { greater_than_equal: since } },
      ],
    } as never,
    sort: 'createdAt',
    limit: 20,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const same = (res.docs as unknown as OpenLead[]).filter((d) => phoneKey(d.phone) === key);
  return same.find((d) => !NOT_REACHED.includes(String(d.status ?? ''))) ?? same[0] ?? null;
}

export interface RepeatContact {
  /** An IVR call can move a lead; anything else only joins it. */
  channel: 'ivr' | 'form' | 'webhook';
  /** Where it came in, for the note: "the quote form", "Facebook - Delhi form". */
  via: string;
  /** For an IVR call: the staff member it went to, when the name matched one. */
  receiver?: { id: string | number; name: string } | null;
  /** For an IVR call: the receiver as the phone system named them. */
  receiverLabel?: string | null;
  /** For an IVR call: "answered, talked 1m 12s" / "not answered". */
  callInfo?: string | null;
  /** Anything the lead is missing that this contact supplies. Never overwrites. */
  fill?: Record<string, unknown>;
  /** What the sender posted, kept on the lead (admin-only) - and its call recording. */
  payload?: unknown;
}

const blank = (v: unknown): boolean =>
  v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && !v.length);

/** Names we make up when the customer gave none - a real name may replace them. */
const PLACEHOLDER_NAMES = ['price check', 'facebook lead'];
const missing = (lead: OpenLead, k: string): boolean =>
  blank(lead[k]) ||
  (k === 'name' &&
    PLACEHOLDER_NAMES.includes(
      String(lead.name ?? '')
        .trim()
        .toLowerCase(),
    ));

/** Join a repeat contact to its open lead. Returns what happened, for the response. */
export async function joinRepeat(
  req: PayloadRequest,
  lead: OpenLead,
  c: RepeatContact,
): Promise<{ id: string | number; movedTo: string | null }> {
  const now = new Date().toISOString();
  const status = String(lead.status ?? '');
  const reached = !NOT_REACHED.includes(status);
  const ownerId = idOf(lead.assignedTo);
  const ownerName = await nameOf(req, ownerId);
  const tookCall = c.receiver?.name || c.receiverLabel || null;
  const call = c.callInfo ? ` (${c.callInfo})` : '';

  // An IVR call moves the lead only if nobody has reached the customer yet, and only to
  // a person we could identify.
  const moveTo =
    c.channel === 'ivr' && c.receiver && !reached && String(c.receiver.id) !== ownerId
      ? c.receiver
      : null;

  let body: string;
  if (c.channel === 'ivr') {
    if (moveTo) {
      body =
        `Customer called on the IVR${call} - the call went to ${moveTo.name}. ` +
        `Nobody had reached them on this lead yet, so it moved to ${moveTo.name}.`;
    } else if (c.receiver && String(c.receiver.id) === ownerId) {
      body = `Customer called again on the IVR${call} - ${c.receiver.name} took the call.`;
    } else {
      body =
        `Customer called on the IVR${call}` +
        (tookCall ? ` - the call went to ${tookCall}.` : '.') +
        (reached
          ? ` ${ownerName ?? 'The owner'} has already spoken to them, so the lead stays with ${ownerName ?? 'them'}.`
          : '');
    }
  } else {
    body = `Customer got in touch again through ${c.via}.`;
  }

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(c.fill ?? {})) {
    if (blank(v)) continue;
    if (k === 'name' && PLACEHOLDER_NAMES.includes(String(v).trim().toLowerCase())) continue;
    if (missing(lead, k)) data[k] = v;
  }
  if (c.payload !== undefined) {
    const prev =
      lead.rawPayload && typeof lead.rawPayload === 'object' && !Array.isArray(lead.rawPayload)
        ? (lead.rawPayload as Record<string, unknown>)
        : lead.rawPayload != null
          ? { original: lead.rawPayload }
          : {};
    const repeats = Array.isArray(prev._repeats) ? prev._repeats : [];
    data.rawPayload = {
      ...prev,
      _repeats: [...repeats, { at: now, via: c.via, channel: c.channel, payload: c.payload }],
    };
  }
  data.noteLog = [
    ...(lead.noteLog ?? []),
    { kind: 'note', body, at: now, authorName: c.channel === 'ivr' ? 'IVR' : 'Website' },
  ];

  if (moveTo) {
    data.assignedTo = moveTo.id;
    data.status = 'assigned';
  } else if (ownerId && !(c.receiver && String(c.receiver.id) === ownerId)) {
    // The owner's notification: back to "new to you" - the badge on Leads, their queue.
    data.acknowledgedAt = null;
  } else if (!ownerId && c.receiver) {
    // Nobody had it yet: the person who took the call gets it.
    data.assignedTo = c.receiver.id;
    data.status = 'assigned';
  }

  await req.payload.update({
    collection: 'leads',
    id: lead.id,
    data: data as never,
    depth: 0,
    overrideAccess: true,
    req,
    // Shown as "Assigned by" when this moves the lead (Leads beforeChange reads it).
    context: { assignedByName: c.channel === 'ivr' ? 'IVR call' : 'Website' },
  });
  return { id: lead.id, movedTo: moveTo ? String(moveTo.id) : null };
}

async function nameOf(req: PayloadRequest, id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const u = (await req.payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })) as { name?: string; email?: string };
    return u.name || u.email || null;
  } catch {
    return null;
  }
}
