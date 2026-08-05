import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Real published pricing (Doc 01 §5). Nobody in this category publishes prices;
 * this is a core trust asset. Offer markup on pages must match these figures, so
 * a change here rebuilds the affected pages.
 */
export const RateCards: CollectionConfig = {
  slug: 'rate-cards',
  admin: { useAsTitle: 'label', group: 'Pricing', defaultColumns: ['label', 'scope', 'validFrom'] },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: { afterChange: [triggerBuildOnChange] },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'scope',
      type: 'select',
      required: true,
      options: [
        { label: 'Service', value: 'service' },
        { label: 'City', value: 'city' },
        { label: 'Lane', value: 'lane' },
      ],
    },
    { name: 'service', type: 'relationship', relationTo: 'services' },
    { name: 'city', type: 'relationship', relationTo: 'locations' },
    { name: 'lane', type: 'relationship', relationTo: 'lanes' },
    {
      name: 'bands',
      type: 'array',
      required: true,
      admin: { description: 'One row per volume band (1BHK, 2BHK, 3BHK, ...).' },
      fields: [
        { name: 'band', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'base', type: 'number', required: true, admin: { width: '25%' } },
            { name: 'perKm', type: 'number', admin: { width: '25%' } },
            { name: 'packing', type: 'number', admin: { width: '25%' } },
            { name: 'insurancePct', type: 'number', admin: { width: '25%' } },
          ],
        },
      ],
    },
    { name: 'validFrom', type: 'date', required: true },
  ],
};
