# Deploying the Payload CMS

This app is the admin panel + REST/Local API + the manifest generator + the public JSON
endpoints (`/api/quote`, `/api/search`, `/api/track`). It runs on Node and reaches Postgres
via `DATABASE_URL`.

## Primary: native Node on the DigitalOcean droplet (ADR-0005)

The chosen topology runs this app with `next start` on the droplet (systemd), behind Caddy,
with Cloudflare caching the static site in front. Full steps:
[`docs/deploy-digitalocean.md`](../../docs/deploy-digitalocean.md).

```bash
pnpm --filter @mpm/cms build     # next build
pnpm --filter @mpm/cms start     # next start -p 3000  (managed by systemd in prod)
```

Migrations run before the app starts:

```bash
pnpm --filter @mpm/cms migrate:create initial_schema
pnpm --filter @mpm/cms migrate
```

Any other Node host (Railway / Render / Fly) works identically — same `DATABASE_URL`, same
commands — since nothing here is DigitalOcean-specific.

## Retired: Cloudflare Workers (all-Cloudflare)

An earlier plan ran Next/Payload on Workers via `@opennextjs/cloudflare` with Hyperdrive.
That path is retired (ADR-0005) in favour of native Node — simpler, better supported, and it
lets the dynamic endpoints use the local DB API instead of a Workers-only connection shim.
