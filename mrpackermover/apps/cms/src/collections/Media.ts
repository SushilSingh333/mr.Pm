import type { CollectionConfig } from 'payload';
import { cldUrl } from '@mpm/shared';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';

/**
 * Uploads: photos of OUR crews, trucks, and warehouses (Doc 01 §2) — never stock
 * photos of smiling movers. Alt text is data-driven and required for accessibility.
 *
 * Originals are stored on Cloudinary (see payload.config `cloudStoragePlugin`), which
 * resizes and format-converts on delivery via URL transforms — so we keep a single
 * original per image (no Payload-side `imageSizes`). The admin preview is a small
 * Cloudinary transform of the stored URL. Without Cloudinary creds set, Media falls
 * back to local-disk storage and `adminThumbnail` returns the plain URL unchanged.
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
    mimeTypes: ['image/*'],
    adminThumbnail: ({ doc }) =>
      typeof doc?.url === 'string' ? cldUrl(doc.url, 'f_auto,q_auto,c_fill,w_120,h_120') : null,
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
