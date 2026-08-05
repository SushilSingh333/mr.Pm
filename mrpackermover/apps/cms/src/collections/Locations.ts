import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { slugField } from '../fields/slug.js';
import { latLngFields } from '../fields/geo.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * The geo tree: state → city → locality. Pages are projections of these records.
 * `is_serviceable` and `nearest_base` gate publication; the distance-to-base is
 * computed from PostGIS and stays internal (ADR-0004).
 */
export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    group: 'Geography',
    defaultColumns: ['name', 'type', 'isServiceable'],
  },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: { afterChange: [triggerBuildOnChange] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'State', value: 'state' },
        { label: 'City', value: 'city' },
        { label: 'Locality', value: 'locality' },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'locations',
      admin: { description: 'City for a locality; state for a city.' },
    },
    ...latLngFields,
    { name: 'pincodes', type: 'text', hasMany: true },
    {
      name: 'populationTier',
      type: 'select',
      options: ['A', 'A-S', 'B'].map((v) => ({ label: v, value: v })),
    },
    {
      name: 'isServiceable',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Gates publication. A city/locality with no completed jobs is not serviceable.',
      },
    },
    {
      name: 'editorialNote',
      type: 'richText',
      admin: {
        description:
          'The unique local operational notes (societies, lift rules, gate timings). The section that must exist or the page does not publish.',
      },
    },
  ],
};
