import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * The `leads` table written by the edge quote endpoint (functions/quote.ts).
 *
 * Kept outside Payload's managed collections so the edge Worker can insert with a
 * stable, known column set (Payload never alters it). Ops can read it via a
 * read-only view or a future Payload collection mapped to this table.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name          text NOT NULL,
      phone         text NOT NULL,
      service       text,
      pickup        text,
      drop_location text,
      move_date     date,
      move_size     text,
      source_ip     text,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(`DROP TABLE IF EXISTS leads;`);
}
