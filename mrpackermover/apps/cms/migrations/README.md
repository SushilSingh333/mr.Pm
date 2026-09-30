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

## Pending: `waitingSince` on leads

The dashboard's "Waiting longest" sort reads `leads.waiting_since`. Locally the column
arrives through `push`; production needs a migration, generated on a machine whose
`DATABASE_URL` reaches it:

```bash
pnpm --filter @mpm/cms migrate:create waiting_since
```

**Add the backfill to the generated `up()`, after the `ADD COLUMN`.** Without it every
existing lead has a null clock and sorts as if it arrived at the beginning of time. The
expression is the rule the dashboard used to apply at render time, so no number on screen
changes - only the ordering starts agreeing with it:

```sql
UPDATE leads SET waiting_since = CASE
  WHEN status IN ('new', 'assigned', 'reassigned') THEN created_at
  ELSE updated_at
END
WHERE waiting_since IS NULL;
```

Until it runs, the board still renders correctly - `BoardRow` falls back to the old
derivation for a row with no `waitingSince` - but the sort keeps the bug it fixes.

The same generated migration will also carry the `kind` and `amount` columns on
`leads_note_log`, which are likewise still pending.

## Pending: `dueAt` and the `scheduled` stage

Two more changes ride along in the same generated migration:

- **`leads.due_at`** — a new indexed timestamp. Nothing to backfill: an absent date means
  nothing was promised, which is true of every lead written before the field existed.
- **`scheduled` added to the lead status enum.** Postgres will not accept the value until
  it is in the type, so until the migration runs the stage exists in the UI and is
  rejected on save. Payload generates the `ALTER TYPE` itself — check it is in the
  migration before deploying, because an enum value cannot be added inside a transaction
  on older Postgres and Payload sometimes splits it out.

Verify after applying:

```sql
SELECT unnest(enum_range(NULL::enum_leads_status));  -- must include 'scheduled'
\d leads                                             -- due_at, waiting_since present
```

## Pending: the `schedule-settings` global (move calendar)

The move calendar at `/admin/calendar` reads its daily capacity from a new global,
`schedule-settings` (one field, `movesPerDay`, default 4). It is a new table, so it rides
in the same generated migration as the changes above. Nothing to backfill.

Until the migration runs the calendar still opens — it catches the missing table and
colours days against the default of 4 — but the **Sales → Calendar settings** screen
cannot be saved.

Verify after applying:

```sql
\d schedule_settings        -- moves_per_day present
```

No schema change for the other half of the calendar: a scheduled lead that is then
marked Won or Lost now keeps its `due_at`, so past moves stay on their day. That is a
hook change only.
