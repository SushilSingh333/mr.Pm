# ADR-0001: Record architecture decisions

- Status: Accepted
- Date: 2026-08-04

## Context

This project makes several decisions that are expensive to reverse (URL contract, no-premises
model, hosting topology, database portability strategy). We need a durable record of _why_
each was made so future contributors do not silently undo them under deadline pressure — which
is precisely how the audited incumbent's quality gates eroded.

## Decision

We record architecturally significant decisions as short ADRs in `docs/adr/`, numbered
sequentially, using the format popularised by Michael Nygard. An ADR is added whenever a
decision changes structure, a cross-cutting constraint, or a hard-to-reverse contract.

## Consequences

- The rationale behind constraints (e.g. "no catch-all route") lives next to the code.
- Reviewers can cite an ADR when rejecting a change that violates it.
