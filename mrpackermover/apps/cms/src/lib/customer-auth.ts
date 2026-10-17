import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PayloadRequest } from 'payload';

/**
 * Customer sign-in for the website (/account), kept apart from Payload's own auth on
 * purpose.
 *
 * Staff sign in to the CMS through Payload, and much of the CMS's access control reads
 * "is anyone signed in?" (`req.user`). Had customers been a Payload auth collection, a
 * customer's token would count as "signed in" there, and every such check would have to
 * learn the difference. So customers are an ordinary collection with their own password
 * hash and their own session cookie, which only the /api/account endpoints read. A
 * customer can never become `req.user`, and nothing the staff side relies on changes.
 *
 *   - Passwords: scrypt with a random salt (Node's crypto, no extra dependency).
 *   - Sessions: a signed token (HMAC-SHA256 over PAYLOAD_SECRET) in an HttpOnly cookie,
 *     carrying the customer id, an expiry and the account's session version. Setting a
 *     new password bumps the version, which signs that account out everywhere.
 *   - A second, readable cookie holds only the first name, so the static site's header
 *     can say "Hi, Ravi" without an API call on every page.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = 'mpm_session';
export const NAME_COOKIE = 'mpm_name';
/** Stay signed in for 30 days, renewed on each sign-in. */
export const SESSION_DAYS = 30;
/** Five wrong passwords in a row lock the account for 15 minutes. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
export const MIN_PASSWORD = 8;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  const [scheme, saltB64, hashB64] = (stored ?? '').split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const secret = (): string => {
  const s = process.env.PAYLOAD_SECRET;
  if (!s) throw new Error('PAYLOAD_SECRET is not set');
  return `customer-session:${s}`;
};
const b64url = (b: Buffer | string): string => Buffer.from(b).toString('base64url');
const sign = (body: string): string =>
  createHmac('sha256', secret()).update(body).digest('base64url');

export interface Session {
  /** Customer id. */
  sub: string;
  /** The account's session version when the token was issued. */
  v: number;
  /** Expiry, seconds since the epoch. */
  exp: number;
}

export function signSession(id: string | number, version: number): string {
  const body = b64url(
    JSON.stringify({
      sub: String(id),
      v: version,
      exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400,
    } satisfies Session),
  );
  return `${body}.${sign(body)}`;
}

/** The session in a token, if the signature holds and it has not expired. */
export function readToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
    return typeof s.sub === 'string' && typeof s.v === 'number' && s.exp * 1000 > Date.now()
      ? s
      : null;
  } catch {
    return null;
  }
}

export function cookieValue(req: PayloadRequest, name: string): string | undefined {
  const header = req.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name)
      return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

const secure = (): string => (process.env.NODE_ENV === 'production' ? '; Secure' : '');

/** Both cookies for a fresh session. */
export function sessionCookies(token: string, firstName: string): string[] {
  const age = SESSION_DAYS * 86400;
  return [
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${age}; HttpOnly; SameSite=Lax${secure()}`,
    `${NAME_COOKIE}=${encodeURIComponent(firstName)}; Path=/; Max-Age=${age}; SameSite=Lax${secure()}`,
  ];
}

export function clearedCookies(): string[] {
  return [
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure()}`,
    `${NAME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure()}`,
  ];
}

/** Ten digits starting 6-9, after +91, 91 or a leading 0: the quote form's rule. */
export function phoneCore(raw: string): string | null {
  const d = (raw ?? '').replace(/\D/g, '');
  const core =
    d.length === 12 && d.startsWith('91')
      ? d.slice(2)
      : d.length === 11 && d.startsWith('0')
        ? d.slice(1)
        : d;
  return /^[6-9]\d{9}$/.test(core) ? core : null;
}

/**
 * A state-changing request must come from our own pages. The cookie is SameSite=Lax, and
 * a browser always sends Origin on a cross-site POST, so a page elsewhere cannot act for
 * a signed-in customer.
 */
export function sameOrigin(req: PayloadRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  let from: string;
  try {
    from = new URL(origin).host;
  } catch {
    return false;
  }
  // The hosts this request was addressed to: Caddy keeps the public host, and both it and
  // the local dev proxy (xfwd) pass it on as X-Forwarded-Host. Plus the site's own address,
  // in case a proxy in between rewrites both.
  const allowed = new Set(
    [req.headers.get('host'), ...(req.headers.get('x-forwarded-host') ?? '').split(',')]
      .map((h) => h?.trim())
      .filter(Boolean),
  );
  try {
    if (process.env.PUBLIC_SITE_URL) allowed.add(new URL(process.env.PUBLIC_SITE_URL).host);
  } catch {
    /* an unparseable setting adds nothing */
  }
  return allowed.has(from);
}
