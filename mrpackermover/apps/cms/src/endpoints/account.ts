import type { Endpoint, PayloadRequest, Where } from 'payload';
import { addDataAndFileToRequest } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import { json } from './_lib.js';
import {
  clearedCookies,
  cookieValue,
  hashPassword,
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  MAX_PASSWORD,
  MIN_PASSWORD,
  phoneCore,
  rateLimited,
  readToken,
  requesterIp,
  sameOrigin,
  SESSION_COOKIE,
  sessionCookies,
  signSession,
  verifyPassword,
} from '../lib/customer-auth.js';

/**
 * The website's customer accounts (/account), on the same origin as the site:
 *
 *   POST  /api/account/signup    create an account and sign in
 *   POST  /api/account/login     sign in with mobile number and password
 *   POST  /api/account/logout    sign out
 *   GET   /api/account/me        the profile, saved addresses, and moves
 *   PATCH /api/account/me        update name, email, city, addresses
 *   POST  /api/account/password  change the password (knowing the current one)
 *
 * Every response is private and uncached (`json`). Writes must come from our own pages
 * (sameOrigin). A forgotten password is reset by an admin in the CMS until OTP exists.
 */

type Id = string | number;
interface Address {
  label?: 'home' | 'office' | 'other';
  line?: string;
  area?: string;
  city?: string;
  pincode?: string;
  floor?: string;
  hasLift?: boolean;
  isDefault?: boolean;
}
interface CustomerDoc {
  id: Id;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  phoneVerified?: boolean | null;
  addresses?: Address[] | null;
  passwordHash?: string | null;
  sessionVersion?: number | null;
  failedLogins?: number | null;
  lockedUntil?: string | null;
  createdAt: string;
}

const withCookies = (res: Response, cookies: string[]): Response => {
  for (const c of cookies) res.headers.append('set-cookie', c);
  return res;
};
const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? '';
const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE = /^[1-9]\d{5}$/;

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  await addDataAndFileToRequest(req);
  return (req.data ?? {}) as Record<string, unknown>;
}

/** The customer behind the session cookie, re-read so a reset password ends old sessions. */
export async function currentCustomer(req: PayloadRequest): Promise<CustomerDoc | null> {
  const s = readToken(cookieValue(req, SESSION_COOKIE));
  if (!s) return null;
  const c = (await req.payload
    .findByID({
      collection: 'customers',
      id: s.sub,
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
    })
    .catch(() => null)) as CustomerDoc | null;
  return c && Number(c.sessionVersion ?? 0) === s.v ? c : null;
}

/** Up to ten addresses, each needing a first line; one default at most. */
function cleanAddresses(v: unknown): Address[] | string {
  if (!Array.isArray(v)) return [];
  if (v.length > 10) return 'You can save up to 10 addresses.';
  const out: Address[] = [];
  for (const raw of v as Record<string, unknown>[]) {
    const line = str(raw?.line, 160);
    if (!line) return 'Each address needs the house, building and street.';
    const pincode = str(raw?.pincode, 6);
    if (pincode && !PINCODE.test(pincode)) return 'A pincode has 6 digits.';
    const label = raw?.label === 'office' || raw?.label === 'other' ? raw.label : 'home';
    out.push({
      label,
      line,
      area: str(raw?.area, 80) || undefined,
      city: str(raw?.city, 60) || undefined,
      pincode: pincode || undefined,
      floor: str(raw?.floor, 20) || undefined,
      hasLift: raw?.hasLift === true,
      isDefault: raw?.isDefault === true,
    });
  }
  let seen = false;
  for (const a of out) {
    if (a.isDefault && seen) a.isDefault = false;
    if (a.isDefault) seen = true;
  }
  if (out.length && !seen) out[0]!.isDefault = true;
  return out;
}

/** What the browser may see of an account. Never the hash, version or lock fields. */
const profile = (c: CustomerDoc) => ({
  name: c.name,
  phone: c.phone,
  email: c.email ?? '',
  city: c.city ?? '',
  phoneVerified: Boolean(c.phoneVerified),
  addresses: (c.addresses ?? []).map((a) => ({
    label: a.label ?? 'home',
    line: a.line ?? '',
    area: a.area ?? '',
    city: a.city ?? '',
    pincode: a.pincode ?? '',
    floor: a.floor ?? '',
    hasLift: Boolean(a.hasLift),
    isDefault: Boolean(a.isDefault),
  })),
  memberSince: c.createdAt,
});

// ── Moves: the customer's quote requests, in the customer's words ─────────────────────

/**
 * The pipeline's stages as the customer should hear them. The sales vocabulary ("call not
 * picked", "assigned") is for the team; the customer sees where their move stands and
 * what happens next. `step` places it on the four-step tracker; closed moves have none.
 */
