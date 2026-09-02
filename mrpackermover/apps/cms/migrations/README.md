# Migrations

Payload manages schema through versioned Drizzle migrations (never `push` in
production). Standard Postgres + PostGIS only — no provider-specific features — so
these migrations replay on Neon, Supabase, RDS, or a self-hosted Postgres alike.

## Order

1. **Generate the base schema** from the collection configs once the DB is reachable:

   ```bash
   pnpm --filter @mpm/cms migrate:create initial_schema
   ```

   This produces `NNNN_initial_schema.ts` with every collection table.

2. **`0001_postgis.ts`** (committed) enables PostGIS and adds the generated
   `geo geography(Point,4326)` columns + GiST indexes that the internal-linking
   distance queries depend on. It is written defensively (`IF NOT EXISTS`) so it is
   safe to run after the generated base migration regardless of exact table order.

## Apply

```bash
pnpm --filter @mpm/cms migrate
```

## Move providers

See `docs/runbook.md` → "Database portability drill". In short: `pg_dump` →
restore to a PostGIS-capable target → repoint `DATABASE_URL` → `pnpm migrate`.

## Adding a field (e.g. the SEO overrides)

New collection/global fields are new Postgres columns, so they need their own
migration — Payload never `push`es in production. On a machine where `DATABASE_URL`
reaches the database:

```bash
pnpm --filter @mpm/cms migrate:create seo_overrides   # writes NNNN_seo_overrides.ts
pnpm --filter @mpm/cms migrate                        # applies it
```

Commit the generated file. Until it runs, the columns do not exist: the CMS admin
will error on the new fields, and `build-manifest` falls back to the hardcoded
titles in `@mpm/seo/meta` (the `seo-defaults` global read is wrapped in
`.catch(() => null)` precisely so a pre-migration build still succeeds).
