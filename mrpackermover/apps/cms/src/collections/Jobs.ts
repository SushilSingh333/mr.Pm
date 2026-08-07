import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { slugField } from '../fields/slug.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Careers postings, rendered on /company/careers. Add a role here and it appears on
 * the site (once published); untick "Open" to hide it without deleting. Applications
 * to these roles land in the Job Applications collection.
 */
export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Job opening', plural: 'Job openings' },
  admin: {
    useAsTitle: 'title',
    group: 'Careers',
    defaultColumns: ['title', 'team', 'employmentType', 'isOpen'],
    description: 'Open roles shown on the careers page.',
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
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      type: 'row',
      fields: [
        {
          name: 'team',
          type: 'text',
          admin: { width: '50%', description: 'e.g. Operations, Field, Support, Trust.' },
        },
        {
          name: 'employmentType',
          type: 'select',
          defaultValue: 'full-time',
          admin: { width: '50%' },
          options: [
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Internship', value: 'internship' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'location', type: 'text', defaultValue: 'India', admin: { width: '50%' } },
        {
          name: 'isOpen',
          type: 'checkbox',
          defaultValue: true,
          admin: { width: '50%', description: 'Show this role as currently open.' },
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'One or two lines shown on the roles list.' },
    },
    {
      name: 'description',
      type: 'richText',
      admin: { description: 'Optional fuller description (responsibilities, requirements).' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
  ],
};
