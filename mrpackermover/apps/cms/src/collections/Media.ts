import type { CollectionConfig } from 'payload';
import { DAY_ONLY } from '../lib/date-display.js';
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
/**
 * "Sector-52.jpg.jpeg" -> "Sector-52.jpeg". The upload form adds the extension it
 * expects (".jpeg" for a JPEG) to a name that already ends in ".jpg", and the WebP
 * conversion then makes it "Sector-52.jpg.webp". An image extension left in front of
 * the real one is never wanted - it is what broke Cloudinary links (see
 * storage/cloudinary.ts) - so it is dropped here, on every upload, before Payload
 * names the file.
 */
const LEFTOVER_EXT = /\.(?:jpe?g|png|webp|gif|avif|heic|tiff?)(?=\.[a-z0-9]+$)/i;
export const tidyFilename = (name: string): string => {
  let next = name;
  for (let i = 0; i < 5 && LEFTOVER_EXT.test(next); i++) next = next.replace(LEFTOVER_EXT, '');
  return next;
};

export const Media: CollectionConfig = {
  slug: 'media',
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        if (operation !== 'create' && operation !== 'update') return args;
        const file = (args.req as { file?: { name?: string } } | undefined)?.file;
        if (file?.name) file.name = tidyFilename(file.name);
        const data = args.data as { filename?: unknown } | undefined;
        if (data && typeof data.filename === 'string') data.filename = tidyFilename(data.filename);
        return args;
      },
    ],
  },
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
    { name: 'capturedOn', type: 'date', admin: { date: DAY_ONLY } },
  ],
};
