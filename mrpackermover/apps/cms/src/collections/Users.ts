import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/index.js';

/** CMS staff accounts. `admin` role gates the internal-only operating_bases data. */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email', group: 'System' },
  access: {
    create: isAdmin,
    read: ({ req }) => Boolean(req.user),
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Ops', value: 'ops' },
      ],
    },
  ],
};
