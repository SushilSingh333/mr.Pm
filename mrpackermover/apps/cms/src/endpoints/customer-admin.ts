import type { Endpoint, PayloadRequest } from 'payload';
import { json } from './_lib.js';
import {
  hashPassword,
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  MAX_PASSWORD,
  MIN_PASSWORD,
  sameOrigin,
} from '../lib/customer-auth.js';

/**
 * The admin's side of a customer's password, behind the "Password and sign-in" panel on
 * a customer (components/customers/CustomerSecurity.tsx). Mounted on the Customers
 * collection, so they live at /api/customers/:id/…
 *
 *   GET  security  - how they sign in: when the password was last set and by whom, last
 *                    sign-in, wrong tries, and whether the account is locked.
 *   POST password  - set a new password: signs them out everywhere and unlocks them.
 *   POST unlock    - clear a lockout after too many wrong passwords.
 *   POST signout   - sign them out on every device, password unchanged.
 *
 * Admins only (the same rule as the collection). The password itself is never stored or
 * returned: the panel shows the one it just sent, once.
 */

type Customer = {
  id: string | number;
  name?: string;
  phone?: string;
  passwordHash?: string | null;
  sessionVersion?: number | null;
  failedLogins?: number | null;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  passwordChangedAt?: string | null;
  passwordChangedBy?:
    { id?: string | number; name?: string; email?: string } | string | number | null;
};

const isAdminReq = (req: PayloadRequest): boolean =>
  (req.user as { role?: string } | null | undefined)?.role === 'admin';

async function load(req: PayloadRequest): Promise<Customer | null> {
  const id = req.routeParams?.id;
  if (id === undefined || id === null || id === '') return null;
  try {
    return (await req.payload.findByID({
      collection: 'customers',
      id: String(id),
      depth: 1,
      overrideAccess: true,
    })) as unknown as Customer;
  } catch {
    return null;
  }
}

async function save(req: PayloadRequest, c: Customer, data: Record<string, unknown>) {
  await req.payload.update({
    collection: 'customers',
    id: c.id,
    overrideAccess: true,
    overrideLock: true,
    data: data as never,
  });
}

function siteSignIn(): string {
  try {
    return new URL('/account/login', process.env.PUBLIC_SITE_URL || 'https://mrmoverpacker.com')
      .href;
  } catch {
    return 'https://mrmoverpacker.com/account/login';
  }
}

/** What the panel shows. Everything needed to read, nothing secret. */
function status(c: Customer) {
  const by = c.passwordChangedBy;
  const locked = c.lockedUntil && new Date(c.lockedUntil) > new Date() ? c.lockedUntil : null;
  return {
    name: c.name ?? '',
    phone: c.phone ?? '',
    hasPassword: Boolean(c.passwordHash),
    passwordChangedAt: c.passwordChangedAt ?? null,
    // An admin's name when an admin set it; null when the customer set it themselves.
    passwordChangedBy:
      by && typeof by === 'object' ? by.name || by.email || 'An admin' : by ? 'An admin' : null,
    createdAt: c.createdAt ?? null,
    lastLoginAt: c.lastLoginAt ?? null,
    failedLogins: Number(c.failedLogins ?? 0),
    lockedUntil: locked,
    maxFailed: MAX_FAILED_LOGINS,
    lockMinutes: LOCK_MINUTES,
    minPassword: MIN_PASSWORD,
    signInUrl: siteSignIn(),
  };
}

const adminId = (req: PayloadRequest): string =>
  String((req.user as { id?: string | number } | null | undefined)?.id ?? '?');

/** Wraps a handler: admins only, same origin for anything that changes data, and the customer must exist. */
const guarded =
  (fn: (req: PayloadRequest, c: Customer) => Promise<Response>) =>
  async (req: PayloadRequest): Promise<Response> => {
    if (!isAdminReq(req)) return json({ error: 'Only an admin can do this.' }, 403);
    // The admin's own cookie is what signs these in, so a page on another site (or a
    // sibling subdomain) must not be able to fire them: the request has to come from here.
    if (req.method !== 'GET' && !sameOrigin(req)) return json({ error: 'Not allowed' }, 403);
    const c = await load(req);
    if (!c) return json({ error: 'Customer not found.' }, 404);
    return fn(req, c);
  };

async function bodyOf(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    const b = (await req.json?.()) as unknown;
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const customerAdminEndpoints: Endpoint[] = [
  {
    path: '/:id/security',
    method: 'get',
    handler: guarded(async (_req, c) => json(status(c))),
  },
  {
    path: '/:id/password',
    method: 'post',
    handler: guarded(async (req, c) => {
      const b = await bodyOf(req);
      const next = typeof b.password === 'string' ? b.password.trim() : '';
      if (next.length < MIN_PASSWORD || next.length > MAX_PASSWORD) {
        return json({ error: `Use ${MIN_PASSWORD} to ${MAX_PASSWORD} characters.` }, 422);
      }
      await save(req, c, {
        passwordHash: await hashPassword(next),
        sessionVersion: Number(c.sessionVersion ?? 0) + 1,
        failedLogins: 0,
        lockedUntil: null,
        passwordChangedAt: new Date().toISOString(),
        passwordChangedBy: (req.user as { id: string | number }).id,
      });
      req.payload.logger.info(
        `Customer ${c.id}: password reset by admin ${(req.user as { id: string | number }).id}`,
      );
      return json(status((await load(req)) ?? c));
    }),
  },
  {
    path: '/:id/unlock',
    method: 'post',
    handler: guarded(async (req, c) => {
      await save(req, c, { failedLogins: 0, lockedUntil: null });
      req.payload.logger.info(`Customer ${c.id}: unlocked by admin ${adminId(req)}`);
      return json(status((await load(req)) ?? c));
    }),
  },
  {
    path: '/:id/signout',
    method: 'post',
    handler: guarded(async (req, c) => {
      await save(req, c, { sessionVersion: Number(c.sessionVersion ?? 0) + 1 });
      req.payload.logger.info(`Customer ${c.id}: signed out everywhere by admin ${adminId(req)}`);
      return json(status((await load(req)) ?? c));
    }),
  },
];
