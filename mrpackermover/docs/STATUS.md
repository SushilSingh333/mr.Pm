# Phase 0 — Foundation status

The full end-to-end skeleton is in place and verified. This document says what is
proven, what needs your credentials to light up, and the exact next commands.

## Verified locally (no database needed)

| Check                     | Command                            | Result                          |
| ------------------------- | ---------------------------------- | ------------------------------- |
| Install                   | `pnpm install`                     | ✓ 1209 pkgs                     |
| Typecheck — shared/seo/db | `pnpm exec tsc -b packages/*`      | ✓ 0 errors                      |
| Typecheck — web (Astro)   | `pnpm --filter @mpm/web typecheck` | ✓ 0 errors                      |
| Typecheck — cms (Payload) | `pnpm --filter @mpm/cms typecheck` | ✓ 0 errors                      |
| Lint                      | `pnpm lint`                        | ✓ 0 errors                      |
| Format                    | `pnpm format:check`                | ✓ clean                         |
| Static build              | `pnpm --filter @mpm/web build`     | ✓ 101 pages + sitemaps + robots |
| CI quality gates          | `pnpm check`                       | ✓ all 7 green                   |

The build renders the five core templates from the committed **sample manifest**
(`apps/web/src/data/manifest.sample.json`) so the design and the pipeline are visible
without a database. JSON-LD verified in output: `Organization` + `WebSite` on home;
`Service` + `Offer` + `areaServed` + `FAQPage` + `BreadcrumbList` on geo pages; and a
scan confirms **no** `MovingCompany`/`LocalBusiness` anywhere.

## What needs credentials (to go from sample → live data)

Fill `.env` (copy from `.env.example`) with `DATABASE_URL` (Neon) + `PAYLOAD_SECRET`,
then:

```bash
pnpm --filter @mpm/cms migrate:create initial_schema   # generate base tables (incl. leads)
pnpm --filter @mpm/cms migrate                          # apply schema + PostGIS
pnpm seed                                               # Phase-0 seed data (incl. home content)
pnpm --filter @mpm/cms dev                              # admin at :3000
pnpm build-manifest                                     # publish gate → manifest.json
pnpm --filter @mpm/web build                            # static site from real data
pnpm check                                              # gates against the real manifest
```

**Running the site from the CMS** (add a location, where leads land, edit the home
page, what's code vs CMS): see [`docs/cms-guide.md`](./cms-guide.md).

## Deploy (single DigitalOcean droplet + Cloudflare cache — ADR-0005)

- One droplet: **Caddy** serves the static site and proxies `/admin` + `/api/*` to
  **Payload/Next** (native Node, systemd); **Postgres + PostGIS** on the box (or DO
  Managed Postgres). Cloudflare caches the HTML in front.
- Dynamic endpoints are Payload endpoints (`/api/quote`, `/api/search`, `/api/track`);
  publish → `deploy/deploy.sh` rebuilds + purges Cloudflare (`scripts/purge-cache.mjs`).
- Step-by-step: **[`docs/deploy-digitalocean.md`](./deploy-digitalocean.md)**; deploy kit in `deploy/`.

## Open items to confirm (non-blocking, flagged in the plan)

1. **Legal identity** for the footer + `Organization` JSON-LD: real `legalName`,
   `GSTIN`, `CIN`, registered-office address, and `sameAs` (the single GBP, LinkedIn).
   Currently seeded with placeholders in `OrgProfile` / the sample manifest.
2. **Cloudflare + Neon access**: `DATABASE_URL`, Hyperdrive id, Turnstile keys.
3. **Font pairing**: display serif + text grotesk (ADR-0002) — two licence-clean
   options to pick at build time; fallbacks render until then.

## CMS coverage

- **Data pages** (home + the five geo templates) render from the CMS via the manifest.
- **Leads**: the quote form writes to the `Leads` collection — submissions appear in
  the admin with a New → Contacted → Quoted → Won/Lost pipeline.
- **Home copy** is editable via the `Home page content` global (hero, section
  headings/intros, and the trust pillars that drive the "why us" bento).
- **Designed pages** (`/pricing`, `/claims`, `/verify`, `/insurance`, `/corporate`,
  `/company/*`, `/track`, `/get-quote`, `/terms`, `/privacy`) are hand-built templates
  in code, by design — see [`docs/cms-guide.md`](./cms-guide.md#what-lives-in-code-and-why).

## Not yet built (Phase 1 content, per the plan's phasing)

The foundation is complete. What remains is **content fill** — adding the real cities,
localities, routes, rate cards, reviews and guides through the CMS, in the batches the
plan phases out (never shipping a batch while the previous one is < 60% indexed).
