import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * PostGIS support for internal-linking distance queries.
 *
 * Adds a generated `geo geography(Point,4326)` column to `locations` and
 * `operating_bases`, derived from the `lat`/`lng` columns, plus GiST indexes and
 * the `internal_links` materialised link table. Written defensively so it can run
 * after the generated base-schema migration in any provider.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    CREATE EXTENSION IF NOT EXISTS postgis;

    ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS geo geography(Point, 4326)
      GENERATED ALWAYS AS (
        CASE WHEN lat IS NOT NULL AND lng IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        END
      ) STORED;

    ALTER TABLE operating_bases
      ADD COLUMN IF NOT EXISTS geo geography(Point, 4326)
      GENERATED ALWAYS AS (
        CASE WHEN lat IS NOT NULL AND lng IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        END
      ) STORED;

    CREATE INDEX IF NOT EXISTS locations_geo_gix ON locations USING GIST (geo);
    CREATE INDEX IF NOT EXISTS operating_bases_geo_gix ON operating_bases USING GIST (geo);

    CREATE TABLE IF NOT EXISTS internal_links (
      from_id  text NOT NULL,
      to_id    text NOT NULL,
      relation text NOT NULL,
      weight   double precision NOT NULL DEFAULT 0,
      PRIMARY KEY (from_id, to_id, relation)
    );
    CREATE INDEX IF NOT EXISTS internal_links_from_idx ON internal_links (from_id);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(`
    DROP TABLE IF EXISTS internal_links;
    DROP INDEX IF EXISTS locations_geo_gix;
    DROP INDEX IF EXISTS operating_bases_geo_gix;
    ALTER TABLE locations DROP COLUMN IF EXISTS geo;
    ALTER TABLE operating_bases DROP COLUMN IF EXISTS geo;
  `);
}
