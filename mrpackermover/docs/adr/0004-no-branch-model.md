# ADR-0004: Remove the public-branch / premises model

- Status: Accepted
- Date: 2026-07-29 (Rev 2 of the governing specs)

## Context

An earlier revision (and the older Excel build sheet) modelled a physical branch per city:
`/branches/` pages, branch cards, per-city Google Business Profiles, and `MovingCompany` /
`LocalBusiness` structured data. The business is genuinely **one operation serving many
places** — it does not have premises in most of those places. Publishing a physical presence
where none exists is a fabricated local entity: it invites a Google Business Profile
suspension and a scaled-content / spam action, and it is the exact trust failure the whole
strategy is built to avoid.

## Decision

The public site claims **no physical premises anywhere**.

- No `/branches/` pages, no branch cards, no per-city business entities.
- The public site speaks only of **serviceable cities and areas**, each backed by job data.
- **One** `Organization` carries the legal identity (legalName, GSTIN as `taxID`, CIN as
  `identifier`, registered office). Every geo page emits `Service` + `areaServed` and points
  its `provider` at that Organization's `@id`.
- **One** Google Business Profile, for the registered office only.
- Operating bases survive as **internal** dispatch data: they feed the serviceability distance
  in the publish gate and are never rendered or exposed in any API the site consumes.

## Consequences

- CI gate **G10** fails the build if `MovingCompany` / `LocalBusiness` / self-serving
  `AggregateRating` markup appears anywhere.
- The `operating_bases` collection is admin-only and excluded from the manifest.
- The Excel build sheet's premises-specific blocks (branch address, signage photo, GBP link
  on city hubs) are dropped and replaced with serviceable-area confirmation + job data.
