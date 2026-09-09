import type { CollectionConfig } from 'payload';
import { hideFromSalesRoles, isContentStaff, publishedOrStaff } from '../access/index.js';
import { seoOverrideFields } from '../fields/seo.js';
import { slugField } from '../fields/slug.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/** The service catalogue: 8 national services + the corporate silo (flagged). */
export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'name',
    group: 'Catalogue',
    defaultColumns: ['name', 'isCorporate'],
  },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
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
    {
      name: 'editorialNote',
      type: 'richText',
      label: 'Page content',
      admin: {
        description:
          'The prose that runs on the national service page: how the job actually works, what decides the price, what to have ready. Written per service, not templated.',
      },
    },
    { name: 'inclusions', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'exclusions', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'typicalDuration', type: 'text' },
    { name: 'insuranceTerms', type: 'textarea' },
    seoOverrideFields('this service page'),
  ],
};
