/*!
 * move-pricing.ts — Packers & Movers price estimator (pure calculation engine).
 *
 * A 1:1 TypeScript port of `d:/mr.Pm/pricing/move-pricing.js` (see PRICING.md). It has
 * NO dependency on Google Maps, the DOM or any UI: feed it a driving distance in km plus
 * the job details and it returns the price with a full breakdown. Distance comes from the
 * Google Distance Matrix API (see ./maps.ts); everything else is this formula, reverse-
 * engineered from 13 real quotes (±10%). Every rate lives in `config` — tune to re-price
 * without touching the logic.
 */

export type TruckFt = 10 | 12 | 14 | 15 | 16 | 17 | 19;

export interface MoveInput {
  /** Driving distance in km (from Google Distance Matrix). */
  distanceKm: number;
  mode?: 'auto' | 'local' | 'intercity';
  truckFt?: number;
  labour?: number;
  packing?: boolean;
  sameBuilding?: boolean;
  pickupFloor?: number;
  pickupLift?: boolean;
  dropFloor?: number;
  dropLift?: boolean;
  twoWheelers?: number;
  heavyLoad?: boolean;
  hillDestination?: boolean;
  /** Pickup and drop are in different states — adds inter-state permit + entry tax. */
  interState?: boolean;
  /** Packing grade: 'basic' is included in the base; 'standard'/'premium' add an uplift. */
  packingGrade?: 'basic' | 'standard' | 'premium';
}

export interface MoveLine {
  label: string;
  amount: number;
}

export interface MoveResult {
  mode: 'local' | 'intercity';
  currency: 'INR';
  total: number;
  rangeLow: number;
  rangeHigh: number;
  breakdown: MoveLine[];
}

/** All tunable rates. Change these to re-price; the logic stays the same. */
export const config = {
  currency: 'INR' as const,
  localThresholdKm: 40,

  // LOCAL mode — flat base by truck size (already includes ~4 labour + basic packing).
  truckBaseLocal: {
    10: 7000,
    12: 7500,
    14: 8000,
    15: 8500,
    16: 9000,
    17: 10000,
    19: 10000,
  } as Record<number, number>,
  sameBuildingRate: 6500,
  labourIncluded: 4,
  extraLabourRate: 700,
  packingDeductLocal: 1200,
  floorNoLiftPerFloor: 300,
  floorLiftFlat: 150,
  heavyLocal: 1000,
  twoWheelerLocal: 1500,

  // INTERCITY mode — fixed service cost + distance.
  intercityServiceBase: 11000,
  perKm: { 10: 40, 12: 40, 14: 42, 15: 42, 16: 50, 17: 50, 19: 68 } as Record<number, number>,
  packingDeductIntercity: 1500,
  heavyIntercity: 2000,
  twoWheelerIntercity: 3000,
  hillSurchargePct: 0.1,

  // Inter-state move (pickup & drop in different states): a flat permit + a % of the
  // subtotal for entry tax / e-way handling. Tune both to your real border costs.
  interStatePermit: 1000,
  interStatePct: 0.03,

  // Packing-grade uplift over the base (which already includes basic packing). Values
  // are for a 14 ft / 2 BHK load and scale with truck size. Tune to your material costs.
  packingUplift: { basic: 0, standard: 1500, premium: 4000 } as Record<string, number>,

  rangePct: 0.07,
  roundTo: 100,
};

const PACKING_LABEL: Record<string, string> = {
  basic: 'basic',
  standard: 'full wrap',
  premium: '3-layer + crates',
};

const roundTo = (n: number, step: number): number => Math.round(n / step) * step;
const num = (v: unknown, def = 0): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : def;
};

/** Snap an arbitrary truck size to the nearest one we have a rate for. */
function snapTruck(ft: number, table: Record<number, number>): number {
  if (table[ft] !== undefined) return ft;
  const keys = Object.keys(table).map(Number);
  return keys.reduce((best, k) => (Math.abs(k - ft) < Math.abs(best - ft) ? k : best), keys[0]!);
}

function floorCharge(floor: number, hasLift: boolean): number {
  const f = Math.max(0, floor);
  if (hasLift) return f > 0 ? config.floorLiftFlat : 0;
  return f * config.floorNoLiftPerFloor;
}

