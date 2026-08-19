/*!
 * terrain.ts — classify a drop location into a terrain tier for the pricing engine.
 *
 * The engine (move-pricing.ts) surcharges the road-effort block by tier: foothill +20%,
 * hill +55%, remote +75%; plain adds nothing. We detect the tier from the drop location text
 * (usually a Google-formatted address, which leads with the specific place) against tiered
 * town lists. Anything unrecognised stays 'plain' — a safe default (no wrong surcharge).
 *
 * Order matters: remote → foothill → hill. Foothill is checked BEFORE hill so a foothill/terai
 * town that sits in a hill-named district (e.g. Haldwani in Nainital district) isn't wrongly
 * upgraded to hill if the district name appears in the address. Extend the lists as you learn
 * more routes. Short/ambiguous tokens (e.g. bare 'leh') are intentionally omitted to avoid
 * substring false-positives — rely on the unambiguous name ('ladakh') instead.
 */

import type { Terrain } from './move-pricing';

/** Deep / far interior — bad roads, no return load. Biggest surcharge. */
export const REMOTE_TOWNS = [
  'ladakh',
  'spiti',
  'kaza',
  'kalpa',
  'kinnaur',
  'chitkul',
  'tawang',
  'joshimath',
  'auli',
  'pithoragarh',
  'munsyari',
  'harsil',
  'chopta',
  'kedarnath',
  'badrinath',
  'gangotri',
  'yamunotri',
  'gulmarg',
  'pahalgam',
  'sonamarg',
];

/** Terai / gateway towns — into the hills but on good roads. Mild surcharge. */
export const FOOTHILL_TOWNS = [
  'haldwani',
  'kathgodam',
  'haridwar',
  'rishikesh',
  'kotdwar',
  'ramnagar',
  'siliguri',
  'nahan',
  'paonta sahib',
];

/** Proper hill stations — slow ghat driving. */
export const HILL_TOWNS = [
  'almora',
  'nainital',
  'ranikhet',
  'mukteshwar',
  'kausani',
  'bhimtal',
  'mussoorie',
  'mussorie',
  'dhanaulti',
  'chakrata',
  'lansdowne',
  'bageshwar',
  'uttarkashi',
  'shimla',
  'manali',
  'kullu',
  'kasol',
  'jibhi',
  'tirthan',
  'narkanda',
  'palampur',
  'dharamshala',
  'dharamsala',
  'mcleodganj',
  'dalhousie',
  'kasauli',
  'solan',
  'chail',
  'kufri',
  'gangtok',
  'pelling',
  'ravangla',
  'darjeeling',
  'kalimpong',
  'shillong',
  'cherrapunji',
  'ooty',
  'kotagiri',
  'kodaikanal',
  'yercaud',
  'munnar',
  'coonoor',
  'wayanad',
  'coorg',
  'madikeri',
  'chikmagalur',
  'mount abu',
  'mahabaleshwar',
  'panchgani',
  'lonavala',
  'matheran',
];

/** Best-effort terrain tier for a drop location string. Unknown ⇒ 'plain'. */
export function terrainFor(text: string): Terrain {
  const t = text.toLowerCase();
  if (REMOTE_TOWNS.some((w) => t.includes(w))) return 'remote';
  if (FOOTHILL_TOWNS.some((w) => t.includes(w))) return 'foothill';
  if (HILL_TOWNS.some((w) => t.includes(w))) return 'hill';
  return 'plain';
}
