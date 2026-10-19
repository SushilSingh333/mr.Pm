import type { MoveResult } from './move-pricing';

/**
 * The price checker's offer: a percentage off every estimate it shows (19 Oct 2026, the
 * owner: "20% off on every move in price checker").
 *
 * THE ONE PLACE TO CHANGE IT. Set `pct` to another number to change the offer, or to 0
 * to switch it off; the price bar, /get-quote, the thank-you page and the estimate saved
 * on the lead (which the sales dashboard and the customer's account show) all follow,
 * because they all take their price through `withOffer()`.
 *
 * It is applied AFTER the engine, not inside it: the engine is calibrated against real
 * quotes (pricing/fit-pricing.ts), and an offer is a sales decision, not a cost.
 */
export const OFFER_PCT = 20;

/** "20% off", for the badge and the lead's "Priced on". */
export const offerLabel = (): string => `${OFFER_PCT}% off`;

export interface OfferedResult extends MoveResult {
  /** The prices before the offer, for the struck-through "was"; absent with no offer. */
  before?: { total: number; rangeLow: number; rangeHigh: number };
}

const roundHundred = (n: number): number => Math.round(n / 100) * 100;

/** The engine's result with the offer taken off, rounded to the nearest ₹100. */
export function withOffer(r: MoveResult): OfferedResult {
  if (!(OFFER_PCT > 0 && OFFER_PCT < 100)) return r;
  const keep = 1 - OFFER_PCT / 100;
  return {
    ...r,
    total: roundHundred(r.total * keep),
    rangeLow: roundHundred(r.rangeLow * keep),
    rangeHigh: roundHundred(r.rangeHigh * keep),
    before: { total: r.total, rangeLow: r.rangeLow, rangeHigh: r.rangeHigh },
  };
}
