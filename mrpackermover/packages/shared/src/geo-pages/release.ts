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

/** The batches, each with its go-live time worked out from the start date. */
export function releaseBatches(start: string | undefined): ReleaseBatch[] {
  const day0 = startOf(start);
  const perDay = RELEASE_TIMES_IST.length;
  const batches: ReleaseBatch[] = [];
  for (let i = 0; i < RELEASE_ORDER.length; i += RELEASE_BATCH_SIZE) {
    const b = i / RELEASE_BATCH_SIZE;
    const [h, min] = RELEASE_TIMES_IST[b % perDay]!;
    const at = day0
      ? new Date(
          day0.getTime() +
            Math.floor(b / perDay) * 86_400_000 +
            // IST is UTC+5:30.
            ((h - 5) * 60 + (min - 30)) * 60_000,
        )
      : null;
    batches.push({ batch: b + 1, at, places: RELEASE_ORDER.slice(i, i + RELEASE_BATCH_SIZE) });
  }
  return batches;
}

/**
 * When a locality went (or goes) live in the release, for the sitemap's `lastmod`: the
 * page is new to search engines at that moment, whatever date its CMS record carries.
 * Null for a page live before the release, or when there is no dated schedule.
 */
export function localityReleaseTime(key: string, start: string | undefined): Date | null {
  return releaseBatches(start).find((b) => b.places.includes(key))?.at ?? null;
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
