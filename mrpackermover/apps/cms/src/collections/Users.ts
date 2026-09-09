import type { Access, CollectionConfig, FieldAccess, PayloadRequest } from 'payload';
import { isAdmin, isAdminField, isRole } from '../access/index.js';
import { clientIp } from '../endpoints/_lib.js';

/**
 * CMS staff accounts.
 *
 * Five roles. `admin`, `editor` and `ops` are unchanged from before the sales
 * hierarchy existed; `handler` and `sales` are the lead pipeline (see access/index.ts).
 *
 * A handler may be granted the right to create salespeople. That is a real privilege,
 * so it is fenced on three sides rather than one:
 *
 *   1. `create` access requires the flag, and refuses if it is absent.
 *   2. The `role` FIELD is admin-only to write, so a handler's form cannot submit one.
 *   3. `beforeValidate` forces `role: 'sales'` and clears the flag on anything a
 *      handler creates, so a hand-crafted REST call cannot mint an admin either.
 *
 * Hiding the field in the UI alone would leave the API wide open, which is the usual
 * way this exact feature gets exploited.
 */

/** Admins manage everyone. A handler may add salespeople only if explicitly allowed. */
const canCreateUser: Access = ({ req }) => {
  if (isRole(req, 'admin')) return true;
  return (
    isRole(req, 'handler') &&
    Boolean((req.user as { canCreateSalesUsers?: boolean })?.canCreateSalesUsers)
  );
};

/**
 * Any signed-in staff member can read the staff list. This is deliberately broader than
 * the rest of the lockdown, and the reason is concrete: a relationship Payload cannot
 * read renders as a bare row id. Restricting a salesperson to their own record made
 * every lead say "assigned by 3" instead of naming the handler, and the note author on
 * their own leads was unreadable too.
 *
 * The tradeoff is that colleagues can see each other's name, role and email. That is
 * ordinary for an internal CRM and is the access this collection shipped with before
 * the sales hierarchy existed; the data worth protecting here is the customers' , not
 * the team's own directory. Creating, editing and deleting staff stay locked down.
 */
const usersRead: Access = ({ req }) => Boolean(req.user);

/**
 * Admins update anyone. A handler may update the salespeople they manage, but never
 * themselves — self-edit is the shortest path to self-promotion, even with the field
 * guard in place.
 */
const usersUpdate: Access = ({ req }) => {
  if (!req.user) return false;
  if (isRole(req, 'admin')) return true;
  if (
    isRole(req, 'handler') &&
    (req.user as { canCreateSalesUsers?: boolean }).canCreateSalesUsers
  ) {
    return { role: { equals: 'sales' } };
  }
  return false;
};

/** Only an admin may set or change a role. Handlers get 'sales' forced by the hook. */
const roleFieldAccess: FieldAccess = ({ req }) => isRole(req, 'admin');

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'email', 'role'],
  },
  access: {
    create: canCreateUser,
    read: usersRead,
    update: usersUpdate,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data;
        // A non-admin creating a user can only ever produce a salesperson, whatever
        // the request body said.
        //
        // `req.user` must be present for this to apply. A server-side call with no
        // authenticated user (the seed script, a migration, `overrideAccess: true`)
        // would otherwise be treated as "not an admin" and have its role silently
        // rewritten to `sales` — which is exactly what happened the first time.
        if (req.user && !isRole(req, 'admin')) {
          if (operation === 'create') data.role = 'sales';
          else delete data.role;
          delete data.canCreateSalesUsers;
        }
        return data;
      },
    ],
    // Deliberately NOT async and deliberately not returning the promise: Payload awaits
    // whatever an auth hook returns, and an audit write must never sit inside the login
    // request. See scheduleAuthEvent for why that matters.
    afterLogin: [
      ({ req, user }) => {
        scheduleAuthEvent(req, 'login', user as AuthUser);
      },
    ],
    afterLogout: [
      ({ req }) => {
        scheduleAuthEvent(req, 'logout', req.user as AuthUser);
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      access: { create: roleFieldAccess, update: roleFieldAccess },
      admin: {
        description: 'Handler sees every lead and distributes them. Sales sees only their own.',
      },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Ops', value: 'ops' },
        { label: 'Handler (sales desk)', value: 'handler' },
        { label: 'Sales', value: 'sales' },
      ],
    },
    {
      name: 'canCreateSalesUsers',
      type: 'checkbox',
      defaultValue: false,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description:
          'Lets this handler add salespeople of their own. Admin-only to grant. Ignored for other roles.',
        condition: (data) => data?.role === 'handler',
      },
    },
  ],
};

/**
 * Queue a row for the sign-in trail, to be written AFTER the login request finishes.
 *
 * Writing it inline deadlocks. `payload.create` opens its own database connection, but
 * the login transaction is still holding one and is itself waiting on this hook, so the
 * two block each other until the pool times out. The visible symptom was a login that
 * took ~54 seconds, returned 200, never redirected, and left the audit table empty.
 *
 * So: snapshot everything needed from `req` synchronously (it must not be touched once
 * the response is on its way), return immediately, and let the write run on the next
 * tick once login has committed and released its connection. A failure here is
 * swallowed — an audit row is never worth blocking or breaking authentication for.
 */
type AuthUser = { id?: string | number; email?: string; role?: string; name?: string } | null;

function scheduleAuthEvent(req: PayloadRequest, event: 'login' | 'logout', user: AuthUser): void {
  try {
    if (!user?.id) return;
    const label = event === 'login' ? 'Signed in' : 'Signed out';
    const data = {
      summary: `${label} · ${user.name ?? user.email ?? 'Unknown'}`,
      event,
      user: user.id,
      userEmail: user.email ?? null,
      userRole: user.role ?? null,
      ip: clientIp(req) ?? null,
      userAgent: req.headers?.get('user-agent') ?? null,
    };
    const { payload } = req;
    setImmediate(() => {
      void payload
        .create({ collection: 'login-events', overrideAccess: true, data: data as never })
        .catch(() => {
          /* the trail is best-effort; never surface it to the person signing in */
        });
    });
  } catch {
    /* never block authentication on an audit write */
  }
}
