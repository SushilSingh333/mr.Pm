# Operations runbook

## Build & deploy topology

Chosen: **a single DigitalOcean droplet** behind **Cloudflare** (cache-only). See the
step-by-step in [`deploy-digitalocean.md`](./deploy-digitalocean.md).

- **Everything on one droplet:** Caddy serves the static site (`apps/web/dist`) and
  reverse-proxies `/admin` + `/api/*` to the **Payload/Next** app on `:3000`.
- **Dynamic endpoints** (`/api/quote`, `/api/search`, `/api/track`) are Payload endpoints
  (`apps/cms/src/endpoints`) hitting Postgres via the local API — no Workers, no Hyperdrive.
- **Database** → Postgres + PostGIS on the droplet (or DO Managed Postgres); portable (below).
- **Cloudflare** hard-caches the HTML in front; the droplet barely serves public traffic.

## The build pipeline

1. Editor saves in Payload → `afterChange` hook enqueues a change with its page family.
2. A 10-minute debounce collapses a burst of edits into one build (an ops team editing 40
   rate cards causes **one** build, not forty).
3. The publish hook triggers `deploy/deploy.sh` → `pnpm build-manifest` → the publish gate
   produces `manifest.json`.
4. `pnpm --filter @mpm/web build` reads the manifest from memory (one DB pass) → static HTML.
5. Sitemap shards are generated from the same manifest; `dist/` is rsynced to the web root.
6. `scripts/purge-cache.mjs` purges Cloudflare (by-URL, or everything on Free/Pro — by-tag
   purge is Enterprise-only) so the next visitor gets the fresh pages.

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

# 3. Repoint the app: edit DATABASE_URL in apps/cms/.env, restart the CMS service.
#    Then re-run migrations to confirm parity.
pnpm --filter @mpm/cms migrate

# 4. Boot and smoke-test. No application code changes are required.
pnpm dev
```

Requirements for any target: standard Postgres ≥ 15 with the **PostGIS** extension. We use no
provider-proprietary features in application code (no Neon HTTP-driver calls, no branching
logic, no Supabase RLS assumptions).

## Payload admin runtime

Primary: the Payload admin runs on its **native Node runtime** on the droplet (systemd,
`next start`) — see [`deploy-digitalocean.md`](./deploy-digitalocean.md). It reads the same
`DATABASE_URL` directly. (The earlier all-Cloudflare plan ran it on Workers via
`@opennextjs/cloudflare`; that path is retired in favour of native Node, which is simpler and
better supported — ADR-0005.)

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
