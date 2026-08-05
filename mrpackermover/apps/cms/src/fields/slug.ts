import type { Field } from 'payload';
import { isValidSlug, toSlug } from '@mpm/seo';

/**
 * A slug field that enforces the URL contract (ADR-0003):
 *   • lowercase, hyphenated, ASCII (auto-transliterated at ingest);
 *   • unique within its collection;
 *   • immutable once the row is published — renames create a redirect row, they
 *     never mutate the URL. (Immutability is enforced by a beforeValidate hook.)
 */
export function slugField(sourceField = 'name'): Field {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'Lowercase, hyphenated, ASCII. Immutable once published.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data, originalDoc, operation }) => {
          // Derive from the source field on create if not set.
          const derived =
            typeof value === 'string' && value.length > 0
              ? value
              : typeof data?.[sourceField] === 'string'
                ? (data[sourceField] as string)
                : '';
          const next = derived ? toSlug(derived) : value;

          // Immutable after publish.
          if (
            operation === 'update' &&
            originalDoc?._status === 'published' &&
            typeof next === 'string' &&
            next !== originalDoc.slug
          ) {
            throw new Error(
              `Slug is immutable after publish (was "${originalDoc.slug}"). Create a redirect instead.`,
            );
          }
          return next;
        },
      ],
    },
    validate: (value: string | null | undefined) => {
      if (!value) return 'A slug is required.';
      return (
        isValidSlug(value) ||
        'Slug must be lowercase, hyphenated, ASCII (e.g. "gurgaon-sector-56").'
      );
    },
  };
}
