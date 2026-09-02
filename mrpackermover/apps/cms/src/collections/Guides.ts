import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { seoOverrideFields } from '../fields/seo.js';
import { slugField } from '../fields/slug.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

/**
 * Editorial guides (Doc 01 §5). Written to be cited: original operational detail,
 * at least one number nobody else publishes, a named author with credentials.
 */
export const Guides: CollectionConfig = {
  slug: 'guides',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'author', 'updatedAt'],
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
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'richText', required: true },
    { name: 'author', type: 'relationship', relationTo: 'people', required: true },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'people' },
    { name: 'tags', type: 'text', hasMany: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    seoOverrideFields('this guide'),
  ],
};
