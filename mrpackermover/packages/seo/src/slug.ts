import { slugify as trSlugify, transliterate } from 'transliteration';

/**
 * Slug rules (Doc 02 §3): lowercase, hyphen-separated, ASCII only. Devanagari and
 * other scripts are transliterated **at ingest** (नोएडा → noida) and the ASCII form
 * is stored in Postgres — never generated at request time. This helper is the
 * ingest-time canonicaliser.
 */
export function toSlug(input: string): string {
  return trSlugify(input, {
    lowercase: true,
    separator: '-',
    trim: true,
    // Collapse anything non [a-z0-9-] into a separator.
    ignore: [],
  })
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/** ASCII transliteration without slugifying (e.g. for display fallbacks). */
export function toAscii(input: string): string {
  return transliterate(input);
}

/** Route lane slug from two city slugs: ("delhi","bengaluru") → "delhi-to-bengaluru". */
export function routeLaneSlug(originSlug: string, destinationSlug: string): string {
  return `${toSlug(originSlug)}-to-${toSlug(destinationSlug)}`;
}

/** True if a slug already obeys the contract (used by CI + CMS validation). */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
