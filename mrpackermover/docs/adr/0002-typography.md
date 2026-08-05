# ADR-0002: Two self-hosted font families

- Status: Accepted
- Date: 2026-07-29 (carried from Doc 02 §10)

## Context

Doc 02 originally specified a single self-hosted family for performance. Design review found
that a services brand in a low-trust category benefits from a more considered typographic
voice, and the cost of a second family — if subset — is small.

## Decision

Ship **two** self-hosted families:

- a **display serif** for the H1 and section headings only, and
- a **text grotesk** for body and UI.

Both are self-hosted `woff2`, **subset to ~52KB total**, `font-display: swap`, and preloaded.
No Google Fonts request (extra connection + a privacy question in some jurisdictions).

## Consequences

- The LCP-critical H1 uses the display serif, which must be preloaded.
- Token names in `packages/ui-tokens` expose `--font-display` and `--font-text`.
- The final licence-clean pairing is chosen at build time and pinned here.
