import type { Field } from 'payload';

/**
 * Field builders for page copy that has built-in text (packages/shared/src/page-copy.ts).
 *
 * Every field is optional and starts empty. Its placeholder IS the built-in text, so an
 * editor sees what the page shows right now without anything being saved, and typing
 * replaces it. Clearing a field puts the built-in text back. Lists say what they fall
 * back to in their description.
 */

const BLANK = 'Leave blank to keep the text shown in grey.';

export const copyText = (name: string, label: string, builtIn: string, width?: string): Field => ({
  name,
  type: 'text',
  label,
  admin: { placeholder: builtIn, ...(width ? { width } : {}) },
});

export const copyArea = (name: string, label: string, builtIn: string): Field => ({
  name,
  type: 'textarea',
  label,
  admin: { placeholder: builtIn, rows: 3 },
});

/** The optional "link under the item" pair. */
export const copyLink = (): Field => ({
  type: 'row',
  fields: [
    { name: 'linkLabel', type: 'text', label: 'Link text', admin: { width: '50%' } },
    {
      name: 'linkHref',
      type: 'text',
      label: 'Link to',
      admin: { width: '50%', placeholder: '/pricing' },
    },
  ],
});

/** A list that falls back to its built-in items while empty. */
export const copyList = (
  name: string,
  label: string,
  builtIn: string[],
  fields: Field[],
): Field => ({
  name,
  type: 'array',
  label,
  labels: { singular: 'Item', plural: 'Items' },
  admin: {
    initCollapsed: true,
    description: `Empty = the built-in ${builtIn.length}: ${builtIn.join(' · ')}. Add items to replace the whole list.`,
  },
  fields,
});

export const blankNote = BLANK;
