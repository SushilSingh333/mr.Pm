# Phase 0 — Foundation status

The full end-to-end skeleton is in place and verified. This document says what is
proven, what needs your credentials to light up, and the exact next commands.

## Verified locally (no database needed)

| Check                     | Command                            | Result                        |
| ------------------------- | ---------------------------------- | ----------------------------- |
| Install                   | `pnpm install`                     | ✓ 1209 pkgs                   |
| Typecheck — shared/seo/db | `pnpm exec tsc -b packages/*`      | ✓ 0 errors                    |
| Typecheck — web (Astro)   | `pnpm --filter @mpm/web typecheck` | ✓ 0 errors                    |
| Typecheck — cms (Payload) | `pnpm --filter @mpm/cms typecheck` | ✓ 0 errors                    |
| Lint                      | `pnpm lint`                        | ✓ 0 errors                    |
| Format                    | `pnpm format:check`                | ✓ clean                       |
| Static build              | `pnpm --filter @mpm/web build`     | ✓ 8 pages + sitemaps + robots |
| CI quality gates          | `pnpm check`                       | ✓ all 7 green                 |

The build renders the five core templates from the committed **sample manifest**
(`apps/web/src/data/manifest.sample.json`) so the design and the pipeline are visible
without a database. JSON-LD verified in output: `Organization` + `WebSite` on home;
`Service` + `Offer` + `areaServed` + `FAQPage` + `BreadcrumbList` on geo pages; and a
scan confirms **no** `MovingCompany`/`LocalBusiness` anywhere.

## What needs credentials (to go from sample → live data)

Fill `.env` (copy from `.env.example`) with `DATABASE_URL` (Neon) + `PAYLOAD_SECRET`,
then:

```bash
pnpm --filter @mpm/cms migrate:create initial_schema   # generate base tables
pnpm --filter @mpm/cms migrate                          # apply schema + PostGIS + leads
pnpm seed                                               # Phase-0 seed data
pnpm --filter @mpm/cms dev                              # admin at :3000
pnpm build-manifest                                     # publish gate → manifest.json
pnpm --filter @mpm/web build                            # static site from real data
pnpm check                                              # gates against the real manifest
```

## Deploy (Cloudflare)

- Static site → Cloudflare Pages (`apps/web/dist`), Functions read Postgres via
  Hyperdrive. See `apps/web/wrangler.toml`.
- Payload admin → Cloudflare Workers (OpenNext) with the documented Node-host
  fallback. See `apps/cms/DEPLOY.md`.
- Secrets/vars for CI are listed in `.github/workflows/deploy-*.yml`.

## Open items to confirm (non-blocking, flagged in the plan)

1. **Legal identity** for the footer + `Organization` JSON-LD: real `legalName`,
   `GSTIN`, `CIN`, registered-office address, and `sameAs` (the single GBP, LinkedIn).
   Currently seeded with placeholders in `OrgProfile` / the sample manifest.
2. **Cloudflare + Neon access**: `DATABASE_URL`, Hyperdrive id, Turnstile keys.
3. **Font pairing**: display serif + text grotesk (ADR-0002) — two licence-clean
   options to pick at build time; fallbacks render until then.

## Not yet built (Phase 1 content, per the plan's phasing)

The five core geo templates + home are live. The trust-cluster and corporate pages
(`/pricing`, `/claims`, `/verify`, `/insurance`, `/corporate/*`, `/company/*`,
`/track` UI) are Phase-1 pages — their nav links exist and will resolve as those
templates are added. This is the content-fill phase that follows the foundation.
