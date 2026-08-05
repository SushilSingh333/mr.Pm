import { PUBLISH_GATE_THRESHOLD, type PageType } from '@mpm/shared';

/**
 * The publish gate (Doc 01 §6 + Excel Content Spec).
 *
 * Nothing generates unconditionally. A candidate is scored; below threshold it is
 * NOT built (it 301s to its parent and becomes eligible in a later build as data
 * accumulates). On top of the score, each page type has MANDATORY unique blocks —
 * the CMS/build must refuse to publish without them, regardless of score. This is
 * the single most important quality control in the codebase.
 *
 * These are pure functions with no I/O so they are trivially unit-testable and so
 * the same logic runs in the CMS admin (warn the editor) and the build (enforce).
 */

/** The joined facts the gate scores. Assembled by `lib/manifest.ts` from Payload. */
export interface GateCandidate {
  pageType: PageType;
  hasRateCard: boolean;
  jobCount12m: number;
  reviewsCount: number;
  /** Distance to the nearest operating base in metres (internal; never rendered). */
  baseDistanceMeters: number | null;
  /** Word count of location-specific editorial / ops content. */
  localContentWords: number;
  scopedFaqCount: number;
  hasLocationPhotos: boolean;
  /** Named local operational facts (societies, lift rules, gate timings, ...). */
  namedLocalFacts: number;
  /** A named coordinator with a direct contact is assigned. */
  hasNamedCoordinator: boolean;
  /** Rate bands present (1BHK/2BHK/3BHK ...). */
  rateBandCount: number;
}

export interface GateResult {
  score: number;
  passed: boolean;
  /** Human-readable scoring breakdown (shown in the admin). */
  breakdown: Array<{ label: string; points: number; met: boolean }>;
  /** Mandatory blocks that are missing. Non-empty ⇒ fail regardless of score. */
  missingMandatory: string[];
}

const SERVICEABILITY_RADIUS_M = 25_000;

/** Score component weights (Doc 01 §6 — tune the weights, keep the shape). */
export function scoreCandidate(c: GateCandidate): GateResult['breakdown'] {
  const baseWithinRadius =
    c.baseDistanceMeters != null && c.baseDistanceMeters <= SERVICEABILITY_RADIUS_M;
  return [
    { label: 'Rate card exists', points: 25, met: c.hasRateCard },
    { label: '≥ 10 jobs in 12 months', points: 20, met: c.jobCount12m >= 10 },
    { label: '≥ 3 reviews', points: 15, met: c.reviewsCount >= 3 },
    { label: 'Operating base within 25 km', points: 15, met: baseWithinRadius },
    { label: '≥ 200 words local content', points: 15, met: c.localContentWords >= 200 },
    { label: '≥ 3 scoped FAQs', points: 5, met: c.scopedFaqCount >= 3 },
    { label: 'Photos from this location', points: 5, met: c.hasLocationPhotos },
  ];
}

/**
 * Mandatory unique blocks per page type (Excel Content Spec). A page that cannot
 * satisfy these should not exist — it will not rank and it endangers the pages
 * that would. Premises-specific blocks from the Excel are intentionally removed
 * (ADR-0004) and replaced by serviceable-area / job data.
 */
export function missingMandatoryBlocks(c: GateCandidate): string[] {
  const missing: string[] = [];
  switch (c.pageType) {
    case 'locality':
      if (c.rateBandCount < 3) missing.push('Rate band for 1BHK/2BHK/3BHK');
      if (c.namedLocalFacts < 2) missing.push('≥ 2 named local facts');
      if (c.reviewsCount < 3) missing.push('≥ 3 genuine local reviews');
      if (c.scopedFaqCount < 4) missing.push('4–6 locality-specific FAQs');
      if (!c.hasNamedCoordinator) missing.push('Named coordinator with direct contact');
      break;
    case 'city-hub':
      if (!c.hasRateCard) missing.push('Full city rate card');
      if (c.reviewsCount < 10) missing.push('≥ 10 genuine city reviews');
      if (c.localContentWords < 400) missing.push('Substantial city coverage content');
      break;
    case 'city-service':
      if (!c.hasRateCard) missing.push('Service price drivers for this city');
      if (c.namedLocalFacts < 2) missing.push('≥ 2 named local constraints');
      if (c.reviewsCount < 3) missing.push('≥ 3 reviews for this service in this city');
      if (c.scopedFaqCount < 1) missing.push('Service-specific FAQ block');
      break;
    case 'route':
      if (!c.hasRateCard) missing.push('Price band by load size');
      if (c.localContentWords < 200) missing.push('Transit/border/overnight detail');
      break;
    default:
      break;
  }
  return missing;
}

export function evaluateCandidate(c: GateCandidate): GateResult {
  const breakdown = scoreCandidate(c);
  const score = breakdown.reduce((sum, item) => (item.met ? sum + item.points : sum), 0);
  const missingMandatory = missingMandatoryBlocks(c);
  const passed = score >= PUBLISH_GATE_THRESHOLD && missingMandatory.length === 0;
  return { score, passed, breakdown, missingMandatory };
}