const STAGE: Record<string, { label: string; note: string; step: number; tone: string }> = {
  new: {
    label: 'Request received',
    note: 'A coordinator will call you shortly.',
    step: 0,
    tone: 'info',
  },
  assigned: {
    label: 'Request received',
    note: 'A coordinator will call you shortly.',
    step: 0,
    tone: 'info',
  },
  reassigned: {
    label: 'Request received',
    note: 'A coordinator will call you shortly.',
    step: 0,
    tone: 'info',
  },
  contacted: {
    label: 'In discussion',
    note: 'We are working out the details with you.',
    step: 0,
    tone: 'info',
  },
  'follow-up': {
    label: 'In discussion',
    note: 'We are working out the details with you.',
    step: 0,
    tone: 'info',
  },
  'call-later': {
    label: 'Call back arranged',
    note: 'We will call you at the time you asked.',
    step: 0,
    tone: 'info',
  },
  'call-not-picked': {
    label: 'We tried to call you',
    note: 'We could not reach you. Call or WhatsApp us when it suits you.',
    step: 0,
    tone: 'warn',
  },
  'call-not-connected': {
    label: 'We tried to call you',
    note: 'We could not get through. Call or WhatsApp us when it suits you.',
    step: 0,
    tone: 'warn',
  },
  quoted: {
    label: 'Quote sent',
    note: 'Your fixed, written price is with you.',
    step: 1,
    tone: 'info',
  },
  scheduled: {
    label: 'Move booked',
    note: 'Your move is booked. Your coordinator will confirm the crew.',
    step: 2,
    tone: 'good',
  },
  won: { label: 'Completed', note: 'Moved. Thank you for moving with us.', step: 3, tone: 'good' },
  lost: {
    label: 'Closed',
    note: 'This request was closed. Ask us any time to reopen it.',
    step: -1,
    tone: 'muted',
  },
};
/** Requests the customer should not see: junk and repeats of another request. */
const HIDDEN = ['invalid', 'duplicate'];
const PAST = ['won', 'lost'];

interface LeadDoc {
  id: Id;
  status?: string;
  service?: string | { name?: string } | null;
  pickup?: string | null;
  dropLocation?: string | null;
  moveDate?: string | null;
  dueAt?: string | null;
  moveSize?: string | null;
  quotedLow?: number | null;
  quotedHigh?: number | null;
  createdAt: string;
  phone?: string | null;
  customer?: Id | { id: Id } | null;
}
/** A relationship's id, populated or not. */
const idOf = (v: Id | { id: Id } | null | undefined): string =>
  v && typeof v === 'object' ? String(v.id) : v == null ? '' : String(v);
interface ProposalDoc {
  lead?: Id | { id: Id } | null;
  status?: string;
  amount?: number | null;
  quoteNo?: string | null;
  updatedAt: string;
}

