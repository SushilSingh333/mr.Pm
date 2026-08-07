import type { CollectionConfig } from 'payload';
import { isAuthenticated } from '../access/index.js';

/**
 * Messages from the public contact form. Created by the `/api/contact` endpoint
 * (create is open so the form can submit); read and worked only by staff.
 */
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Message', plural: 'Contact messages' },
  admin: {
    useAsTitle: 'name',
    group: 'Inbox',
    defaultColumns: ['name', 'email', 'subject', 'status', 'createdAt'],
    description: 'Every contact-form submission lands here.',
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
        { name: 'subject', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Handled', value: 'handled' },
      ],
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes.' } },
    { name: 'sourceIp', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'sourcePage', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
  ],
};
