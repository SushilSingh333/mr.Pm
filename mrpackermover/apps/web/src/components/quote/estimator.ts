/*!
 * estimator.ts — quote router. Picks the pricing engine by driving distance, so the
 * widget calls one function and never has to know which engine ran.
 *
 *   • Under 1200 km  → the size-based engine in ./pricing (BHK + crew/material + per-km).
 *                      The bar only collects a truck size (ft), so we map ft → BHK here.
 *   • 1200 km and up → the existing truck/per-km engine in ./move-pricing (unchanged).
 *
 * Output is normalised to move-pricing's MoveResult so both paths render the same way:
 * a pre-GST range with a separate "+ GST" badge. The size engine's total is GST-inclusive,
 * so we strip its GST line back to the taxable value before building the range — otherwise
 * the badge would double-count tax on short moves.
 */

import { estimate as estimateTruck, config, type MoveInput, type MoveResult } from './move-pricing';
import { estimate as estimateBySize, type SizeKey } from './pricing';

export { inr } from './move-pricing';

/**
 * At or above this driving distance we use the truck engine; below it, the size engine.
 *
 * Set to 0 on 2026-08-18: the truck engine (move-pricing) is calibrated to real quotes at
 * ALL distances (median error ~3% vs the size engine's ~50%, which overpriced locals ~2× and
 * ignored hill/interstate). So every route now goes through the truck engine; the size engine
 * below is kept only for `PLACES`/`resolvePlace` (used by the widget's fallback distance).
 */
export const SIZE_ENGINE_MAX_KM = 0;

/** The bar's inputs plus the size-engine-only fields (date drives surge; add-ons default off). */
export interface QuoteInput extends MoveInput {
  /** Move date (YYYY-MM-DD) — the size engine's weekend / month-end surge. */
  date?: string;
  store?: boolean;
  car?: boolean;
  clean?: boolean;
}

/** The bar picks a truck size (ft); the size engine wants a home size (BHK). */
function truckFtToSize(ft: number): SizeKey {
  if (ft <= 10) return 'rk';
  if (ft <= 12) return '1';
  if (ft <= 14) return '2';
  if (ft <= 16) return '3';
  return '4';
}

const roundHundred = (n: number): number => Math.round(n / config.roundTo) * config.roundTo;

export function quote(input: QuoteInput): MoveResult {
  const km = Math.max(0, input.distanceKm || 0);

  // Long-haul (≥ 1200 km) keeps the existing truck engine, untouched.
  if (km >= SIZE_ENGINE_MAX_KM) return estimateTruck(input);

  // Short / regional (< 1200 km): price off the size engine, mapping the ft dropdown to BHK.
  const r = estimateBySize({
    size: truckFtToSize(input.truckFt ?? 14),
    km,
    fFloor: input.pickupFloor ?? 0,
    fLift: input.pickupLift ?? true,
    tFloor: input.dropFloor ?? 0,
    tLift: input.dropLift ?? true,
    pack: input.packingGrade ?? 'basic',
    date: input.date ?? '',
    store: input.store ?? false,
    car: input.car ?? false,
    clean: input.clean ?? false,
  });

  // The size engine's total is GST-inclusive; strip the GST line so the "+ GST" badge stays
  // truthful and both engines display a pre-GST range with the same ± band.
  const gstLine = r.lines.find(([label]) => /gst/i.test(label));
  const preGst = r.total - (gstLine ? gstLine[1] : 0);

  return {
    mode: km <= config.localThresholdKm ? 'local' : 'intercity',
    currency: config.currency,
    total: roundHundred(preGst),
    rangeLow: roundHundred(preGst * (1 - config.rangePct)),
    rangeHigh: roundHundred(preGst * (1 + config.rangePct)),
    breakdown: r.lines
      .filter(([label]) => !/gst/i.test(label))
      .map(([label, amount]) => ({ label, amount })),
  };
}
