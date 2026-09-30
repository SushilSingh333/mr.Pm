import { money, statusMeta, whenLabel } from '../dashboard/lead-status.js';

/**
 * What has happened to a lead, assembled from what the lead already knows.
 *
 * Pure: no React, no Payload, no fetch. The component renders what this returns, which
 * means the ordering and the wording can be reasoned about — and changed — without
 * touching a single hook.
 *
 * THREE SOURCES, ONE LIST:
 *
 *   1. `noteLog` — every typed entry. A person's note, and the entries the collection
 *      writes for itself when a stage changes or a lead changes hands. This is the only
 *      one that is stored.
 *   2. Proposals raised against the lead — fetched by the component, passed in here.
 *   3. The lead's own fields — `createdAt`/`source` for the arrival, `assignedAt` and
 *      `assignedByName` for the hand-over. DERIVED, never written: every lead that has
 *      ever existed gets these rows for free, with no backfill and no migration, and
 *      they cannot drift from the fields they are read out of.
 *
 * DELIBERATELY NOT a version history. Payload's version rows carry no author, and the
 * 50-per-document cap deletes the oldest first — so a version-derived timeline would lose
 * the "· Neha" from every line and lose the arrival first, on exactly the leads that have
 * been worked hardest. A trail that quietly forgets its own beginning is worse than none.
 */

export type TimelineKind =
  | 'note'
  | 'call-answered'
  | 'call-no-answer'
  | 'call-later'
  | 'quote-sent'
  | 'competitor'
  | 'price'
  | 'stage'
  | 'handover'
  | 'arrived';

/**
 * The icon and accent for each kind.
 *
 * `icon` is a key, not markup: this module stays free of JSX so it can be imported by
 * anything. Colours come from the stage list wherever an entry maps to a stage, so the
 * dot beside "Call not picked" here is the same colour as the chip on the board.
 */
/**
 * The accent, as a CSS variable rather than a hex.
 *
 * These colours are handed to inline styles, so they can name a custom property and pick
 * up whatever the admin theme currently defines - which is how the palette stays in one
 * place. The fallbacks only matter if a row is ever rendered outside the themed admin.
 */
const ACCENT = 'var(--mpm-v-500,#2558E6)';

export const KIND_META: Record<TimelineKind, { icon: string; color: string }> = {
  note: { icon: 'note', color: ACCENT },
  'call-answered': { icon: 'phone', color: statusMeta('contacted').color },
  'call-no-answer': { icon: 'missed', color: statusMeta('call-not-picked').color },
  'call-later': { icon: 'clock', color: statusMeta('call-later').color },
  'quote-sent': { icon: 'doc', color: statusMeta('quoted').color },
  competitor: { icon: 'rupee', color: 'var(--mpm-warn,#A36A00)' },
  price: { icon: 'rupee', color: statusMeta('won').color },
  stage: { icon: 'stage', color: ACCENT },
  handover: { icon: 'handover', color: 'var(--mpm-v-400,#4A7BF7)' },
  arrived: { icon: 'plus', color: ACCENT },
};

export interface TimelineRow {
  id: string;
  kind: TimelineKind;
  /** The bold line. */
  title: string;
  /** The quiet line under it, when there is one. */
  detail?: string;
  /** An optional link rendered on its own line, e.g. the proposal PDF. */
  link?: { href: string; label: string };
  /** ISO. Rows without one sort to the bottom rather than to 1970. */
  at?: string | null;
  /** "· Neha", or "· Given to Neha by auto-assign" for the arrival. */
  by?: string;
}

interface NoteRow {
  id?: string | number;
  body?: string | null;
  kind?: string | null;
  amount?: number | null;
  authorName?: string | null;
  author?: { name?: string; email?: string } | string | number | null;
  at?: string | null;
}

export interface TimelineLead {
  id?: string | number;
  source?: string | null;
  createdAt?: string | null;
  assignedAt?: string | null;
  assignedByName?: string | null;
  assignedTo?: { name?: string; email?: string } | string | number | null;
  /** An array from the saved document, an index-keyed object from form state. */
  noteLog?: NoteRow[] | Record<string, NoteRow> | null;
}

export interface TimelineProposal {
  id: string | number;
  quoteNo?: string | null;
  amount?: number | null;
  status?: string | null;
  createdAt?: string | null;
}

const SOURCE_LABEL: Record<string, string> = {
  'quote-form': 'Quote form',
  'price-check': 'Price check',
  'facebook-ad': 'Facebook ad',
  webhook: 'Webhook',
};

/**
 * The note rows, whatever shape they arrive in.
 *
 * Payload's `reduceFieldsToValues(fields, true)` skips the array field's own entry (array
 * fields carry `disableFormData`) and rebuilds the rows from the flattened
 * `noteLog.0.body` paths through flatley's `unflatten` - which returns an OBJECT keyed
 * "0", "1", "2", not an array. Read from the saved document instead and it is a real
 * array. Both reach this function, so it accepts both rather than assuming whichever one
 * was in front of whoever wrote it last.
 *
 * Numeric keys only, in numeric order: string keys would be flatley artefacts, and
 * "10" must not sort before "2".
 */
