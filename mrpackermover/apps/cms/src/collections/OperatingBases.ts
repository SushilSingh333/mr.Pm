import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/index.js';
import { latLngFields } from '../fields/geo.js';

/**
 * INTERNAL dispatch data — NEVER rendered (ADR-0004).
 *
 * Operating bases feed the serviceability distance in the publish gate (metres to
 * the nearest base). They are admin-only, excluded from the manifest, and must not
 * appear in any API response the public site consumes. Publishing a base as a
 * premises is exactly the fabricated-local-entity failure the strategy forbids.
 */
export const OperatingBases: CollectionConfig = {
  slug: 'operating-bases',
  labels: { singular: 'Operating base (internal)', plural: 'Operating bases (internal)' },
  admin: {
    useAsTitle: 'label',
    group: 'Internal — never rendered',
    description: 'Dispatch geography only. Feeds the publish gate. Never shown on the site.',
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'address', type: 'textarea', required: true },
    ...latLngFields,
    { name: 'licenceIds', type: 'text', admin: { description: 'Internal licence references.' } },
    { name: 'established', type: 'number', admin: { description: 'Year established.' } },
  ],
};
