import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Aggregated operational data (Doc 01 §5). Feeds serviceability proof and the
 * publish gate: jobs completed in the last 12 months, on-time %, damage %, and the
 * median claim-settlement days — the unflattering-but-honest numbers competitors
 * will not publish.
 */
export const JobsStats: CollectionConfig = {
  slug: 'jobs-stats',
  labels: { singular: 'Jobs stat', plural: 'Jobs stats' },
  admin: { useAsTitle: 'label', group: 'Trust', defaultColumns: ['label', 'month', 'count'] },
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
      admin: { description: 'e.g. "Delhi · Home Shifting · 2026-07".' },
    },
    { name: 'location', type: 'relationship', relationTo: 'locations' },
    { name: 'service', type: 'relationship', relationTo: 'services' },
    { name: 'month', type: 'text', admin: { description: 'YYYY-MM.' } },
    {
      type: 'row',
      fields: [
        { name: 'count', type: 'number', required: true, admin: { width: '25%' } },
        { name: 'onTimePct', type: 'number', min: 0, max: 100, admin: { width: '25%' } },
        { name: 'damagePct', type: 'number', min: 0, max: 100, admin: { width: '25%' } },
        { name: 'avgSettlementDays', type: 'number', admin: { width: '25%' } },
      ],
    },
  ],
};
