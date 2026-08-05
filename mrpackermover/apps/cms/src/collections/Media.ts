import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';

/**
 * Uploads: photos of OUR crews, trucks, and warehouses (Doc 01 §2) — never stock
 * photos of smiling movers. Alt text is data-driven and required for accessibility.
 * Images are resized/served by Cloudflare Images; originals are stored here.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: publishedOrStaff,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    imageSizes: [
      { name: 'thumb', width: 400 },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1600 },
    ],
    formatOptions: { format: 'webp', options: { quality: 78 } },
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Descriptive, data-driven. e.g. "MPM crew loading a truck in Powai, Jul 2026".',
      },
    },
    { name: 'location', type: 'relationship', relationTo: 'locations' },
    { name: 'capturedOn', type: 'date' },
  ],
};
