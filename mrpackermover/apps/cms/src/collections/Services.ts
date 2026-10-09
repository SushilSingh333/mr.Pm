import type { CollectionConfig } from 'payload';
import {
  hideFromSalesRoles,
  isContentStaff,
  publishedOrStaff,
  contentReadVersions,
} from '../access/index.js';
import { seoOverrideFields } from '../fields/seo.js';
import { servicePageField } from '../fields/service-page.js';
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
    // Version history is a second door onto the same rows; Payload leaves it open.
    readVersions: contentReadVersions,
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
    // Retired by "Service page" below (Oct 2026): the page is built from the per-service
    // briefs now, section by section. Hidden rather than removed so no column is dropped
    // and the old text stays readable in the database.
    { name: 'summary', type: 'textarea', admin: { hidden: true } },
    {
      name: 'editorialNote',
      type: 'richText',
      label: 'Page content (old)',
      admin: { hidden: true },
    },
    { name: 'inclusions', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'exclusions', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'typicalDuration', type: 'text' },
    { name: 'insuranceTerms', type: 'textarea' },
    {
      /**
       * The service's heading and the words on its card (home page and /services), so a
       * service reads the same everywhere. Blank = the built-in text from the Services
       * brief (packages/shared/src/service-copy.ts). The meta description is in SEO below.
       */
      name: 'card',
      type: 'group',
      label: 'Heading and cards',
      admin: {
        description:
          'Leave any field blank to keep the current text (see the live page). The meta description is in the SEO section below.',
      },
      fields: [
        {
          name: 'h1',
          type: 'text',
          label: 'Page heading (H1)',
          admin: { placeholder: 'e.g. Home shifting services with one fixed, written price' },
        },
        {
          name: 'lines',
          type: 'textarea',
          label: 'Card text on /services (two lines)',
          admin: { rows: 2 },
        },
        {
          type: 'row',
          fields: [
            { name: 'bestFor', type: 'text', label: 'Best for', admin: { width: '50%' } },
            {
              name: 'homeLine',
              type: 'text',
              label: 'Card text on the home page (one line)',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'linkText',
          type: 'text',
          label: 'Card link text',
          admin: {
            placeholder: 'e.g. Home shifting services',
            description: 'Name the service - never "Learn more" (search engines read this).',
          },
        },
      ],
    },
    servicePageField,
    seoOverrideFields('this service page'),
  ],
};
