import type { Access, CollectionConfig, FieldAccess, PayloadRequest, Where } from 'payload';
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
 * Nobody browses the staff directory except an admin.
 *
 *   admin    — everyone.
 *   handler  — salespeople (they must pick one to assign work to) plus themselves.
 *   sales    — themselves only.
 *
 * This was briefly opened to all staff because a relationship Payload cannot read
 * renders as a bare row id, and a salesperson was seeing "assigned by 3". The fix was
 * not to widen access: the Leads collection now stamps `assignedByName` and a note's
 * `authorName` as plain text when they are written, so a name displays without anyone
 * needing to read the person's record. That keeps the directory shut.
 */
const usersRead: Access = ({ req }) => {
  if (!req.user) return false;
  if (isRole(req, 'admin')) return true;
  const id = (req.user as { id?: string | number }).id;
  if (isRole(req, 'handler')) {
    return { or: [{ role: { equals: 'sales' } }, { id: { equals: id } }] } as Where;
  }
  return { id: { equals: id } } as Where;
};

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
    // Only people who actually manage staff see the collection at all. A salesperson
    // never does; a handler only when they have been granted the right to add
    // salespeople. Access above is the real boundary — this just keeps the nav honest.
    hidden: ({ user }) => {
      const u = user as { role?: string; canCreateSalesUsers?: boolean } | undefined;
      if (u?.role === 'admin') return false;
      return !(u?.role === 'handler' && u?.canCreateSalesUsers);
    },
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
