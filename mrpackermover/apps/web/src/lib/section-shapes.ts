import type { ServiceBlock } from '@mpm/shared';

/**
 * How ServiceSections decides a block's look, in one place, because place-links.ts must
 * know it too: a link it adds where the look prints plain text would show as raw
 * "[Saket](/...)".
 */

/**
 * A list item that opens with a short name ("Saket. Builder floors...") is a feature tile:
 * the name is its plain-text title, the rest its text.
 */
export const FEATURE = /^([^.?!:[\]]{2,60}?)[.:]\s+(\S[\s\S]*)$/;

type TableBlock = Extract<ServiceBlock, { kind: 'table' }>;

/**
 * A to-do table - "What | Who arranges it | When" - is a checklist the reader ticks off:
 * only its first column is formatted text, the rest are plain chips inside the tick label.
 */
export const isChecklist = (b: TableBlock): boolean =>
  b.columns.length >= 3 &&
  b.rows.length >= 3 &&
  b.columns.some((c) => /who/i.test(c)) &&
  b.columns.some((c) => /^when$/i.test(c.trim()));
