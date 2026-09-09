import type { CollectionConfig } from 'payload';
import { isAdmin, adminOnlyNav } from '../access/index.js';

/**
 * Immutable record of every CMS sign-in and sign-out.
 *
 * Written only by the auth hooks on `users` (see Users.ts) — never by hand, which is
 * why `create` and `update` are closed to everyone including admins. Rows are
 * append-only so the trail cannot be edited after the fact; an admin can still delete,
 * because a security log with no retention control becomes its own liability.
 *
 * Read is admin-only: knowing when each person signed in, and from which address, is
 * exactly the kind of detail the sales hierarchy should not have about each other.
 *
 * Note on coverage: Payload exposes `afterLogin` and `afterLogout`, so successful
 * sign-in and explicit sign-out are recorded. There is no hook for a FAILED password
 * attempt, so failures are not captured here. Payload's own lockout (maxLoginAttempts)
 * is what defends that path.
 */
export const LoginEvents: CollectionConfig = {
  slug: 'login-events',
  admin: {
    group: 'Settings',
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'event', 'user', 'ip', 'createdAt'],
    hidden: adminOnlyNav,
    description:
      'Sign-in and sign-out history for every CMS account. Written automatically; rows cannot be edited.',
  },
  access: {
    // Only the auth hooks write here, and they pass overrideAccess.
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'summary',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated label, shown in the list.',
      },
    },
    {
      name: 'event',
      type: 'select',
      required: true,
      options: [
        { label: 'Signed in', value: 'login' },
        { label: 'Signed out', value: 'logout' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'userEmail',
      type: 'text',
      admin: {
        readOnly: true,
        description:
          'Kept alongside the relationship so the trail survives the account being deleted.',
      },
    },
    { name: 'userRole', type: 'text', admin: { readOnly: true } },
    { name: 'ip', type: 'text', label: 'IP address', admin: { readOnly: true } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
  ],
};
