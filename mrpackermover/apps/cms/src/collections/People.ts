import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';

/** Authors, ops managers, reviewers — real named people behind guides and jobs. */
export const People: CollectionConfig = {
  slug: 'people',
  admin: { useAsTitle: 'name', group: 'Content', defaultColumns: ['name', 'role'] },
  access: {
    read: publishedOrStaff,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'credentials',
      type: 'text',
      admin: { description: 'Credentials shown on guide bylines.' },
    },
  ],
};
