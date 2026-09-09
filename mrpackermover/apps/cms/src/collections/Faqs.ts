import type { CollectionConfig } from 'payload';
import { hideFromSalesRoles, isContentStaff, publicReadExceptSalesRoles } from '../access/index.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/** Scoped Q&A (Doc 01 §5). Seeded editorially, grown from real support tickets. */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'question',
    group: 'Content',
    defaultColumns: ['question', 'scope', 'priority'],
  },
  access: {
    read: publicReadExceptSalesRoles,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
  },
  hooks: { afterChange: [triggerBuildOnChange] },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'global',
      options: ['global', 'city', 'service', 'lane'].map((v) => ({ label: v, value: v })),
    },
    { name: 'city', type: 'relationship', relationTo: 'locations' },
    { name: 'service', type: 'relationship', relationTo: 'services' },
    { name: 'lane', type: 'relationship', relationTo: 'lanes' },
    { name: 'priority', type: 'number', defaultValue: 100 },
  ],
};
