# ADR-0003: City-nested URL contract, enumerable from the manifest

- Status: Accepted
- Date: 2026-08-04

## Context

Two source docs disagreed on URLs: Rev 2 nests the whole geo cluster under one
`/packers-and-movers/` prefix; the older Excel used service-first paths (`/movers/…`,
`/services/{service}/{city}/`). Slugs are immutable once published, so the choice is a
one-way door. The incumbent's fatal flaw is an **infinite** URL space: every templated
pattern accepts arbitrary input and returns HTTP 200 with `index, follow`.

## Decision

Adopt the **city-nested (Rev 2)** contract:

```
/                                       home
/services/{service}/                    national service hub
/packers-and-movers/{city}/             city hub
/packers-and-movers/{city}/{service}/   city × service
/packers-and-movers/{city}/{locality}/  locality
/routes/{origin}-to-{destination}/      lane
/pricing/  /pricing/{city}/  /reviews/{city}/  /guides/{slug}/  ...corporate/trust
```

A single prefix per family makes sitemap sharding, cache-tag purging, robots policy, and
GSC/analytics segmentation trivial. **Every valid URL corresponds to a manifest row.** There
is no route handler that renders a page from an arbitrary path segment.

## Consequences

- No `[...slug].astro` catch-all — enforced by an ESLint rule and a CI grep gate.
- Slugs: lowercase, hyphenated, ASCII; Devanagari transliterated at ingest; unique index on
  `(collection, slug)`; renames create a redirect row, they never mutate the URL.
- `trailingSlash: 'never'`; case / trailing-slash / www / http variants 301 to canonical.
