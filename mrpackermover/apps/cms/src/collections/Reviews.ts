import type { CollectionConfig } from 'payload';
import { hideFromSalesRoles, isContentStaff, publishedOrStaff } from '../access/index.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Verified feedback (Doc 01 §5, Doc 02 §8). Reviews come from real completed jobs
 * ONLY, tied to a job reference. Negative reviews are published with our response.
 * Individual `Review` markup only — never AggregateRating on the Organization.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'jobRef',
    group: 'Trust & data',
    defaultColumns: ['jobRef', 'rating', 'date'],
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
    {
      name: 'jobRef',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Real job reference. A review with no job cannot be published.' },
    },
    { name: 'authorName', type: 'text', required: true },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'text', type: 'textarea', required: true },
    { name: 'date', type: 'date', required: true },
    { name: 'location', type: 'relationship', relationTo: 'locations' },
    { name: 'service', type: 'relationship', relationTo: 'services' },
    { name: 'verifiedBy', type: 'text', admin: { description: 'Who verified the job/review.' } },
    {
      name: 'response',
      type: 'textarea',
      admin: { description: 'Our public response (required for negative reviews).' },
    },
  ],
};
