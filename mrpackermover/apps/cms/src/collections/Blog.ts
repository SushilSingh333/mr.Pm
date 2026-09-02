import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { seoOverrideFields } from '../fields/seo.js';
import { slugField } from '../fields/slug.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Blog posts shown on /blog. This is the editor-facing home of the blog: create a
 * post, write the body, set a cover, and Publish — the build picks it up via the
 * manifest (see apps/cms/src/lib/manifest.ts → `blog`). Read-time is computed from the
 * body at build time, so there's no field to keep in sync.
 *
 * Distinct from `Guides` (long-form, cited editorial with a credentialed author); this
 * is the lighter, categorised blog with a plain byline.
 */
export const Blog: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'publishedDate', '_status'],
    description: 'Articles on /blog. Create one, write the body, set a cover, then Publish.',
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
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'One–two sentence summary — shown on the card and used as the meta description.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'Guides',
      options: ['Guides', 'Pricing', 'Safety', 'Packing', 'Business'].map((v) => ({
        label: v,
        value: v,
      })),
    },
    {
      name: 'author',
      type: 'text',
      defaultValue: 'The MrPackerMover Team',
      admin: { description: 'Byline shown on the article.' },
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      admin: { description: 'Shown on the article and used to sort newest-first.' },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Cover image (uploads to Cloudinary). Falls back to a stock hero if left empty.',
      },
    },
    { name: 'tags', type: 'text', hasMany: true },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show this post in the large featured slot at the top of /blog.' },
    },
    { name: 'body', type: 'richText', required: true },
    seoOverrideFields('this blog post'),
  ],
};
