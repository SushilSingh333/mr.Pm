import type { CollectionConfig } from 'payload';
import { isAuthenticated } from '../access/index.js';

/**
 * Applications submitted from the careers page. Created by the public `/api/apply`
 * endpoint (create is open so the form can submit); read and worked only by staff,
 * through a status pipeline.
 */
export const JobApplications: CollectionConfig = {
  slug: 'job-applications',
  labels: { singular: 'Application', plural: 'Job applications' },
  admin: {
    useAsTitle: 'name',
    group: 'Careers',
    defaultColumns: ['name', 'email', 'position', 'status', 'createdAt'],
    description: 'Every careers-form submission lands here.',
  },
  access: {
    create: () => true,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', admin: { width: '50%' } },
        {
          name: 'position',
          type: 'text',
          admin: { width: '50%', description: 'Role the applicant applied for.' },
        },
      ],
    },
    { name: 'message', type: 'textarea', label: 'Cover note' },
    {
      name: 'resumeUrl',
      type: 'text',
      label: 'Resume / portfolio link',
      admin: { description: 'A link to a CV or portfolio, if the applicant provided one.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Shortlisted', value: 'shortlisted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Hired', value: 'hired' },
      ],
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes on this applicant.' },
    },
    { name: 'sourceIp', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
  ],
};
