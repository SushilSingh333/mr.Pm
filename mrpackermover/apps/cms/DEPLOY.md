# Deploying the Payload CMS

The public site is static Astro on Cloudflare Pages. This app is **only** the admin
panel + REST/Local API + the manifest generator. It needs a Node-capable runtime
that can reach Postgres.

## Primary: Cloudflare Workers (all-Cloudflare topology)

Payload 3 runs inside Next.js, and Next runs on Workers via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Postgres is reached
through **Hyperdrive**.

```bash
pnpm add -D @opennextjs/cloudflare        # in apps/cms
# wrangler.toml: compatibility_flags = ["nodejs_compat"], [[hyperdrive]] binding
npx opennextjs-cloudflare build
npx wrangler deploy
```

Notes / caveats (why we keep a fallback):

- Payload on Workers is newer territory; validate the admin bundle, file uploads
  (route media to R2), and cold-start behaviour before relying on it.
- Use the Hyperdrive connection string for the DB pool at the edge; keep
  `DATABASE_URL` as the single portable value (see `docs/runbook.md`).

## Fallback: a Node host (zero rework)

If Workers integration is not ready, deploy this same app to Railway / Render /
Fly. It uses the **same** `DATABASE_URL` directly (no Hyperdrive needed
server-side). The static site, the Astro frontend, and the database are unchanged —
only where the admin process runs differs.

```bash
# Railway example
railway up            # build: pnpm --filter @mpm/cms build ; start: pnpm --filter @mpm/cms start
```

Either way, migrations run in CI (`deploy-cms.yml`) before the app starts:
`pnpm --filter @mpm/cms migrate`.
