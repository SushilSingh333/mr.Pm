import { query } from './index.js';

/**
 * Internal-linking queries computed in Postgres (Doc 02 §7).
 *
 * These materialise the link graph so Astro never hand-authors links and no page
 * is orphaned (the incumbent left 95.8% of pages with a single inbound link).
 * Geo distance uses PostGIS `geography` so results are true metres, not degrees.
 */

export interface LinkEdge {
  fromId: string;
  toId: string;
  distanceMeters: number;
}

/**
 * Published-state predicate.
 *
 * Payload's drafts feature stores publication state in the `_status` enum column
 * ('draft' | 'published'). There has never been an `is_published` column — querying
 * it made every internal-links refresh throw, which `build-manifest` swallowed as
 * `internal-links refresh skipped: …`, silently disabling internal linking.
 */
const PUBLISHED = (alias: string): string => `${alias}._status = 'published'`;

/** Nearest sibling localities within the same parent city (6 nearest by distance). */
export async function nearestSiblingLocalities(limit = 6): Promise<LinkEdge[]> {
  return query<LinkEdge>(
    `
    SELECT a.id AS "fromId", b.id AS "toId",
           ST_Distance(a.geo, b.geo) AS "distanceMeters"
    FROM locations a
    JOIN LATERAL (
      SELECT b.id, b.geo
      FROM locations b
      WHERE b.parent_id = a.parent_id
        AND b.id <> a.id
        AND ${PUBLISHED('b')}
        AND b.type = 'locality'
      ORDER BY a.geo <-> b.geo
      LIMIT $1
    ) b ON true
    WHERE a.type = 'locality' AND ${PUBLISHED('a')}
    `,
    [limit],
  );
}

/** Same service in the N nearest cities (city × service cross-links). */
export async function sameServiceNearbyCities(limit = 6): Promise<LinkEdge[]> {
  return query<LinkEdge>(
    `
    SELECT a.id AS "fromId", b.id AS "toId",
           ST_Distance(a.geo, b.geo) AS "distanceMeters"
    FROM locations a
    JOIN LATERAL (
      SELECT b.id, b.geo
      FROM locations b
      WHERE b.type = 'city' AND b.id <> a.id AND ${PUBLISHED('b')}
      ORDER BY a.geo <-> b.geo
      LIMIT $1
    ) b ON true
    WHERE a.type = 'city' AND ${PUBLISHED('a')}
    `,
    [limit],
  );
}

/**
 * The serviceability distance used by the publish gate (Doc 01 §6): metres from a
 * location to its nearest operating base. The base itself is never rendered — only
 * this distance gates publication.
 */
export async function distanceToNearestBase(locationId: string): Promise<number | null> {
  const rows = await query<{ meters: number }>(
    `
    SELECT ST_Distance(l.geo, b.geo) AS meters
    FROM locations l
    CROSS JOIN operating_bases b
    WHERE l.id = $1
    ORDER BY l.geo <-> b.geo
    LIMIT 1
    `,
    [locationId],
  );
  return rows[0]?.meters ?? null;
}
