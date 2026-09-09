import type { CollectionConfig } from 'payload';
import { hideFromSalesRoles, isContentStaff, publicReadExceptSalesRoles } from '../access/index.js';

/**
 * Reusable prose fragments (Doc 01 §5). Rotated by `variantKey` and bounded by
 * min/max uses to keep the duplication ceiling (8-gram Jaccard < 0.45) satisfied
 * without spinning synonyms.
 */
export const ContentBlocks: CollectionConfig = {
  slug: 'content-blocks',
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'label',
    group: 'Content',
    defaultColumns: ['label', 'scope', 'variantKey'],
  },
  access: {
    read: publicReadExceptSalesRoles,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'scope',
      type: 'select',
      defaultValue: 'global',
      options: ['global', 'city', 'service', 'lane', 'locality'].map((v) => ({
        label: v,
        value: v,
      })),
    },
    {
      name: 'variantKey',
      type: 'text',
      admin: { description: 'Rotate blocks across pages by this key.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'minUses', type: 'number', defaultValue: 0, admin: { width: '50%' } },
        { name: 'maxUses', type: 'number', admin: { width: '50%' } },
      ],
    },
  ],
};
