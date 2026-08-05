import { query } from '@mpm/db';
import { nearestSiblingLocalities, sameServiceNearbyCities } from '@mpm/db/postgis';

/**
 * Materialise the internal-link graph in Postgres (Doc 02 §7). Refreshed nightly
 * and folded into the manifest so Astro never hand-authors a link and no page is
 * orphaned. This is the single check that prevents the incumbent's 95.8%-orphaned
 * outcome: the build asserts every published page has ≥ 3 contextual inbound links.
 */

export interface InternalLinkRow {
  fromId: string;
  toId: string;
  relation: 'sibling-locality' | 'same-service-city';
  weight: number;
}

export async function rebuildInternalLinks(): Promise<number> {
  const [siblings, sameService] = await Promise.all([
    nearestSiblingLocalities(6),
    sameServiceNearbyCities(6),
  ]);

  const rows: InternalLinkRow[] = [
    ...siblings.map((e) => ({
      fromId: e.fromId,
      toId: e.toId,
      relation: 'sibling-locality' as const,
      weight: e.distanceMeters,
    })),
    ...sameService.map((e) => ({
      fromId: e.fromId,
      toId: e.toId,
      relation: 'same-service-city' as const,
      weight: e.distanceMeters,
    })),
  ];

  await query('TRUNCATE internal_links');
  for (const r of rows) {
    await query(
      `INSERT INTO internal_links (from_id, to_id, relation, weight)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (from_id, to_id, relation) DO UPDATE SET weight = EXCLUDED.weight`,
      [r.fromId, r.toId, r.relation, r.weight],
    );
  }
  return rows.length;
}

/** Load the outbound edges for a set of location ids, to fold into the manifest. */
export async function loadEdgesFor(locationIds: string[]): Promise<InternalLinkRow[]> {
  if (!locationIds.length) return [];
  return query<InternalLinkRow>(
    `SELECT from_id AS "fromId", to_id AS "toId", relation, weight
     FROM internal_links
     WHERE from_id = ANY($1::text[])
     ORDER BY weight ASC`,
    [locationIds],
  );
}
