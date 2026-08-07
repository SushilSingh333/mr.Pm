/**
 * Pricing engine (ported from the v3 prototype). Every number in RATE is a business
 * input — tune those, not the maths. Distance is a haversine × road-factor so no
 * billable API is needed in the browser; swap searchPlaces/routeDistanceKm for a
 * Places/Routes adapter later without touching the estimator.
 */

export type SizeKey = 'rk' | '1' | '2' | '3' | '4';
export type PackKey = 'basic' | 'standard' | 'premium';

export interface Place {
  name: string;
  sub: string;
  zone: string;
  lat: number;
  lng: number;
}

export const PLACES: Place[] = [
  // South Delhi
  { name: 'Saket', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5245, lng: 77.2066 },
  { name: 'Hauz Khas', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5494, lng: 77.2001 },
  { name: 'Greater Kailash', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5494, lng: 77.2426 },
  { name: 'Lajpat Nagar', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5677, lng: 77.2433 },
  { name: 'Vasant Kunj', sub: 'South Delhi', zone: 'South Delhi', lat: 28.52, lng: 77.1591 },
  { name: 'Chattarpur', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5062, lng: 77.1855 },
  { name: 'Kalkaji', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5355, lng: 77.2588 },
  { name: 'Okhla Phase III', sub: 'South Delhi', zone: 'South Delhi', lat: 28.5495, lng: 77.283 },
  // West / Central
  { name: 'Dwarka', sub: 'West Delhi', zone: 'West Delhi', lat: 28.5921, lng: 77.046 },
  { name: 'Janakpuri', sub: 'West Delhi', zone: 'West Delhi', lat: 28.6219, lng: 77.0878 },
  { name: 'Punjabi Bagh', sub: 'West Delhi', zone: 'West Delhi', lat: 28.6742, lng: 77.131 },
  { name: 'Uttam Nagar', sub: 'West Delhi', zone: 'West Delhi', lat: 28.6219, lng: 77.0559 },
  { name: 'Rajouri Garden', sub: 'West Delhi', zone: 'West Delhi', lat: 28.649, lng: 77.12 },
  { name: 'Karol Bagh', sub: 'Central Delhi', zone: 'West Delhi', lat: 28.6519, lng: 77.1909 },
  { name: 'Connaught Place', sub: 'Central Delhi', zone: 'West Delhi', lat: 28.6315, lng: 77.2167 },
  // North
  { name: 'Rohini', sub: 'North West Delhi', zone: 'North Delhi', lat: 28.7495, lng: 77.0565 },
  { name: 'Pitampura', sub: 'North West Delhi', zone: 'North Delhi', lat: 28.6942, lng: 77.1314 },
  { name: 'Model Town', sub: 'North Delhi', zone: 'North Delhi', lat: 28.7051, lng: 77.191 },
  { name: 'Civil Lines', sub: 'North Delhi', zone: 'North Delhi', lat: 28.68, lng: 77.225 },
  { name: 'Narela', sub: 'North Delhi', zone: 'North Delhi', lat: 28.853, lng: 77.092 },
  // East
  { name: 'Mayur Vihar', sub: 'East Delhi', zone: 'East Delhi', lat: 28.6089, lng: 77.2951 },
  { name: 'Preet Vihar', sub: 'East Delhi', zone: 'East Delhi', lat: 28.6412, lng: 77.2953 },
  { name: 'Dilshad Garden', sub: 'East Delhi', zone: 'East Delhi', lat: 28.6812, lng: 77.3213 },
  { name: 'Laxmi Nagar', sub: 'East Delhi', zone: 'East Delhi', lat: 28.63, lng: 77.277 },
  // Noida
  { name: 'Sector 18', sub: 'Noida', zone: 'Noida', lat: 28.5708, lng: 77.326 },
  { name: 'Sector 62', sub: 'Noida', zone: 'Noida', lat: 28.627, lng: 77.372 },
  { name: 'Sector 137', sub: 'Noida', zone: 'Noida', lat: 28.4998, lng: 77.4165 },
  { name: 'Jaypee Wish Town', sub: 'Sector 128, Noida', zone: 'Noida', lat: 28.51, lng: 77.38 },
  { name: 'Lotus Boulevard', sub: 'Sector 100, Noida', zone: 'Noida', lat: 28.53, lng: 77.37 },
  { name: 'Cleo County', sub: 'Sector 121, Noida', zone: 'Noida', lat: 28.575, lng: 77.39 },
  { name: 'Prateek Wisteria', sub: 'Sector 77, Noida', zone: 'Noida', lat: 28.585, lng: 77.34 },
  { name: 'Mahagun Moderne', sub: 'Sector 78, Noida', zone: 'Noida', lat: 28.59, lng: 77.38 },
  { name: 'Amrapali Sapphire', sub: 'Sector 45, Noida', zone: 'Noida', lat: 28.54, lng: 77.36 },
  { name: 'Pari Chowk', sub: 'Greater Noida', zone: 'Noida', lat: 28.47, lng: 77.51 },
  { name: 'Gaur City', sub: 'Greater Noida West', zone: 'Noida', lat: 28.61, lng: 77.43 },
  {
    name: 'Nirala Estate',
    sub: 'Techzone 4, Greater Noida West',
    zone: 'Noida',
    lat: 28.62,
    lng: 77.44,
  },
  // Gurugram
  { name: 'Sector 29', sub: 'Gurugram', zone: 'Gurugram', lat: 28.4667, lng: 77.0667 },
  { name: 'DLF Phase 3', sub: 'Gurugram', zone: 'Gurugram', lat: 28.493, lng: 77.096 },
  { name: 'Golf Course Road', sub: 'Gurugram', zone: 'Gurugram', lat: 28.44, lng: 77.1 },
  { name: 'Sohna Road', sub: 'Gurugram', zone: 'Gurugram', lat: 28.41, lng: 77.04 },
  {
    name: 'DLF The Camellias',
    sub: 'Sector 42, Gurugram',
    zone: 'Gurugram',
    lat: 28.44,
    lng: 77.098,
  },
  {
    name: 'Ireo Victory Valley',
    sub: 'Sector 67, Gurugram',
    zone: 'Gurugram',
    lat: 28.436,
    lng: 77.05,
  },
  { name: 'Sobha City', sub: 'Sector 108, Gurugram', zone: 'Gurugram', lat: 28.42, lng: 76.98 },
  {
    name: 'Vatika India Next',
    sub: 'Sector 82, Gurugram',
    zone: 'Gurugram',
    lat: 28.4,
    lng: 76.97,
  },
  { name: 'Manesar', sub: 'Gurugram', zone: 'Gurugram', lat: 28.355, lng: 76.94 },
  // Ghaziabad
  { name: 'Indirapuram', sub: 'Ghaziabad', zone: 'Ghaziabad', lat: 28.6414, lng: 77.3711 },
  { name: 'Vaishali', sub: 'Ghaziabad', zone: 'Ghaziabad', lat: 28.644, lng: 77.339 },
  { name: 'Vasundhara', sub: 'Ghaziabad', zone: 'Ghaziabad', lat: 28.66, lng: 77.37 },
  { name: 'Raj Nagar Extension', sub: 'Ghaziabad', zone: 'Ghaziabad', lat: 28.71, lng: 77.43 },
  { name: 'Crossings Republik', sub: 'Ghaziabad', zone: 'Ghaziabad', lat: 28.635, lng: 77.42 },
  // Faridabad
  { name: 'Sector 15', sub: 'Faridabad', zone: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  {
    name: 'Greater Faridabad',
    sub: 'Neharpar, Faridabad',
    zone: 'Faridabad',
    lat: 28.38,
    lng: 77.33,
  },
  { name: 'Ballabgarh', sub: 'Faridabad', zone: 'Faridabad', lat: 28.34, lng: 77.32 },
  // outstation anchors (intercity lanes)
  { name: 'Jaipur', sub: 'Rajasthan · intercity', zone: 'Outstation', lat: 26.9124, lng: 75.7873 },
  { name: 'Chandigarh', sub: 'Punjab · intercity', zone: 'Outstation', lat: 30.7333, lng: 76.7794 },
  {
    name: 'Lucknow',
    sub: 'Uttar Pradesh · intercity',
    zone: 'Outstation',
    lat: 26.8467,
    lng: 80.9462,
  },
  {
    name: 'Dehradun',
    sub: 'Uttarakhand · intercity',
    zone: 'Outstation',
    lat: 30.3165,
    lng: 78.0322,
  },
  { name: 'Mumbai', sub: 'Maharashtra · intercity', zone: 'Outstation', lat: 19.076, lng: 72.8777 },
  { name: 'Pune', sub: 'Maharashtra · intercity', zone: 'Outstation', lat: 18.5204, lng: 73.8567 },
  {
    name: 'Bengaluru',
    sub: 'Karnataka · intercity',
    zone: 'Outstation',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    name: 'Hyderabad',
    sub: 'Telangana · intercity',
    zone: 'Outstation',
    lat: 17.385,
    lng: 78.4867,
  },
  {
    name: 'Kolkata',
    sub: 'West Bengal · intercity',
    zone: 'Outstation',
    lat: 22.5726,
    lng: 88.3639,
  },
  { name: 'Ahmedabad', sub: 'Gujarat · intercity', zone: 'Outstation', lat: 23.0225, lng: 72.5714 },
  {
    name: 'Indore',
    sub: 'Madhya Pradesh · intercity',
    zone: 'Outstation',
    lat: 22.7196,
    lng: 75.8577,
  },
];

export function searchPlaces(q: string): Place[] {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  return PLACES.filter((p) => (p.name + ' ' + p.sub).toLowerCase().includes(query)).slice(0, 7);
}

export function routeDistanceKm(a: Place, b: Place): number {
  const R = 6371;
  const d = (x: number): number => (x * Math.PI) / 180;
  const dLat = d(b.lat - a.lat);
  const dLng = d(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(d(a.lat)) * Math.cos(d(b.lat)) * Math.sin(dLng / 2) ** 2;
  const straight = 2 * R * Math.asin(Math.sqrt(h));
  return Math.max(4, straight * (straight > 120 ? 1.18 : 1.38));
}

type BySize = Record<SizeKey, number>;

export const RATE = {
  crew: { rk: 4200, 1: 6100, 2: 8600, 3: 12200, 4: 17400 } as BySize,
  material: { rk: 2300, 1: 3700, 2: 5300, 3: 7600, 4: 11100 } as BySize,
  vehicle: { rk: 1800, 1: 2400, 2: 3200, 3: 4000, 4: 6800 } as BySize,
  perKmLocal: { rk: 26, 1: 30, 2: 36, 3: 42, 4: 64 } as BySize,
  perKmLong: { rk: 19, 1: 23, 2: 28, 3: 34, 4: 52 } as BySize,
  perFloor: { rk: 300, 1: 450, 2: 650, 3: 850, 4: 1200 } as BySize,
  liftFloor: { rk: 90, 1: 130, 2: 190, 3: 250, 4: 350 } as BySize,
  storage: { rk: 1200, 1: 1800, 2: 2600, 3: 3400, 4: 4800 } as BySize,
  clean: { rk: 2400, 1: 3200, 2: 4300, 3: 5400, 4: 7200 } as BySize,
  car: 8500,
  packMult: { basic: 0.86, standard: 1, premium: 1.19 } as Record<PackKey, number>,
  weekend: 0.06,
  monthEnd: 0.09,
  surgeCap: 0.12,
  gst: 0.18,
  spread: 0.06,
};

export const SIZE_LABELS: Record<SizeKey, string> = {
  rk: '1 RK',
  1: '1 BHK',
  2: '2 BHK',
  3: '3 BHK',
  4: '4 BHK / villa',
};
export const CREW_COUNT: Record<SizeKey, number> = { rk: 2, 1: 3, 2: 4, 3: 5, 4: 7 };

export const SIZE_OPTIONS: { value: SizeKey; label: string }[] = [
  { value: 'rk', label: '1 RK / studio' },
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK / villa' },
];

export interface EstimateInput {
  size: SizeKey;
  km: number;
  fFloor: number;
  fLift: boolean;
  tFloor: number;
  tLift: boolean;
  pack: PackKey;
  date: string;
  store: boolean;
  car: boolean;
  clean: boolean;
}

export interface EstimateResult {
  lines: [string, number][];
  total: number;
  lo: number;
  hi: number;
  long: boolean;
}

export function estimate(o: EstimateInput): EstimateResult {
  const s = o.size;
  const R = RATE;
  const L: [string, number][] = [];
  const crew = R.crew[s];
  const material = Math.round(R.material[s] * R.packMult[o.pack]);
  const long = o.km > 150;
  const perKm = long ? R.perKmLong[s] : R.perKmLocal[s];
  const transport = Math.round(R.vehicle[s] + perKm * o.km);
  const floorRate = (f: number, lift: boolean): number =>
    f * (lift ? R.liftFloor[s] : R.perFloor[s]);
  const floors = Math.round(floorRate(o.fFloor, o.fLift) + floorRate(o.tFloor, o.tLift));

  L.push([`Crew & handling · ${CREW_COUNT[s]} members`, crew]);
  L.push([`Packing material · ${o.pack}`, material]);
  L.push([`Vehicle & transport · ${o.km} km`, transport]);
  if (floors) L.push([`Floor access · ${o.fFloor + o.tFloor} floors`, floors]);

  let addons = 0;
  if (o.store) {
    addons += R.storage[s];
    L.push(['Storage, 1 week', R.storage[s]]);
  }
  if (o.car) {
    const c = R.car + (long ? Math.round(18 * o.km) : 0);
    addons += c;
    L.push(['Car transport', c]);
  }
  if (o.clean) {
    addons += R.clean[s];
    L.push(['Deep cleaning at drop', R.clean[s]]);
  }

  const sub = crew + material + transport + floors + addons;
  const dt = new Date(o.date + 'T00:00:00');
  const day = dt.getDay();
  const dom = dt.getDate();
  let surge = 0;
  const why: string[] = [];
  if (day === 0 || day === 6) {
    surge += R.weekend;
    why.push('weekend');
  }
  if (dom >= 26 || dom <= 5) {
    surge += R.monthEnd;
    why.push('month-end peak');
  }
  surge = Math.min(surge, R.surgeCap);
  const surgeAmt = Math.round(sub * surge);
  if (surgeAmt) L.push([`Date premium · ${why.join(' + ')}`, surgeAmt]);

  const gst = Math.round((sub + surgeAmt) * R.gst);
  L.push(['GST @ 18%', gst]);
  const total = sub + surgeAmt + gst;
  return {
    lines: L,
    total,
    lo: Math.round((total * (1 - R.spread)) / 100) * 100,
    hi: Math.round((total * (1 + R.spread)) / 100) * 100,
    long,
  };
}

export const inr = (n: number): string => '₹' + n.toLocaleString('en-IN');

/** Resolve free-typed text to a Place (exact-ish match → first search hit → fallback). */
export function resolvePlace(text: string, fallback: Place): Place {
  const t = text.trim().toLowerCase();
  if (!t) return fallback;
  const exact = PLACES.find(
    (p) => (p.name + ', ' + p.sub).toLowerCase() === t || p.name.toLowerCase() === t,
  );
  return exact ?? searchPlaces(text)[0] ?? fallback;
}