export function noteRows(v: unknown): NoteRow[] {
  if (Array.isArray(v)) return v as NoteRow[];
  if (v && typeof v === 'object') {
    return Object.entries(v as Record<string, NoteRow>)
      .filter(([k]) => /^\d+$/.test(k))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, row]) => row);
  }
  return [];
}

/** A name from a relationship that may or may not have been populated. */
const nameOf = (v: NoteRow['author']): string =>
  v && typeof v === 'object' ? (v.name ?? v.email ?? '') : '';

/** Bold line for a typed note. A plain note is its own text; a typed one gets a heading. */
function titleFor(n: NoteRow): string {
  const amount = Number(n.amount) || 0;
  switch (n.kind) {
    case 'call-answered':
      return 'Call answered';
    case 'call-no-answer':
      return 'Call not picked';
    case 'call-later':
      return 'Customer asked us to call later';
    case 'quote-sent':
      return amount > 0 ? `Quote sent · ${money(amount)}` : 'Quote sent';
    case 'competitor':
      return amount > 0
        ? `Customer shared another offer · ${money(amount)}`
        : 'Customer shared another offer';
    case 'price':
      return amount > 0 ? `Final price agreed · ${money(amount)}` : 'Final price agreed';
    case 'handover':
      return n.body || 'Given to a colleague';
    case 'stage':
      return n.body ? `Moved to ${n.body}` : 'Stage changed';
    default:
      // A plain note has no heading of its own: the note IS the line.
      return n.body || 'Note';
  }
}

/** A typed entry keeps its body as the quiet line; a plain note already used it above. */
const detailFor = (n: NoteRow): string | undefined =>
  n.kind && n.kind !== 'note' && n.kind !== 'stage' && n.kind !== 'handover' && n.body
    ? n.body
    : undefined;

/**
 * Assemble the list, newest first.
 *
 * Rows with no timestamp sort last rather than first: an unsaved row has no `at` yet, and
 * treating a missing date as the epoch would throw it to the bottom of a descending sort
 * anyway — this makes that explicit instead of accidental.
 */
export function buildTimeline(
  lead: TimelineLead | null | undefined,
  proposals: TimelineProposal[] = [],
): TimelineRow[] {
  if (!lead) return [];
  const rows: TimelineRow[] = [];

  for (const [i, n] of noteRows(lead.noteLog).entries()) {
    if (!n) continue;
    const kind = (n.kind ?? 'note') as TimelineKind;
    rows.push({
      id: `note-${n.id ?? i}`,
      kind: kind in KIND_META ? kind : 'note',
      title: titleFor(n),
      detail: detailFor(n),
      at: n.at ?? null,
      by: n.authorName ?? nameOf(n.author) ?? '',
    });
  }

  for (const p of proposals) {
    // A draft is not hidden, it is labelled. Raising a proposal moves the lead to Quoted
    // whatever the proposal's own status is, so hiding drafts left a lead sitting at
    // "Quoted" with a history that never mentioned a quote - the one reading where the
    // trail contradicts the stage chip above it. "Drafted" against "sent" is the honest
    // distinction, and it is also the nudge to go and send it.
    const drafted = p.status === 'draft';
    const verb = drafted ? 'Quote drafted' : 'Quote sent';
    rows.push({
      id: `proposal-${p.id}`,
      kind: 'quote-sent',
      title: p.amount ? `${verb} · ${money(Number(p.amount))}` : verb,
      link: p.quoteNo
        ? { href: `/admin/collections/proposals/${p.id}`, label: `${p.quoteNo} · open` }
        : { href: `/admin/collections/proposals/${p.id}`, label: 'Open the proposal' },
      at: p.createdAt ?? null,
    });
  }

  // Derived from the lead's own fields — see the header note.
  if (lead.assignedAt) {
    const to = lead.assignedTo && typeof lead.assignedTo === 'object' ? lead.assignedTo : null;
    const who = to?.name ?? to?.email ?? '';
    rows.push({
      id: 'assigned',
      kind: 'handover',
      title: who ? `Given to ${who}` : 'Given an owner',
      at: lead.assignedAt,
      by: lead.assignedByName ?? undefined,
    });
  }

  if (lead.createdAt) {
    const src = lead.source ? (SOURCE_LABEL[lead.source] ?? lead.source) : null;
    rows.push({
      id: 'arrived',
      kind: 'arrived',
      title: src ? `Lead came in from ${src}` : 'Lead came in',
      at: lead.createdAt,
    });
  }

  return rows.sort((a, b) => {
    const at = a.at ? new Date(a.at).getTime() : -Infinity;
    const bt = b.at ? new Date(b.at).getTime() : -Infinity;
    return bt - at;
  });
}

/** "Today, 11:20 AM · Neha" — the one quiet line under every entry. */
export const stampFor = (row: TimelineRow): string =>
  [whenLabel(row.at), row.by].filter(Boolean).join(' · ');
