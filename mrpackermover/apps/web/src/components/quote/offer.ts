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

/**
 * Whether the site SAYS there is an offer (11 Nov 2026, the owner: keep the discount, but
 * stop mentioning it). Off: every price is still OFFER_PCT lower, but there is no badge,
 * no struck-through "was" price and no offer note on the forms - the discounted price is
 * simply the price. The lead's "Priced on" still records the discount, so the sales team
 * quotes the same figure the customer saw. On: the badge, the "was" price and the notes
 * come back.
 */
export const OFFER_SHOWN = false;

/** "20% off", for the badge and the lead's "Priced on". */
export const offerLabel = (): string => `${OFFER_PCT}% off`;

export interface OfferedResult extends MoveResult {
  /** True when the offer was taken off these prices, shown or not. */
  applied: boolean;
  /**
   * The prices before the offer, for the struck-through "was". Absent with no offer, and
   * absent while the offer is not shown (OFFER_SHOWN).
   */
  before?: { total: number; rangeLow: number; rangeHigh: number };
}

const roundHundred = (n: number): number => Math.round(n / 100) * 100;

/** The engine's result with the offer taken off, rounded to the nearest ₹100. */
export function withOffer(r: MoveResult): OfferedResult {
  if (!(OFFER_PCT > 0 && OFFER_PCT < 100)) return { ...r, applied: false };
  const keep = 1 - OFFER_PCT / 100;
  return {
    ...r,
    total: roundHundred(r.total * keep),
    rangeLow: roundHundred(r.rangeLow * keep),
    rangeHigh: roundHundred(r.rangeHigh * keep),
    applied: true,
    ...(OFFER_SHOWN
      ? { before: { total: r.total, rangeLow: r.rangeLow, rangeHigh: r.rangeHigh } }
      : {}),
  };
}
