import type { CollectionConfig } from 'payload';
import { isAuthenticated } from '../access/index.js';

/**
 * Quote-form submissions. Created by the public `/quote` endpoint (create access is
 * open so the form can submit); read and worked only by staff. This is where the
 * ops team sees and progresses every lead — with a status pipeline.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    group: 'Inbox',
    defaultColumns: ['name', 'phone', 'service', 'source', 'status', 'createdAt'],
    description:
      'Every quote form and price check lands here. Work them through the status pipeline; filter by "source".',
  },
  access: {
    // The public form must be able to create a lead; everything else is staff-only.
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
        { name: 'phone', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'service', type: 'text', admin: { width: '50%' } },
        { name: 'moveSize', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'pickup', type: 'text', admin: { width: '50%' } },
        { name: 'dropLocation', type: 'text', label: 'Drop location', admin: { width: '50%' } },
      ],
    },
    { name: 'moveDate', type: 'date' },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'quote-form',
      admin: {
        position: 'sidebar',
        description: 'How this lead came in.',
      },
      options: [
        { label: 'Quote form', value: 'quote-form' },
        { label: 'Price check', value: 'price-check' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
      ],
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes on this lead.' } },
    { name: 'sourceIp', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'sourcePage', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
  ],
};
