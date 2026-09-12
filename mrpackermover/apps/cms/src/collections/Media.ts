import type { CollectionConfig } from 'payload';
import { cldUrl } from '@mpm/shared';
import { hideFromSalesRoles, isContentStaff, publicRead } from '../access/index.js';

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
  admin: {
    hidden: hideFromSalesRoles,
    group: 'Content',
  },
  access: {
    read: publicRead,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
  },
  upload: {
    mimeTypes: ['image/*'],
    /**
     * Normalise every upload to a sensible web image.
     *
     * The delivery strategy above assumes Cloudinary transforms on the fly. When
     * CLOUDINARY_* is not set, Media falls back to local disk and `cldUrl` becomes a
     * no-op, so whatever was uploaded is what visitors download — and a 2.1 MB PNG
     * straight out of an image generator became the home page's Largest Contentful
     * Paint. Re-encoding it to WebP at the same dimensions cost 92% of the bytes and
     * nothing visible.
     *
     * These two options transform the stored file only. They add no database columns
     * (unlike `imageSizes`), so no migration is needed. Cloudinary, once configured,
     * simply receives a smaller original.
     */
    resizeOptions: {
      // Wider than any slot we render; the heroes crop with background-size: cover.
      width: 1920,
      fit: 'inside',
      withoutEnlargement: true,
    },
    formatOptions: { format: 'webp', options: { quality: 80 } },
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
