import type { ServiceBlock } from '@mpm/shared';

/**
 * A brief's content block in the shape the CMS stores it - the `svc*` blocks shared by
 * Services → "Service page" and Locations → "Page content" (fields/service-page.ts).
 * Used by the scripts that copy the briefs into the CMS.
 */
export function toCmsBlock(b: ServiceBlock): Record<string, unknown> {
  switch (b.kind) {
    case 'text':
      return { blockType: 'svcText', body: b.body };
    case 'steps':
      return {
        blockType: 'svcSteps',
        items: b.items.map((i) => ({ title: i.title, body: i.body })),
      };
    case 'list':
      return { blockType: 'svcList', items: b.items.map((text) => ({ text })) };
    case 'table':
      return {
        blockType: 'svcTable',
        h1: b.columns[0] ?? '',
        h2: b.columns[1] ?? '',
        h3: b.columns[2] ?? '',
        h4: b.columns[3] ?? '',
        rows: b.rows.map((r) => ({
          c1: r[0] ?? '',
          c2: r[1] ?? '',
          c3: r[2] ?? '',
          c4: r[3] ?? '',
        })),
      };
    case 'scope':
      return { blockType: 'svcScope' };
  }
}

/** Blank as the site reads it: no text, or an empty list. */
export const blank = (v: unknown): boolean =>
  v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
