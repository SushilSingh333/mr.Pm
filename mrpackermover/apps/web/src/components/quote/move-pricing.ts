/*!
 * move-pricing.ts — Packers & Movers price estimator (pure calculation engine).
 *
 * NO dependency on Google Maps, the DOM or any UI: feed it a driving distance in km plus
 * the job details and it returns the customer price with a full cost breakdown. Distance
 * comes from the Google Distance Matrix API (see ./maps.ts); everything else is this
 * formula. Every rate lives in `config` — tune to re-price without touching the logic.
 *
 * Model (calibrated from real route quotes, refreshed 2026-08-18):
 *   • Intercity "truck cost" is a straight per-km transport charge that already covers
 *     loading, unloading and basic packing (the way a mover quotes a truck). 14 ft plain
 *     ≈ ₹28/km.
 *   • A terrain multiplier scales the road-effort block (transport + load/unload + food) for
 *     foothill (+20%) / hill (+55%) / remote (+75%) destinations; plain adds nothing.
 *   • Everything above is our COST; the customer price is cost × (1 + margin) — a thin margin
 *     on local moves, the full margin on intercity.
 */

export type TruckFt = 10 | 12 | 14 | 15 | 16 | 17 | 19;

/** Terrain tier of the destination — scales the road-effort block on intercity moves. */
export type Terrain = 'plain' | 'foothill' | 'hill' | 'remote';

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
  /** Terrain tier of the drop — scales the road-effort block. Overrides `hillDestination`. */
  terrainTier?: Terrain;
  /** Legacy: drop is a hill town. If set with no `terrainTier`, treated as 'hill'. */
  hillDestination?: boolean;
  /** Pickup and drop are in different states — adds inter-state permit + entry tax. */
  interState?: boolean;
  /** Packing grade: 'basic' is included in the truck cost; 'standard' (3-layer) adds an uplift. */
  packingGrade?: 'basic' | 'standard';
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

  // LOCAL mode (≤40 km) — flat base by truck size (truck + basic packing). Loading and
  // unloading labour is now a separate line (loadUnloadLocal), so these are truck-only;
  // truck-only + ₹2,500 load/unload lands back on the old all-in local price.
  truckBaseLocal: {
    10: 4500,
    12: 5000,
    14: 5500,
    15: 6000,
    16: 6500,
    17: 7500,
    19: 7500,
  } as Record<number, number>,
  sameBuildingRate: 6100,
  labourIncluded: 4,
  extraLabourRate: 700,
  packingDeductLocal: 1200,
  // Loading + unloading labour. Local = ₹2,500; a far (intercity) move DOUBLES it, since
  // the crew handles both ends far apart. Intercity also pays the crew a food allowance for
  // every day they're on the road (kmPerCrewDay sets the day count).
  loadUnloadLocal: 2500,
  loadUnloadIntercity: 5000,
  foodPerDay: 1000,
  kmPerCrewDay: 500,
  // Per-floor carrying cost at each end. Stairs (no lift) is hard labour; a lift still
  // costs per floor (more trips, longer carry, lift waiting) but far less.
  floorNoLiftPerFloor: 350,
  floorLiftPerFloor: 100,
  heavyLocal: 1000,
  twoWheelerLocal: 1500,

  // INTERCITY mode (>40 km) — the "truck cost" is a straight per-km transport charge that
  // already covers loading, unloading and basic packing. Re-calibrated 2026-08-18 against a
  // dozen real route quotes: 14 ft plain ≈ ₹28/km (Noida→Chennai ~2200 km → ~₹95k;
  // Ghaziabad→Kanpur ~470 km → ~₹29.5k). Sizes step up with the truck. A short intercity hop
  // never falls below `intercityMinCharge`, so 41 km isn't priced at ₹1,150. The declining
  // *effective* per-km on long hauls comes from the fixed load/unload + food + margin being
  // spread over more km — the per-km line itself stays flat.
  perKm: { 10: 24, 12: 26, 14: 28, 15: 29, 16: 31, 17: 33, 19: 35 } as Record<number, number>,
  intercityMinCharge: 8000,
  // Terrain multiplier on the road-effort block (transport + load/unload + food). Hill/mountain
  // roads are slower, harder and often return empty. Calibrated to real quotes: Almora (deep
  // Kumaon hill) ≈ +55%, Haldwani (foothill/terai gateway) ≈ +20%, valley towns ≈ plain.
  terrainMult: { plain: 1, foothill: 1.2, hill: 1.55, remote: 1.75 } as Record<Terrain, number>,
  packingDeductIntercity: 1500,
  heavyIntercity: 2000,
  twoWheelerIntercity: 3000,

  // Inter-state move (pickup & drop in different states): a flat permit + a % of the
  // subtotal for entry tax / e-way handling. Tune both to your real border costs.
  interStatePermit: 1000,
  interStatePct: 0.03,

  // Packing grades. The truck cost already includes basic packing (cartons + wrap), so only
  // 'standard' (3-layer + crates) adds an uplift, scaled by truck size. Tune to your material cost.
  packingUplift: { basic: 0, standard: 4000 } as Record<string, number>,

  // Our margin — added on top of cost. Customer price = cost × (1 + profit). Local moves are
  // short and highly competitive, so they carry a thin margin (they're already priced near the
  // real market number); intercity carries the full margin. Calibrated to real local quotes
  // (₹7.8k–9.5k for a 14–16 ft load) and intercity quotes.
  profitLocalPct: 0.07,
  profitIntercityPct: 0.25,

  rangePct: 0.11,
  roundTo: 100,
};

