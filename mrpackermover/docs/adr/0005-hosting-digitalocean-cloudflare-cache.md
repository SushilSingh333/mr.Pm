# ADR-0005: Host on a single DigitalOcean droplet behind a Cloudflare cache

- Status: Accepted
- Date: 2026-08-06 (supersedes the all-Cloudflare topology in the Phase-0 plan §1)

## Context

The Phase-0 plan chose an **all-Cloudflare** topology: static site on Pages, Payload/Next on
Workers via `@opennextjs/cloudflare`, and Postgres (Neon) reached through **Hyperdrive**; a
"Node-host fallback" was documented because Payload-on-Workers is the fragile part. The
project owner decided to run everything on **one DigitalOcean droplet** instead, with
Cloudflare in front purely as an aggressive HTML cache.

The site is SSG, so Cloudflare absorbs virtually all public traffic and the origin is lightly
loaded — which removes most of a single-VPS's usual downside while keeping a full-control
Node/Postgres origin.

## Decision

Host the whole stack on **one DigitalOcean droplet**, with **Cloudflare as a cache-only CDN**.

- **Caddy** serves the static site (`apps/web/dist`) and reverse-proxies `/admin` + `/api/*`
  to the **Payload/Next** app (`next start`, native Node, under systemd).
- **Postgres + PostGIS** run on the droplet (or DO Managed Postgres) — reached via the
  standard `DATABASE_URL`. No Hyperdrive.
- The three dynamic surfaces move from Cloudflare Pages Functions to **Payload endpoints**
  (`apps/cms/src/endpoints`: `/api/quote`, `/api/search`, `/api/track`) using the Payload
  local API. `apps/web/functions/*` and `wrangler.toml` are removed.
- **Publish → live**: the `afterChange` hook triggers `deploy/deploy.sh` (rebuild manifest →
  build site → publish → purge Cloudflare via `scripts/purge-cache.mjs`).

## Consequences

- Payload runs on its **native runtime**, eliminating the OpenNext-on-Workers risk that the
  fallback existed for. Simpler, better supported.
- We **own OS patching, DB backups, and monitoring** for the droplet (mitigated by managed
  Postgres and a small, cache-fronted origin).
- Cache invalidation is **by-URL or purge-all** on Cloudflare Free/Pro (by-tag / by-prefix
  purge is Enterprise-only). Acceptable: the site publishes in batches and
  `stale-while-revalidate` covers the brief cold window.
- **DB portability is unchanged** and is exactly this move: `pg_dump` from Neon → restore on
  the droplet → repoint `DATABASE_URL`. Nothing provider-specific leaks past `packages/db`.
- Deploy kit lives in `deploy/` (Caddyfile, systemd unit, deploy.sh); steps in
  `docs/deploy-digitalocean.md`.
