import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { seoOverrideFields } from '../fields/seo.js';
import { slugField } from '../fields/slug.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/** The service catalogue: 8 national services + the corporate silo (flagged). */
export const Services: CollectionConfig = {
  slug: 'services',
  admin: { useAsTitle: 'name', group: 'Catalogue', defaultColumns: ['name', 'isCorporate'] },
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
      name: 'isCorporate',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Part of the corporate relocation silo (higher ticket).' },
    },
    { name: 'summary', type: 'textarea' },
    { name: 'inclusions', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'exclusions', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'typicalDuration', type: 'text' },
    { name: 'insuranceTerms', type: 'textarea' },
    seoOverrideFields('this service page'),
  ],
};