async function movesOf(req: PayloadRequest, c: CustomerDoc) {
  // Their own requests (made while signed in) always; older ones on the same number only
  // once the number is verified, so a stranger cannot sign up as them and read them.
  const or: Where[] = [{ customer: { equals: c.id } }];
  if (c.phoneVerified) or.push({ phone: { contains: c.phone } });
  const leads = (
    (
      await req.payload.find({
        collection: 'leads',
        where: { and: [{ or }, { status: { not_in: HIDDEN } }] },
        sort: '-createdAt',
        limit: 50,
        depth: 1,
        overrideAccess: true,
      })
    ).docs as LeadDoc[]
  ).filter(
    // `contains` narrows the query; the match itself is exact. A lead whose phone field
    // holds more than one number (typed by staff, or from a webhook) is not anyone's by
    // number alone - only by being made while signed in.
    (l) =>
      idOf(l.customer) === String(c.id) ||
      (c.phoneVerified && phoneCore(l.phone ?? '') === c.phone),
  );
  if (!leads.length) return [];

  const ids = leads.map((l) => l.id);
  const proposals = (
    await req.payload.find({
      collection: 'proposals',
      where: { and: [{ lead: { in: ids } }, { status: { in: ['sent', 'accepted'] } }] },
      sort: '-updatedAt',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
  ).docs as ProposalDoc[];
  const quoteOf = new Map<string, ProposalDoc>();
  for (const p of proposals) {
    const id = String(typeof p.lead === 'object' && p.lead ? p.lead.id : p.lead);
    if (!quoteOf.has(id)) quoteOf.set(id, p);
  }

  return leads.map((l) => {
    const status = l.status ?? 'new';
    const stage = STAGE[status] ?? STAGE.new!;
    const q = quoteOf.get(String(l.id));
    const service = typeof l.service === 'object' && l.service ? l.service.name : l.service;
    return {
      ref: `MMP-${String(l.id).padStart(5, '0')}`,
      service: service || 'Move',
      from: l.pickup ?? '',
      to: l.dropLocation ?? '',
      size: l.moveSize ?? '',
      // A booked move's date is its scheduled day; before that, the date they asked for.
      date: (status === 'scheduled' || status === 'won' ? l.dueAt : null) ?? l.moveDate ?? null,
      requestedAt: l.createdAt,
      stage: { key: status, ...stage },
      past: PAST.includes(status),
      quote: q?.amount ? { amount: q.amount, number: q.quoteNo ?? '' } : null,
      estimate: l.quotedLow && l.quotedHigh ? { low: l.quotedLow, high: l.quotedHigh } : null,
    };
  });
}

/** Add one wrong password to the count, atomically, and return the new count. */
async function countFailure(req: PayloadRequest, id: Id): Promise<number> {
  const db = (
    req.payload.db as unknown as {
      drizzle: { execute: (q: unknown) => Promise<{ rows?: { failed_logins?: unknown }[] }> };
    }
  ).drizzle;
  const res = await db.execute(
    sql`UPDATE customers SET failed_logins = COALESCE(failed_logins, 0) + 1 WHERE id = ${Number(id)} RETURNING failed_logins`,
  );
  return Number(res.rows?.[0]?.failed_logins ?? 0);
}

// ── Endpoints ──────────────────────────────────────────────────────────────────────────

const signup: Endpoint = {
  path: '/account/signup',
  method: 'post',
  handler: async (req) => {
    if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403);
    // Generous, because Indian mobile networks put many people behind one IP; enough to
    // stop a script registering numbers in bulk.
    if (rateLimited(`signup:${requesterIp(req)}`, 20, 60 * 60_000)) {
      return json(
        { error: 'Too many sign-ups from this connection. Try again in an hour, or call us.' },
        429,
      );
    }
    const b = await body(req);
    const name = str(b.name, 80);
    const phone = phoneCore(String(b.phone ?? ''));
    const password = typeof b.password === 'string' ? b.password : '';
    const city = str(b.city, 60);
    const email = str(b.email, 120).toLowerCase();
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = 'Enter your full name.';
    if (!phone) errors.phone = 'Enter a 10-digit mobile number.';
    if (password.length < MIN_PASSWORD)
      errors.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (password.length > MAX_PASSWORD) errors.password = 'That password is too long.';
    if (!city) errors.city = 'Choose your city.';
    if (email && !EMAIL.test(email)) errors.email = 'Enter a valid email, or leave it blank.';
    const addresses = cleanAddresses(
      b.address ? [{ ...(b.address as object), isDefault: true }] : [],
    );
    if (typeof addresses === 'string') errors.address = addresses;
    if (Object.keys(errors).length)
      return json({ error: 'Check the highlighted fields.', fields: errors }, 422);

    const taken = await req.payload.count({
      collection: 'customers',
      where: { phone: { equals: phone } },
      overrideAccess: true,
    });
    if (taken.totalDocs) {
      return json(
        {
          error:
            'An account with this number already exists. Sign in, or call us if you forgot the password.',
          fields: { phone: 'This number already has an account.' },
        },
        409,
      );
    }

    const created = (await req.payload.create({
      collection: 'customers',
      overrideAccess: true,
      data: {
        name,
        phone,
        email: email || undefined,
        city,
        addresses: addresses as Address[],
        passwordHash: await hashPassword(password),
        sessionVersion: 0,
        lastLoginAt: new Date().toISOString(),
      } as never,
    })) as unknown as CustomerDoc;
    return withCookies(
      json({ ok: true, name: created.name }, 201),
      sessionCookies(signSession(created.id, 0), firstName(created.name)),
    );
  },
};

const login: Endpoint = {
  path: '/account/login',
  method: 'post',
  handler: async (req) => {
    if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403);
    const b = await body(req);
    const phone = phoneCore(String(b.phone ?? ''));
    const password = typeof b.password === 'string' ? b.password : '';
    const wrong = json({ error: 'Mobile number or password is incorrect.' }, 401);
    if (!phone || !password || password.length > MAX_PASSWORD) return wrong;
    // Before any lookup or hashing: one connection trying many numbers, and many
    // connections trying one number, are both slowed down. The per-account lockout below
    // still applies; this is what stops it being raced or sidestepped.
    const tooMany = json(
      { error: 'Too many attempts. Wait a few minutes and try again, or call us.' },
      429,
    );
    if (rateLimited(`login-ip:${requesterIp(req)}`, 60, 15 * 60_000)) return tooMany;
    if (rateLimited(`login-phone:${phone}`, 20, 15 * 60_000)) return tooMany;

    const c = (
      await req.payload.find({
        collection: 'customers',
        where: { phone: { equals: phone } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        showHiddenFields: true,
      })
    ).docs[0] as CustomerDoc | undefined;
    if (!c) {
      await verifyPassword(password, 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA'); // same time either way
      return wrong;
    }
    if (c.lockedUntil && new Date(c.lockedUntil).getTime() > Date.now()) {
      return json(
        { error: `Too many wrong attempts. Try again in ${LOCK_MINUTES} minutes, or call us.` },
        429,
      );
    }
    if (!(await verifyPassword(password, c.passwordHash))) {
      // Counted in the database in one statement, so parallel wrong guesses each count:
      // reading the number, hashing, then writing number + 1 let ten at once count as one.
      const failed = await countFailure(req, c.id);
      if (failed >= MAX_FAILED_LOGINS) {
        await req.payload.update({
          collection: 'customers',
          id: c.id,
          overrideAccess: true,
          data: {
            failedLogins: 0,
            lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString(),
          } as never,
        });
      }
      return wrong;
    }
    await req.payload.update({
      collection: 'customers',
      id: c.id,
      overrideAccess: true,
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date().toISOString() } as never,
    });
    return withCookies(
      json({ ok: true, name: c.name }),
      sessionCookies(signSession(c.id, Number(c.sessionVersion ?? 0)), firstName(c.name)),
    );
  },
};

const logout: Endpoint = {
  path: '/account/logout',
  method: 'post',
  handler: (req) => {
    if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403);
    return withCookies(json({ ok: true }), clearedCookies());
  },
};

