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
        scheduleNavCollapse(req, user as AuthUser);
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
      /**
       * What the form shows has to match what will actually be saved.
       *
       * The field is admin-only to write, so a handler gets it read-only - and it sat
       * there reading "Editor", the static default, while `beforeValidate` below quietly
       * forced every user they created to `sales`. The form said one thing and the
       * database got another, which is why adding a salesperson looked broken when it
       * had in fact worked every time.
       */
      defaultValue: ({ user }: { user?: { role?: string } | null }) =>
        user?.role === 'handler' ? 'sales' : 'editor',
      access: { create: roleFieldAccess, update: roleFieldAccess },
      admin: {
        description:
          'Handler sees every lead and distributes them. Sales sees only their own. Only an admin can change this; a handler always creates salespeople.',
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

/**
 * Start every new person with the nav groups closed.
 *
 * Payload opens all of them. `NavGroup` reads `isOpen` from the user's `nav` preference
 * and, finding nothing there, defaults to expanded - so a first login lands on nine open
 * sections and roughly forty links, and the three or four anyone actually uses are
 * somewhere in the middle of it.
 *
 * Seeding the preference rather than replacing Payload's Nav keeps its own machinery
 * intact: permissions filtering, the settings menu and logout are all still Payload's.
 * The only thing changed is the starting position.
 *
 * It is written once and never again. Opening a group calls `setPreference` with merge
 * on, which is a genuine deep merge (`deepMergeSimple`), so a person's own choices land
 * on top of this and survive every later login. A group added to the config after this
 * runs is not in the stored preference and so opens by default - which is the right
 * behaviour for a section that has just appeared.
 *
 * Scheduled off the request for the same reason the audit row is: an `afterLogin` hook
 * runs inside the login transaction, and awaiting a write in there once turned signing
 * in into a 54-second hang. See scheduleAuthEvent.
 */
function scheduleNavCollapse(req: PayloadRequest, user: AuthUser): void {
  try {
    if (!user?.id) return;
    const { payload } = req;
    const userId = user.id;

    // Read the labels off the config rather than listing them here - a hardcoded list
    // silently stops covering a group the moment someone adds one.
    const labels = new Set<string>();
    for (const entity of [...payload.config.collections, ...payload.config.globals]) {
      const group = (entity.admin as { group?: unknown } | undefined)?.group;
      if (typeof group === 'string' && group) labels.add(group);
    }
    if (labels.size === 0) return;

    const groups: Record<string, { open: boolean }> = {};
    for (const label of labels) groups[label] = { open: false };

    setImmediate(() => {
      void (async () => {
        const existing = await payload.find({
          collection: 'payload-preferences',
          depth: 0,
          limit: 1,
          pagination: false,
          overrideAccess: true,
          where: {
            and: [
              { key: { equals: 'nav' } },
              { 'user.relationTo': { equals: 'users' } },
              { 'user.value': { equals: userId } },
            ],
          } as never,
        });
        // Never overwrite: whatever is there is this person's own arrangement.
        if (existing.docs.length > 0) return;
        await payload.create({
          collection: 'payload-preferences',
          overrideAccess: true,
          // The `user` field on payload-preferences carries a beforeValidate hook that
          // discards whatever is in `data` and writes `req.user` instead, so the owner
          // has to arrive on the request. Passing it in `data` fails validation with
          // "The following field is invalid: User", because with no user on the request
          // the hook returns null for a required field.
          user: { ...(user as object), collection: 'users' } as never,
          data: { key: 'nav', value: { groups } } as never,
        });
      })().catch(() => {
        /* a tidier sidebar is never worth a failed login */
      });
    });
  } catch {
    /* never block authentication */
  }
}
