import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Routes we actually operate (Doc 01 §4). The commercial prize: high-intent,
 * high-value lanes. Only lanes with a real rate card, real transit time, and at
 * least one completed job get a page — enforced by the publish gate.
 */
export const Lanes: CollectionConfig = {
  slug: 'lanes',
  admin: { useAsTitle: 'label', group: 'Catalogue', defaultColumns: ['label', 'jobCount'] },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: { afterChange: [triggerBuildOnChange] },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: {
        description:
          'Display label, e.g. "Delhi to Bengaluru". Slug is derived from the endpoints.',
      },
    },
    { name: 'origin', type: 'relationship', relationTo: 'locations', required: true },
    { name: 'destination', type: 'relationship', relationTo: 'locations', required: true },
    {
      type: 'row',
      fields: [
        { name: 'roadKm', type: 'number', admin: { width: '33%' } },
        { name: 'transitDays', type: 'number', admin: { width: '33%' } },
        { name: 'jobCount', type: 'number', defaultValue: 0, admin: { width: '34%' } },
      ],
    },
    { name: 'frequency', type: 'text', admin: { description: 'e.g. "daily", "3× a week".' } },
    {
      name: 'overnightBlock',
      type: 'richText',
      admin: {
        description:
          'The overnight-shifting block: load by 8 PM at origin, roll out after no-entry, deliver next morning. Nobody else has this page.',
      },
    },
    {
      name: 'borderNotes',
      type: 'textarea',
      admin: { description: 'Toll, permit, and state-border notes; seasonal caveats.' },
    },
  ],
};
