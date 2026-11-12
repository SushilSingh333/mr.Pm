/**
 * The order the new locality pages go live in: five at a time, two batches a day, so
 * Google meets the new areas a few at a time instead of 76 pages on one morning.
 *
 * How it works: the manifest builds a page for a locality with a brief only once its
 * batch time has passed. The site is rebuilt at each batch time (the release timer on the
 * droplet, deploy/mrpackermover-release.timer), and every link to a page that is not live
 * yet shows as plain words until it is (apps/web/src/lib/rich-text.ts).
 *
 * The clock starts at `LOCALITY_RELEASE_START` (a date, `YYYY-MM-DD`, in the CMS `.env`
 * on the droplet): batch 1 goes live at 09:00 IST that day, batch 2 at 18:00, batch 3 at
 * 09:00 the next day, and so on. Not set ⇒ only the pages already live stay live, and
 * nothing new is released. `all` ⇒ every page at once (local testing).
 *
 * To change the order, move a place within its city's queue below: the batches take one
 * place from each city in turn, so every batch spreads across the cities. A new brief
 * must be added to a queue (or to LIVE_BEFORE_RELEASE), or the release-plan gate fails.
 */

/** Already live on the site before the release began (sitemap, 12 Oct 2026). */
export const LIVE_BEFORE_RELEASE: readonly string[] = [
  'delhi/dwarka',
  'delhi/janakpuri',
  'delhi/lajpat-nagar',
  'delhi/rohini',
  'faridabad/greater-faridabad',
  'faridabad/sector-15',
  'ghaziabad/indirapuram',
  'ghaziabad/raj-nagar-extension',
  'greater-noida/greater-noida-west',
  'greater-noida/pari-chowk',
  'gurgaon/dlf-phase-1',
  'gurgaon/sohna-road',
  'meerut/pallavpuram',
  'meerut/shastri-nagar',
  'noida/sector-52',
  'noida/sector-62',
];

/** Each city's places in release order: busiest areas first, thinly sourced ones last. */
const QUEUES: Record<string, readonly string[]> = {
  delhi: [
    'mayur-vihar',
    'saket',
    'vasant-kunj',
    'pitampura',
    'laxmi-nagar',
    'malviya-nagar',
    'greater-kailash',
    'karol-bagh',
    'patparganj',
    'hauz-khas',
    'kalkaji',
    'preet-vihar',
    'punjabi-bagh',
    'uttam-nagar',
    'model-town-delhi',
    'mukherjee-nagar',
    'rajinder-nagar',
    'shahdara',
    'civil-lines-delhi',
    'delhi-cantt',
  ],
  noida: ['sector-137', 'sector-150', 'sector-128', 'sector-18', 'sector-63', 'sector-50'],
  gurgaon: [
    'golf-course-road',
    'dwarka-expressway',
    'golf-course-extension-road',
    'palam-vihar',
    'mg-road',
    'cyber-city',
    'udyog-vihar',
    'manesar',
  ],
  ghaziabad: [
    'vaishali',
    'vasundhara',
    'crossings-republik',
    'kaushambi',
    'raj-nagar',
    'kavi-nagar',
    'vijay-nagar',
    'shalimar-garden',
    'rajendra-nagar',
    'sahibabad',
    'pratap-vihar',
    'mohan-nagar',
    'shastri-nagar-ghaziabad',
    'siddharth-vihar',
    'nehru-nagar',
    'govindpuram',
  ],
  'greater-noida': [
    'gaur-city',
    'knowledge-park',
    'yamuna-expressway',
    'alpha',
    'gamma',
    'jaypee-greens',
    'beta',
    'delta',
    'omicron',
    'swarn-nagari',
  ],
  faridabad: ['nit', 'old-faridabad', 'ballabgarh', 'surajkund', 'badkhal', 'sainik-colony'],
  meerut: [
    'civil-lines-meerut',
    'meerut-cantt',
    'garh-road',
    'modipuram',
    'ganga-nagar',
    'partapur',
    'jagriti-vihar',
    'lalkurti',
    'saket-meerut',
    'kanker-khera',
  ],
};

export const RELEASE_BATCH_SIZE = 5;
/** Batch times, IST (hour, minute). */
export const RELEASE_TIMES_IST: readonly (readonly [number, number])[] = [
  [9, 0],
  [18, 0],
];

/** Every place still to release, in order: one from each city in turn. */
export const RELEASE_ORDER: readonly string[] = (() => {
  const queues = Object.entries(QUEUES).map(([city, places]) => places.map((p) => `${city}/${p}`));
  const out: string[] = [];
  for (let i = 0; queues.some((q) => i < q.length); i += 1)
    for (const q of queues) if (i < q.length) out.push(q[i]!);
  return out;
})();

export interface ReleaseBatch {
  /** 1-based. */
  batch: number;
  /** When it goes live; null when no start date is set. */
  at: Date | null;
  places: string[];
}

