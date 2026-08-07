# MrPackerMover

A data-backed packers-and-movers site engineered to become India's largest by **organic
reach** — without becoming a doorway farm. Every page is a projection of real operational
data (rate cards, completed-job counts, verified reviews, claims-settlement figures). No page
is generated from a place name alone, and the site claims **no physical premises** anywhere:
serviceability is proven with job data, not with an address.

> The strategy, IA, and technical-SEO decisions that drive this codebase live in the two
> governing specs (Doc 01 — Site Strategy, Doc 02 — Technical SEO, both Rev 2). This README
> is the engineering entry point; `docs/` holds the ADRs and the operations runbook.

## Stack

| Layer       | Choice                                              | Why                                             |
| ----------- | --------------------------------------------------- | ----------------------------------------------- |
| Frontend    | **Astro** (SSG)                                     | Static HTML, zero JS by default, edge-cacheable |
| CMS         | **Payload** (Next.js)                               | Pages are projections of typed collections      |
| Database    | **Postgres + PostGIS**                              | Portable; geo queries drive internal linking    |
| Hosting     | **1 DigitalOcean droplet** (ADR-0005)               | Caddy serves static + proxies Payload/Next + DB |
| Edge        | **Cloudflare** (cache-only CDN)                     | Hard-caches HTML; purge on publish              |
| Dynamic API | Payload (`/api/quote`, `/api/track`, `/api/search`) | POST/noindex; the only non-static surfaces      |

## Repository layout

```
apps/
  web/     Astro SSG — the public site (renders from the build manifest)
  cms/     Payload — the 12 collections + publish gate + manifest generator
packages/
  config/     shared eslint / prettier / tsconfig / tailwind theme
  ui-tokens/  design tokens (color, type, spacing) as CSS variables
  shared/     generated Payload types, manifest schema (zod), constants
  db/         connection factory + PostGIS helpers (the ONLY provider boundary)
  seo/        JSON-LD builders, title/meta composers, slug + transliteration
scripts/     build-manifest + CI quality gates (check-*)
docs/        ADRs + operations runbook (incl. the DB-portability drill)
```

## Getting started

```bash
pnpm install
cp .env.example .env          # fill DATABASE_URL, PAYLOAD_SECRET, ...
pnpm --filter @mpm/cms migrate  # apply schema to Postgres
pnpm seed                     # load Phase-0 seed data
pnpm build-manifest           # run the publish gate → manifest.json
pnpm dev                      # web on :4321, cms admin on :3000
```

## The invariant that keeps this site trustworthy

**The manifest is the single source of truth.** `scripts/build-manifest.ts` runs the publish
gate over every candidate; only rows that clear it get a URL. Sitemaps, the internal-link
graph, and Astro's route table all derive from that one file, so they cannot drift. There is
**no catch-all route** — an unknown path returns a genuine 404, never a templated 200.

## Quality gates (CI, `pnpm check`)

Status codes · canonical parity · sitemap parity · duplication ceiling (8-gram Jaccard < 0.45)
· ≥ 3 inbound links per page · structured-data validation · no `[...slug]` catch-all · no
`MovingCompany`/`LocalBusiness`/self `AggregateRating` entities. Any red fails the build.

## Database portability

Nothing provider-specific leaks past `packages/db`. Migrating providers is one connection
string + a schema restore — see `docs/runbook.md`.