const PACKING_LABEL: Record<string, string> = {
  basic: 'cartons + wrap',
  standard: '3-layer + crates',
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
  if (f === 0) return 0; // ground floor at that end — no carrying either way
  return f * (hasLift ? config.floorLiftPerFloor : config.floorNoLiftPerFloor);
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
    terrainTier: input.terrainTier ?? (input.hillDestination ? 'hill' : 'plain'),
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
    if (i.sameBuilding) {
      add(`${truck} ft — same-building crew rate`, cfg.sameBuildingRate);
    } else {
      add(`${truck} ft truck + basic packing`, cfg.truckBaseLocal[truck]!);
      add('Loading + unloading', cfg.loadUnloadLocal);
    }

    const extra = Math.max(0, i.labour - cfg.labourIncluded);
    if (extra > 0)
      add(`Extra labour (+${extra} × ₹${cfg.extraLabourRate})`, extra * cfg.extraLabourRate);

    if (!i.packing) add('No packing material', -cfg.packingDeductLocal);

    if (i.heavyLoad) add('Heavy / over-full load', cfg.heavyLocal);
    if (i.twoWheelers > 0)
      add(`Two-wheeler ×${i.twoWheelers} (local)`, i.twoWheelers * cfg.twoWheelerLocal);
  } else {
    // Truck cost = distance × per-km (covers truck + load/unload + basic packing), never
    // below the minimum.
    const rate = cfg.perKm[snapTruck(i.truckFt, cfg.perKm)]!;
    const transport = Math.max(cfg.intercityMinCharge, i.distanceKm * rate);
    add(`${i.distanceKm} km × ₹${rate}/km (${truck} ft)`, transport);

    // Loading + unloading (doubled vs local — both ends, far apart) and the crew's food
    // allowance for the days they're on the road (drive days + a day for load/unload).
    const loadUnload = cfg.loadUnloadIntercity;
    add('Loading + unloading (both ends)', loadUnload);
    const crewDays = Math.ceil(i.distanceKm / cfg.kmPerCrewDay) + 1;
    const food = crewDays * cfg.foodPerDay;
    add(`Crew food allowance (${crewDays} days × ₹${cfg.foodPerDay})`, food);

    // Terrain surcharge on the road-effort block (transport + load/unload + food): hill and
    // foothill roads are slower/harder and the truck often returns empty. Plain adds nothing.
    const tMult = cfg.terrainMult[i.terrainTier] ?? 1;
    if (tMult > 1) {
      add(
        `Terrain — ${i.terrainTier} (+${Math.round((tMult - 1) * 100)}%)`,
        (tMult - 1) * (transport + loadUnload + food),
      );
    }

    if (!i.packing) add('No packing material', -cfg.packingDeductIntercity);
    if (i.heavyLoad) add('Heavy / over-full load', cfg.heavyIntercity);
    if (i.twoWheelers > 0)
      add(
        `Two-wheeler ×${i.twoWheelers} (₹${cfg.twoWheelerIntercity} each)`,
        i.twoWheelers * cfg.twoWheelerIntercity,
      );
  }

  // Floor / access carrying at each end. The crew hauls the load up or down the same number
  // of floors whether the truck then drives 5 km or 500 km, so this applies to BOTH modes.
  const fc = floorCharge(i.pickupFloor, i.pickupLift) + floorCharge(i.dropFloor, i.dropLift);
  if (fc > 0) add('Floor carrying (stairs / lift)', fc);

  // Packing grade uplift — the truck cost already includes basic packing, so 'standard'
  // (3-layer + crates) adds over it (scaled by truck size).
  if (i.packingGrade !== 'basic') {
    const up = Math.round((cfg.packingUplift[i.packingGrade] ?? 0) * (truck / 14));
    if (up > 0) add(`Packing — ${PACKING_LABEL[i.packingGrade] ?? i.packingGrade}`, up);
  }

  // Inter-state move: state permit + entry tax, on top of the mode price.
  if (i.interState) {
    const sub = items.reduce((s, x) => s + x.amount, 0);
    add('Inter-state permit & tax', cfg.interStatePermit + sub * cfg.interStatePct);
  }

  // Everything above is our COST. The customer price adds a flat profit margin on top of
  // the whole quote (kept off the itemised breakdown so the margin isn't exposed).
  const cost = items.reduce((s, x) => s + x.amount, 0);
  const profit = mode === 'local' ? cfg.profitLocalPct : cfg.profitIntercityPct;
  const total = roundTo(cost * (1 + profit), cfg.roundTo);

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
