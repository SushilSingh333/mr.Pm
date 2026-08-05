# Operations runbook

## Build & deploy topology

- **Static site** (`apps/web`) → Cloudflare Pages/R2. Rebuilt from the manifest.
- **CMS + dynamic endpoints** (`apps/cms`, `apps/web/functions`) → Cloudflare Workers,
  reaching Postgres through **Hyperdrive**.
- **Database** → Neon Postgres (+ PostGIS) today; portable (see below).

## The build pipeline

1. Editor saves in Payload → `afterChange` hook enqueues a change with its page family.
2. A 10-minute debounce collapses a burst of edits into one build (an ops team editing 40
   rate cards causes **one** build, not forty).
3. CI runs `pnpm build-manifest` → the publish gate produces `manifest.json`.
4. `pnpm --filter @mpm/web build` reads the manifest from memory (one DB pass) → static HTML.
5. Sitemap shards are generated from the same manifest.
6. Only the changed shard's cache tag is purged at the edge.

Budgets: full cold build < 12 min, shard rebuild < 2 min. Watch build duration as a
first-class metric — when it creeps past 20 min, engineers stop rebuilding and data goes stale.

## Database portability drill (tested procedure)

Nothing provider-specific leaks past `packages/db`; the app only ever reads `DATABASE_URL`.
To move providers (e.g. Neon → Supabase / RDS / self-hosted):

```bash
# 1. Dump from the current provider (schema + data).
pg_dump "$OLD_DATABASE_URL" --no-owner --no-privileges -Fc -f mpm.dump

# 2. Ensure the target has PostGIS, then restore.
psql "$NEW_DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS postgis;'
pg_restore --no-owner --no-privileges -d "$NEW_DATABASE_URL" mpm.dump

# 3. Repoint the app. Local: edit .env. Cloudflare: update the Hyperdrive origin.
#    Then re-run migrations to confirm parity.
pnpm --filter @mpm/cms migrate

# 4. Boot and smoke-test. No application code changes are required.
pnpm dev
```

Requirements for any target: standard Postgres ≥ 15 with the **PostGIS** extension. We use no
provider-proprietary features in application code (no Neon HTTP-driver calls, no branching
logic, no Supabase RLS assumptions).

## Fallback: Payload admin on a Node host

If running the Payload admin on Cloudflare Workers (`@opennextjs/cloudflare`) proves unstable,
deploy `apps/cms` to a small Node host (Railway/Render/Fly) instead. It uses the **same**
`DATABASE_URL` directly (no Hyperdrive needed server-side). The static site, the Astro
frontend, and the database are unchanged — only where the admin process runs differs.

## Monitoring cadence (Doc 02 §11)

| Cadence     | Check                                                      | Action                         |
| ----------- | ---------------------------------------------------------- | ------------------------------ |
| Per deploy  | CI gates (status, canonical, sitemap, duplication, links)  | Build fails                    |
| Daily       | Cloudflare cache hit ratio, 5xx rate, origin response time | Alert < 95% hit / > 0.1% 5xx   |
| Weekly      | GSC Index Coverage per sitemap shard                       | Shard < 60% indexed → pause it |
| Weekly      | Core Web Vitals (CrUX + RUM)                               | Out of target → triage         |
| Fortnightly | Cloudflare Logpush crawl analysis                          | Rebalance internal links       |
| Monthly     | Pages with zero impressions in 90 days                     | Review / improve / unpublish   |

## The stop rule

Never ship a new batch while the previous batch is below 60% indexed. Every unindexed page is
Google telling us the page had no reason to exist.
