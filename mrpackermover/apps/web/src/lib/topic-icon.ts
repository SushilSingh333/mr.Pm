import { iconSvg } from './icons.js';

/**
 * An icon for a short topic line - a feature tile's name ("Truck timings", "Monsoon
 * (July to September)") or a trust card ("Gate pass and lift slot arranged") - picked by
 * the words in it, so a page's tiles scan at a glance without anyone choosing icons by
 * hand. The first rule that matches wins; anything else gets the plain check.
 */
const RULES: Array<[RegExp, string]> = [
  [/\b(cost|price|quote|charge|gst|pay|rupee|budget)\b/i, 'fixed-quote'],
  [/\b(insur|claim|cover|liability|damage)/i, 'shield-check'],
  [/\b(crew|id[- ]verified|verified|staff|team)\b/i, 'verified-crew'],
  [/\b(cantt|cantonment|defence|army|clearance|entry permission|security)\b/i, 'badge'],
  [/\b(night|overnight|evening|8 ?pm|after dark)\b/i, 'moon'],
  [/\b(monsoon|rain|flood|waterlog|underpass)/i, 'rain'],
  [/\b(summer|heat|hot|april|june)\b/i, 'sun'],
  [/\b(winter|fog|smog|december|january)\b/i, 'cloud'],
  [/\b(lift|elevator)\b/i, 'lift'],
  [/\b(stair|walk-?up|floor|carry)/i, 'stairs'],
  [/\b(park|parking)\b/i, 'parking'],
  [/\b(truck|vehicle|tempo|no-entry|loading|dock)\b/i, 'truck'],
  // Cost factors: "Home size", "Distance", "Extra loads", "Access".
  [/\b(size|bhk|rooms?|volume)\b/i, 'home-shifting'],
  [/\b(distance|intercity|km)\b/i, 'map-pin'],
  [/\b(loads?|goods)\b/i, 'packing-unpacking'],
  [/\baccess\b/i, 'road'],
  [
    /\b(gate|pass|noc|permission|approval|rwa|society|societies|tower|township|possession|handover)\b/i,
    'building',
  ],
  [/\b(key|new flat|move-in)\b/i, 'key'],
  [
    /\b(lane|road|traffic|route|expressway|highway|border|crossing|junction|chowk|metro)\b/i,
    'road',
  ],
  [
    /\b(month-end|month|weekend|date|season|wedding|festival|navratri|diwali|semester|mela)\b/i,
    'calendar',
  ],
  [
    /\b(office|work|business|it |server|desk|workstation|factory|industrial|warehouse|workshop)\b/i,
    'briefcase',
  ],
  [/\b(shop|market|bazaar|showroom|stock|mall)\b/i, 'store'],
  [/\b(student|pg|campus|coaching|college|hostel|universit)/i, 'school'],
  [
    /\b(pack|fragile|glass|art|furniture|crate|antique|marble|wardrobe|almirah)/i,
    'packing-unpacking',
  ],
  [/\b(car|bike|scooter|two-wheeler)\b/i, 'car-transport'],
  [/\b(time|hour|timing|early|morning)\b/i, 'clock'],
];

export function topicIcon(text: string): string {
  for (const [re, name] of RULES) if (re.test(text)) return iconSvg(name);
  return iconSvg('check');
}
