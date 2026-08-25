/*!
 * calibration.ts — real packers-&-movers quotes we fit the engine against.
 *
 * DEV-ONLY. Not imported by the site. `pricing/fit-pricing.ts` runs the engine
 * over every row and reports how far each prediction is from the real quote, so
 * tuning `move-pricing.ts` becomes measurable instead of guesswork.
 *
 * Distances are APPROXIMATE road km (production uses the live Google Distance
 * Matrix). Good enough to fit the shape; replace with exact km as we get them.
 * `realLow`/`realHigh` are the actual vendor quotes (a single number ⇒ low==high).
 *
 * Terrain tiers: plain | foothill | hill | remote  (drives the terrain multiplier).
 */

export type Terrain = 'plain' | 'foothill' | 'hill' | 'remote';

export interface QuoteSample {
  id: string;
  from: string;
  to: string;
  km: number;
  truckFt: number;
  terrain: Terrain;
  mode: 'local' | 'intercity';
  interState: boolean;
  twoWheelers?: number;
  packing?: boolean;
  sameBuilding?: boolean;
  /** Full-truck flat "gadi" price the vendor quoted, not an itemised build. */
  dedicated?: boolean;
  realLow: number;
  realHigh: number;
  notes?: string;
}

export const SAMPLES: QuoteSample[] = [
  // ---- Local (same city / ≤40 km) ----
  {
    id: 'noida61-vasundhara',
    from: 'Noida Sector 61 (2F)',
    to: 'Vasundhara Sec 11 (1F)',
    km: 14,
    truckFt: 14,
    terrain: 'plain',
    mode: 'local',
    interState: false,
    realLow: 8500,
    realHigh: 8500,
    notes: '5-seat sofa, 2 AC, bed, w/machine, fridge, dining — full 1BHK+',
  },
  {
    id: 'noida45-noida107',
    from: 'Noida Sector 45',
    to: 'Noida Sector 107',
    km: 12,
    truckFt: 14,
    terrain: 'plain',
    mode: 'local',
    interState: false,
    realLow: 9500,
    realHigh: 9500,
    notes: 'fridge, window+split AC, w/machine, bed, sofa-cum-bed, mattress',
  },
  {
    id: 'vaishali-siddharthvihar',
    from: 'Vaishali',
    to: 'Siddharth Vihar (Ghaziabad)',
    km: 10,
    truckFt: 14,
    terrain: 'plain',
    mode: 'local',
    interState: false,
    realLow: 7800,
    realHigh: 7800,
    notes: 'queen bed, diwan, almirah, 5-seat sofa, w/machine, TV, utensils',
  },
  {
    id: 'sector34-local',
    from: 'Sector 34 B1 Aravali (1F)',
    to: 'Sector 34 B10 Uday Giri 2 (2F)',
    km: 3,
    truckFt: 16,
    terrain: 'plain',
    mode: 'local',
    interState: false,
    realLow: 9500,
    realHigh: 9500,
    notes: 'big list: almirah, king bed, 2 sofa sets, RO, window AC, walkpad, cycle',
  },
  {
    id: 'noidaext-sametower',
    from: 'Noida Extension 14F',
    to: 'Same tower 23F',
    km: 0,
    truckFt: 14,
    terrain: 'plain',
    mode: 'local',
    interState: false,
    sameBuilding: true,
    realLow: 6500,
    realHigh: 6500,
    notes: 'vertical-only move; without packing 5,300',
  },

  // ---- Intercity plain ----
  {
    id: 'ghaziabad-kanpur',
    from: 'Vasundhara, Ghaziabad',
    to: 'Kanpur (near rly stn)',
    km: 470,
    truckFt: 15,
    terrain: 'plain',
    mode: 'intercity',
    interState: false,
    twoWheelers: 1,
    realLow: 28500,
    realHigh: 28500,
    notes: 'double bed, diwan, sofa 3+1+1, fridge, w/machine, split AC, Avenger 150',
  },
  {
    id: 'gnwest-lucknow',
    from: 'Greater Noida West',
    to: 'Lucknow Indiranagar',
    km: 450,
    truckFt: 14,
    terrain: 'plain',
    mode: 'intercity',
    interState: false,
    realLow: 33000,
    realHigh: 33000,
    notes:
      'HEAVY load for 14ft: 2 beds, 2 AC, fridge, w/machine, microwave, 2 cylinders — really a 16-17ft load',
  },
  {
    id: 'noida-chennai',
    from: 'Noida',
    to: 'Chennai',
    km: 2200,
    truckFt: 14,
    terrain: 'plain',
    mode: 'intercity',
    interState: true,
    realLow: 93000,
    realHigh: 100000,
    notes: 'long-haul reference the user cited',
  },
  {
    id: 'gnoida-kolkata',
    from: 'Greater Noida Sec 1',
    to: 'Kolkata Bidhannagar',
    km: 1500,
    truckFt: 17,
    terrain: 'plain',
    mode: 'intercity',
    interState: true,
    dedicated: true,
    realLow: 75000,
    realHigh: 75000,
    notes: 'dedicated "separate gadi" flat price — full-house long-haul',
  },

  // ---- Intercity hill / foothill ----
  {
    id: 'vasundhara-haldwani',
    from: 'Sector 3 Vasundhara',
    to: 'Haldwani, Uttarakhand',
    km: 250,
    truckFt: 15,
    terrain: 'foothill',
    mode: 'intercity',
    interState: true,
    realLow: 23700,
    realHigh: 23700,
    notes: 'terai gateway town — foothill, not deep hill',
  },
  {
    id: 'gazipur-dehradun',
    from: 'Gazipur, Delhi',
    to: 'Windlass River Valley, Dehradun',
    km: 255,
    truckFt: 19,
    terrain: 'plain', // doon valley on the Delhi–Dehradun highway — a near-plain drive, not a hill climb

    mode: 'intercity',
    interState: true,
    twoWheelers: 2,
    realLow: 31000,
    realHigh: 31000,
    notes: 'doon valley (mild); 3 beds, 5-seat sofa, dining, 2 scooty',
  },
  {
    id: 'delhi-almora',
    from: 'Maharani Bagh, New Delhi',
    to: 'Almora, Uttarakhand',
    km: 380,
    truckFt: 14,
    terrain: 'hill',
    mode: 'intercity',
    interState: true,
    realLow: 35000,
    realHigh: 40000,
    notes: 'deep Kumaon hill (~1640m), narrow ghats — user-cited hill reference',
  },
];
