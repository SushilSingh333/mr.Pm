/*!
 * fit-pricing.ts — run the live engine over every real quote and report the gap.
 *
 * DEV-ONLY.  Usage from the repo root:
 *   node_modules/.bin/tsx pricing/fit-pricing.ts
 *
 * Prints predicted-vs-real for each calibration row plus summary error stats, so
 * every change to move-pricing.ts can be judged by "did the median error drop?".
 */

import { quote, type QuoteInput } from '../apps/web/src/components/quote/estimator.ts';
import { terrainFor } from '../apps/web/src/components/quote/terrain.ts';
import { SAMPLES, type QuoteSample } from './calibration.ts';

const inr = (n: number): string => Math.round(n).toLocaleString('en-IN');
const pad = (s: string | number, n: number): string => String(s).padStart(n);
const padr = (s: string | number, n: number): string => String(s).padEnd(n);

/** Map a calibration row to the LIVE production path (router → size/truck engine). */
function toInput(s: QuoteSample): QuoteInput {
  return {
    distanceKm: s.km,
    mode: s.mode,
    truckFt: s.truckFt,
    packing: s.packing ?? true,
    sameBuilding: s.sameBuilding ?? false,
    twoWheelers: s.twoWheelers ?? 0,
    interState: s.interState,
    terrainTier: s.terrain,
    date: '',
  };
}

const PASS = 0.12; // within ±12% of the real quote's midpoint counts as a hit.

let hits = 0;
const errs: number[] = [];

console.log(
  padr('route', 30) +
    pad('km', 6) +
    pad('ft', 4) +
    pad('terrain', 10) +
    pad('real', 16) +
    pad('engine', 9) +
    pad('err%', 8) +
    '  hit',
);
console.log('-'.repeat(90));

for (const s of SAMPLES) {
  const r = quote(toInput(s));
  const mid = (s.realLow + s.realHigh) / 2;
  const err = (r.total - mid) / mid;
  const hit = Math.abs(err) <= PASS;
  if (hit) hits++;
  errs.push(Math.abs(err));

  const realStr =
    s.realLow === s.realHigh ? inr(s.realLow) : `${inr(s.realLow)}-${inr(s.realHigh)}`;
  console.log(
    padr(`${s.from} → ${s.to}`.slice(0, 29), 30) +
      pad(s.km, 6) +
      pad(s.truckFt, 4) +
      pad(s.terrain, 10) +
      pad(realStr, 16) +
      pad(inr(r.total), 9) +
      pad((err >= 0 ? '+' : '') + (err * 100).toFixed(0) + '%', 8) +
      '  ' +
      (hit ? '✓' : '✗'),
  );
}

errs.sort((a, b) => a - b);
const median = errs[Math.floor(errs.length / 2)]!;
const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
const worst = errs[errs.length - 1]!;

console.log('-'.repeat(90));
console.log(
  `hits within ±${PASS * 100}%: ${hits}/${SAMPLES.length}` +
    `   |   median err ${(median * 100).toFixed(1)}%` +
    `   mean ${(mean * 100).toFixed(1)}%` +
    `   worst ${(worst * 100).toFixed(1)}%`,
);

// --- Terrain classifier self-check (the widget's auto-detection) ---
const TERRAIN_CASES: [string, string][] = [
  ['Almora, Uttarakhand 263601, India', 'hill'],
  ['Haldwani, Uttarakhand, India', 'foothill'], // terai gateway, NOT hill (in Nainital dist.)
  ['Leh, Ladakh, India', 'remote'],
  ['Joshimath, Uttarakhand', 'remote'],
  ['Mussoorie, Dehradun, Uttarakhand', 'hill'], // 'dehradun' in string but Mussoorie wins
  ['Dehradun, Uttarakhand', 'plain'], // highway valley city
  ['Manali, Himachal Pradesh', 'hill'],
  ['Gangtok, Sikkim', 'hill'],
  ['Ooty, Tamil Nadu', 'hill'],
  ['Kanpur, Uttar Pradesh', 'plain'],
  ['Lucknow, Uttar Pradesh', 'plain'],
];
let tOk = 0;
const tFails: string[] = [];
for (const [addr, want] of TERRAIN_CASES) {
  const got = terrainFor(addr);
  if (got === want) tOk++;
  else tFails.push(`  ✗ "${addr}" → ${got} (expected ${want})`);
}
console.log(`\nterrain classifier: ${tOk}/${TERRAIN_CASES.length} correct`);
if (tFails.length) console.log(tFails.join('\n'));