const me: Endpoint = {
  path: '/account/me',
  method: 'get',
  handler: async (req) => {
    const c = await currentCustomer(req);
    if (!c) return withCookies(json({ error: 'Not signed in' }, 401), clearedCookies());
    return json({ profile: profile(c), moves: await movesOf(req, c) });
  },
};

const updateMe: Endpoint = {
  path: '/account/me',
  method: 'patch',
  handler: async (req) => {
    if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403);
    const c = await currentCustomer(req);
    if (!c) return json({ error: 'Not signed in' }, 401);
    const b = await body(req);
    const data: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    if ('name' in b) {
      const name = str(b.name, 80);
      if (name.length < 2) errors.name = 'Enter your full name.';
      else data.name = name;
    }
    if ('email' in b) {
      const email = str(b.email, 120).toLowerCase();
      if (email && !EMAIL.test(email)) errors.email = 'Enter a valid email, or leave it blank.';
      else data.email = email || null;
    }
    if ('city' in b) {
      const city = str(b.city, 60);
      if (!city) errors.city = 'Choose your city.';
      else data.city = city;
    }
    if ('addresses' in b) {
      const a = cleanAddresses(b.addresses);
      if (typeof a === 'string') errors.addresses = a;
      else data.addresses = a;
    }
    if (Object.keys(errors).length)
      return json({ error: 'Check the highlighted fields.', fields: errors }, 422);
    const saved = (await req.payload.update({
      collection: 'customers',
      id: c.id,
      overrideAccess: true,
      data: data as never,
    })) as unknown as CustomerDoc;
    const res = json({ ok: true, profile: profile({ ...c, ...saved }) });
    // A new first name for the header greeting.
    return data.name ? withCookies(res, [sessionCookies('', firstName(saved.name))[1]!]) : res;
  },
};

const password: Endpoint = {
  path: '/account/password',
  method: 'post',
  handler: async (req) => {
    if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403);
    const c = await currentCustomer(req);
    if (!c) return json({ error: 'Not signed in' }, 401);
    const b = await body(req);
    const current = typeof b.current === 'string' ? b.current : '';
    const next = typeof b.next === 'string' ? b.next : '';
    if (rateLimited(`password:${c.id}`, 10, 15 * 60_000)) {
      return json({ error: 'Too many attempts. Wait a few minutes and try again.' }, 429);
    }
    if (current.length > MAX_PASSWORD || !(await verifyPassword(current, c.passwordHash))) {
      return json(
        { error: 'Your current password is not right.', fields: { current: 'Not right.' } },
        422,
      );
    }
    if (next.length < MIN_PASSWORD || next.length > MAX_PASSWORD) {
      return json(
        {
          error: `Use at least ${MIN_PASSWORD} characters.`,
          fields: { next: `At least ${MIN_PASSWORD} characters.` },
        },
        422,
      );
    }
    const version = Number(c.sessionVersion ?? 0) + 1;
    await req.payload.update({
      collection: 'customers',
      id: c.id,
      overrideAccess: true,
      data: {
        passwordHash: await hashPassword(next),
        sessionVersion: version,
        passwordChangedAt: new Date().toISOString(),
        passwordChangedBy: null,
      } as never,
    });
    // Other devices are signed out; this one gets a fresh session.
    return withCookies(
      json({ ok: true }),
      sessionCookies(signSession(c.id, version), firstName(c.name)),
    );
  },
};

export const accountEndpoints: Endpoint[] = [signup, login, logout, me, updateMe, password];