/** 09:00 IST on a `YYYY-MM-DD` date, as a Date; null when the date is missing or bad. */
function startOf(start: string | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((start ?? '').trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** `order` cut into batches, each with its go-live time worked out from the start date. */
function batchesOf(
  order: readonly string[],
  start: string | undefined,
  size: number = RELEASE_BATCH_SIZE,
  times: readonly (readonly [number, number])[] = RELEASE_TIMES_IST,
): ReleaseBatch[] {
  const day0 = startOf(start);
  const perDay = times.length;
  const batches: ReleaseBatch[] = [];
  for (let i = 0; i < order.length; i += size) {
    const b = i / size;
    const [h, min] = times[b % perDay]!;
    const at = day0
      ? new Date(
          day0.getTime() +
            Math.floor(b / perDay) * 86_400_000 +
            // IST is UTC+5:30.
            ((h - 5) * 60 + (min - 30)) * 60_000,
        )
      : null;
    batches.push({ batch: b + 1, at, places: order.slice(i, i + size) });
  }
  return batches;
}

/** The batches, each with its go-live time worked out from the start date. */
export function releaseBatches(start: string | undefined): ReleaseBatch[] {
  return batchesOf(RELEASE_ORDER, start);
}

/**
 * The second wave: sub-areas, pages for the parts of a locality that people search by
 * name - the Khands of Indirapuram (7 Nov 2026, the owner). Each lives under its locality
 * (/packers-and-movers/ghaziabad/indirapuram/vaibhav-khand) and is keyed the same way.
 *
 * One page a day at 14:00 IST (11 Nov 2026, the owner: "publish 1 page daily at 2pm"),
 * on a clock of its own: `SUBAREA_RELEASE_START` (a `YYYY-MM-DD` in the CMS `.env`). The localities' clock started
 * weeks earlier, so adding these to RELEASE_ORDER would have released them all at once.
 * Not set ⇒ none of them is released; `all` ⇒ all at once (local testing).
 *
 * Release order: the Khands people search most first.
 */
export const SUBAREA_RELEASE_ORDER: readonly string[] = [
  'ghaziabad/indirapuram/vaibhav-khand',
  'ghaziabad/indirapuram/ahinsa-khand',
  'ghaziabad/indirapuram/gyan-khand',
  'ghaziabad/indirapuram/shakti-khand',
  'ghaziabad/indirapuram/niti-khand',
  'ghaziabad/indirapuram/abhay-khand',
  'ghaziabad/indirapuram/nyay-khand',
  // Then the sectors of Vaishali (11 Nov 2026, the owner). Slugs carry "vaishali-": a bare
  // "sector-3" is already another city's area, and place slugs are unique site-wide.
  'ghaziabad/vaishali/vaishali-sector-4',
  'ghaziabad/vaishali/vaishali-sector-3',
  'ghaziabad/vaishali/vaishali-sector-1',
  'ghaziabad/vaishali/vaishali-sector-5',
  'ghaziabad/vaishali/vaishali-sector-2',
  'ghaziabad/vaishali/vaishali-sector-6',
  // Then the sectors of Vasundhara (11 Nov 2026, the owner): the ten with enough real
  // societies and landmarks for a page; sub-sectors (2A-2C, 4A/4C, 14A/14C, 16A/16B) are
  // folded into their sector. 1, 7-9, 11-13 and 15-19 are too thin for a page of their own
  // (15 had three societies a source could place there, 16 and 18 one or two).
  'ghaziabad/vasundhara/vasundhara-sector-6',
  'ghaziabad/vasundhara/vasundhara-sector-4',
  'ghaziabad/vasundhara/vasundhara-sector-2',
  'ghaziabad/vasundhara/vasundhara-sector-5',
  'ghaziabad/vasundhara/vasundhara-sector-14',
  'ghaziabad/vasundhara/vasundhara-sector-10',
  'ghaziabad/vasundhara/vasundhara-sector-3',
];

/** The env variable that starts the sub-area clock. */
export const SUBAREA_RELEASE_ENV = 'SUBAREA_RELEASE_START';

/** Sub-areas go live one at a time, once a day, at 14:00 IST. */
export const SUBAREA_BATCH_SIZE = 1;
export const SUBAREA_RELEASE_TIMES_IST: readonly (readonly [number, number])[] = [[14, 0]];

/** The sub-area batches, each with its go-live time worked out from its start date. */
export function subAreaBatches(start: string | undefined): ReleaseBatch[] {
  return batchesOf(SUBAREA_RELEASE_ORDER, start, SUBAREA_BATCH_SIZE, SUBAREA_RELEASE_TIMES_IST);
}

/** A key with three parts (city/locality/sub-area) is a sub-area. */
export const isSubAreaKey = (key: string): boolean => key.split('/').length === 3;

/**
 * When a locality went (or goes) live in the release, for the sitemap's `lastmod`: the
 * page is new to search engines at that moment, whatever date its CMS record carries.
 * Null for a page live before the release, or when there is no dated schedule.
 */
export function localityReleaseTime(key: string, start: string | undefined): Date | null {
  return releaseBatches(start).find((b) => b.places.includes(key))?.at ?? null;
}

/** As localityReleaseTime, for a sub-area: `start` is SUBAREA_RELEASE_START. */
export function subAreaReleaseTime(key: string, start: string | undefined): Date | null {
  return subAreaBatches(start).find((b) => b.places.includes(key))?.at ?? null;
}

/** As isLocalityReleased, for a sub-area: `start` is SUBAREA_RELEASE_START. */
export function isSubAreaReleased(
  key: string,
  start: string | undefined,
  now: Date = new Date(),
): boolean {
  if ((start ?? '').trim() === 'all') return SUBAREA_RELEASE_ORDER.includes(key);
  const batch = subAreaBatches(start).find((b) => b.places.includes(key));
  return Boolean(batch?.at && batch.at.getTime() <= now.getTime());
}

/**
 * Whether a locality with a brief may have its page now. `start` is
 * LOCALITY_RELEASE_START; a place in no list is held back (the release-plan gate flags it).
 */
export function isLocalityReleased(
  key: string,
  start: string | undefined,
  now: Date = new Date(),
): boolean {
  if (LIVE_BEFORE_RELEASE.includes(key)) return true;
  if ((start ?? '').trim() === 'all') return RELEASE_ORDER.includes(key);
  const batch = releaseBatches(start).find((b) => b.places.includes(key));
  return Boolean(batch?.at && batch.at.getTime() <= now.getTime());
}
