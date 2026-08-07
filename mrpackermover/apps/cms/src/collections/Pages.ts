import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * The fixed set of editorial pages whose copy is editable from the CMS. Each entry
 * controls one hand-built page: the CMS supplies the hero copy (eyebrow, heading,
 * intro) + SEO for all of them, and the main body for the prose pages (Terms,
 * Privacy, Licences). Blank fields fall back to the built-in copy, so the bespoke
 * designs are never flattened.
 */
export const EDITORIAL_PAGE_KEYS = [
  { label: 'About us  (/company/about)', value: 'about' },
  { label: 'Terms of service  (/terms)', value: 'terms' },
  { label: 'Privacy policy  (/privacy)', value: 'privacy' },
  { label: 'Licences  (/company/licences)', value: 'licences' },
  { label: 'Claims  (/claims)', value: 'claims' },
  { label: 'Insurance  (/insurance)', value: 'insurance' },
  { label: 'Protection  (/protection)', value: 'protection' },
  { label: 'Fraud check  (/fraud-check)', value: 'fraud-check' },
  { label: 'Raise a complaint  (/raise-a-complaint)', value: 'raise-a-complaint' },
];

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Editorial page', plural: 'Editorial pages' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'key', 'updatedAt'],
    description:
      'Editable copy for the trust, legal and company pages. Blank fields keep the built-in text.',
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
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'The page heading (H1).' },
    },
    {
      name: 'key',
      type: 'select',
      required: true,
      unique: true,
      admin: { position: 'sidebar', description: 'Which page this entry controls.' },
      options: EDITORIAL_PAGE_KEYS,
    },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Small label shown above the heading in the hero.' },
    },
    { name: 'intro', type: 'textarea', admin: { description: 'The intro paragraph in the hero.' } },
    {
      name: 'body',
      type: 'richText',
      admin: {
        description:
          'Main content. Rendered on the prose pages (Terms, Privacy, Licences); leave blank to keep the built-in text.',
      },
    },
    {
      name: 'seoDescription',
      type: 'text',
      maxLength: 200,
      admin: { position: 'sidebar', description: 'Meta description (≈150 chars).' },
    },
  ],
};