export function estimate(input: MoveInput): MoveResult {
  const cfg = config;
  const i = {
    distanceKm: Math.max(0, num(input.distanceKm, 0)),
    mode: input.mode ?? 'auto',
    truckFt: num(input.truckFt, 14),
    labour: Math.max(0, num(input.labour, 4)),
    packing: input.packing ?? true,
    sameBuilding: input.sameBuilding ?? false,
    pickupFloor: Math.max(0, num(input.pickupFloor, 0)),
    pickupLift: input.pickupLift ?? true,
    dropFloor: Math.max(0, num(input.dropFloor, 0)),
    dropLift: input.dropLift ?? true,
    twoWheelers: Math.max(0, num(input.twoWheelers, 0)),
    heavyLoad: input.heavyLoad ?? false,
    hillDestination: input.hillDestination ?? false,
    interState: input.interState ?? false,
    packingGrade: input.packingGrade ?? 'basic',
  };

  const truck = snapTruck(i.truckFt, cfg.truckBaseLocal);

  // A same-building job is always local.
  let mode: 'local' | 'intercity';
  if (i.sameBuilding) mode = 'local';
  else if (i.mode === 'local' || i.mode === 'intercity') mode = i.mode;
  else mode = i.distanceKm <= cfg.localThresholdKm ? 'local' : 'intercity';

  const items: MoveLine[] = [];
  const add = (label: string, amount: number): void => {
    items.push({ label, amount: Math.round(amount) });
  };

  if (mode === 'local') {
    if (i.sameBuilding) add(`${truck} ft — same-building crew rate`, cfg.sameBuildingRate);
    else add(`${truck} ft truck + crew + basic packing`, cfg.truckBaseLocal[truck]!);

    const extra = Math.max(0, i.labour - cfg.labourIncluded);
    if (extra > 0)
      add(`Extra labour (+${extra} × ₹${cfg.extraLabourRate})`, extra * cfg.extraLabourRate);

    if (!i.packing) add('No packing material', -cfg.packingDeductLocal);

    const fc = floorCharge(i.pickupFloor, i.pickupLift) + floorCharge(i.dropFloor, i.dropLift);
    if (fc > 0) add('Floor carrying (stairs / lift)', fc);

    if (i.heavyLoad) add('Heavy / over-full load', cfg.heavyLocal);
    if (i.twoWheelers > 0)
      add(`Two-wheeler ×${i.twoWheelers} (local)`, i.twoWheelers * cfg.twoWheelerLocal);
  } else {
    add('Packing + load + unload (both ends)', cfg.intercityServiceBase);

    const rate = cfg.perKm[snapTruck(i.truckFt, cfg.perKm)]!;
    add(`${i.distanceKm} km × ₹${rate}/km (${truck} ft)`, i.distanceKm * rate);

    if (!i.packing) add('No packing material', -cfg.packingDeductIntercity);
    if (i.heavyLoad) add('Heavy / over-full load', cfg.heavyIntercity);
    if (i.twoWheelers > 0)
      add(
        `Two-wheeler ×${i.twoWheelers} (₹${cfg.twoWheelerIntercity} each)`,
        i.twoWheelers * cfg.twoWheelerIntercity,
      );

    const subtotal = items.reduce((s, x) => s + x.amount, 0);
    if (i.hillDestination)
      add(
        `Hill / remote surcharge (${cfg.hillSurchargePct * 100}%)`,
        subtotal * cfg.hillSurchargePct,
      );
  }

  // Packing grade uplift — the base already includes basic packing, so 'standard' and
  // 'premium' add over it (scaled by truck size).
  if (i.packingGrade !== 'basic') {
    const up = Math.round((cfg.packingUplift[i.packingGrade] ?? 0) * (truck / 14));
    if (up > 0) add(`Packing — ${PACKING_LABEL[i.packingGrade] ?? i.packingGrade}`, up);
  }

  // Inter-state move: state permit + entry tax, on top of the mode price. Applies to both
  // local (e.g. Delhi ↔ Noida) and intercity moves whenever the two states differ.
  if (i.interState) {
    const sub = items.reduce((s, x) => s + x.amount, 0);
    add('Inter-state permit & tax', cfg.interStatePermit + sub * cfg.interStatePct);
  }

  const raw = items.reduce((s, x) => s + x.amount, 0);
  const total = roundTo(raw, cfg.roundTo);

  return {
    mode,
    currency: cfg.currency,
    total,
    rangeLow: roundTo(total * (1 - cfg.rangePct), cfg.roundTo),
    rangeHigh: roundTo(total * (1 + cfg.rangePct), cfg.roundTo),
    breakdown: items,
  };
}

/** Indian-format a rupee amount, e.g. 75000 → "₹75,000". */
export const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;
