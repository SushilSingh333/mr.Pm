/**
 * Generate a rich sample manifest for design/CI (no database needed).
 *
 * Mirrors the shape the CMS `buildManifest` produces, but from a compact data
 * definition here — so the homepage "Cities we serve" grid, the city-page "Areas
 * we cover" grid, the services grid, and the routes all populate realistically.
 * Run: `node scripts/gen-sample-manifest.mjs`. Output: apps/web/src/data/manifest.sample.json
 *
 * Everything it emits is real-shaped and distinct per city (the duplication gate
 * runs against this file), and every page ends with >= 3 inbound links.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../apps/web/src/data/manifest.sample.json',
);
const ORIGIN = 'http://localhost:4321';
const LASTMOD = '2026-07-29T10:00:00.000Z';

// ── Data ─────────────────────────────────────────────────────────────────────
const SERVICES = [
  { slug: 'home-shifting', name: 'Home Shifting', icon: 'home' },
  { slug: 'office-shifting', name: 'Office Shifting', icon: 'office' },
  { slug: 'car-transport', name: 'Car Transport', icon: 'car' },
  { slug: 'bike-transport', name: 'Bike Transport', icon: 'bike' },
  { slug: 'loading-unloading', name: 'Loading & Unloading', icon: 'box' },
  { slug: 'packing-unpacking', name: 'Packing & Unpacking', icon: 'pack' },
  { slug: 'international-relocation', name: 'International Relocation', icon: 'globe' },
];
const SERVICE_SUMMARY = {
  'home-shifting': 'End-to-end home shifting by our own trained crews, with a fixed written quote.',
  'office-shifting':
    'Office and IT-asset relocation planned around your no-entry and lift windows.',
  'car-transport': 'Enclosed and open car carriers with transit insurance and live status.',
  'bike-transport':
    'Two-wheeler transport, foam-wrapped and crated, on the same fixed-quote basis.',
  'loading-unloading': 'Labour-only loading and unloading when you have your own vehicle.',
  'packing-unpacking': 'Professional packing materials and unpacking at destination.',
  'international-relocation':
    'Door-to-door international moves with customs documentation handled.',
};

const BANDS = [
  { band: '1 BHK', base: 8000, perKm: 45, packing: 2500, insurancePct: 3 },
  { band: '2 BHK', base: 12000, perKm: 55, packing: 4000, insurancePct: 3 },
  { band: '3 BHK', base: 18000, perKm: 70, packing: 6000, insurancePct: 3 },
];

const CITIES = [
  {
    slug: 'delhi',
    name: 'Delhi',
    jobs: 56,
    onTime: 96,
    settle: 11,
    editorial: [
      'Delhi is four distinct moving markets, not one. South Delhi is low-rise plotted housing where the constraint is narrow lanes and no service lift; most jobs are 2BHK and 3BHK.',
      'West and North-West Delhi is a sector grid of mid-rise societies with their own RWA gate-pass rules and fixed no-entry hours, so an early load-out matters.',
    ],
    localities: ['Rohini', 'Dwarka', 'Saket', 'Pitampura', 'Vasant Kunj', 'Mayur Vihar'],
  },
  {
    slug: 'gurgaon',
    name: 'Gurgaon',
    jobs: 41,
    onTime: 95,
    settle: 12,
    editorial: [
      'Gurgaon splits into the DLF phases and Golf Course Road high-rises, newer Sohna Road group housing, and the older sectors. The high-rise belt is the highest-ticket work in NCR.',
      'The binding constraint is the service lift: most Golf Course towers require a booking slot and a deposit, and restrict move hours. We price the lift wait up front.',
    ],
    localities: ['DLF Phase 1', 'Sohna Road', 'Sector 56', 'Golf Course Extension', 'Sushant Lok'],
  },
  {
    slug: 'noida',
    name: 'Noida',
    jobs: 33,
    onTime: 96,
    settle: 10,
    editorial: [
      "Noida's sector grid maps almost exactly to how people search. The high-rise clusters in the 70s and 100s sectors are the bulk of organised demand.",
      'Most societies here require a gate pass and a service-lift slot booked a day ahead; our coordinator holds both before the crew is dispatched.',
    ],
    localities: ['Sector 62', 'Sector 137', 'Noida Extension', 'Sector 78'],
  },
  {
    slug: 'mumbai',
    name: 'Mumbai',
    jobs: 62,
    onTime: 93,
    settle: 12,
    editorial: [
      'Mumbai has the highest volume and the worst access conditions in the country. We price the stairs and the lift wait explicitly, because both are the real cost drivers here.',
      'From the island city to the western and central suburbs, building age and lift availability vary enormously; the coordinator confirms both for your exact tower.',
    ],
    localities: ['Bandra', 'Andheri', 'Powai', 'Chembur', 'Thane', 'Malad'],
  },
  {
    slug: 'bengaluru',
    name: 'Bengaluru',
    jobs: 48,
    onTime: 95,
    settle: 11,
    editorial: [
      'Bengaluru is the largest addressable market after NCR, driven by the IT corridors. Whitefield, Sarjapur and the ORR belt see the most organised relocation.',
      "Apartment complexes here are strict on move timings and gate passes; we plan the load-out around each society's rules.",
    ],
    localities: ['Whitefield', 'Sarjapur Road', 'Electronic City', 'HSR Layout', 'Koramangala'],
  },
  {
    slug: 'pune',
    name: 'Pune',
    jobs: 37,
    onTime: 96,
    settle: 10,
    editorial: [
      'Hinjewadi and PCMC are separate markets from old Pune and are priced separately. The IT belt drives most intercity and local demand.',
      'Newer townships have well-run service lifts; older Pune is often stair-carry. We confirm which applies before quoting.',
    ],
    localities: ['Hinjewadi', 'Wakad', 'Kharadi', 'Baner', 'Viman Nagar'],
  },
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    jobs: 39,
    onTime: 95,
    settle: 11,
    editorial: [
      'West Hyderabad — Gachibowli, Kondapur, HITEC City — is roughly 60 percent of demand. Gated communities dominate and each has its own move protocol.',
      'We hold the gate pass and lift slot for your community before dispatch, so nothing stalls on the day.',
    ],
    localities: ['Gachibowli', 'Kondapur', 'HITEC City', 'Madhapur', 'Kukatpally'],
  },
  {
    slug: 'chennai',
    name: 'Chennai',
    jobs: 34,
    onTime: 94,
    settle: 12,
    editorial: [
      'The OMR corridor dominates organised relocation in Chennai; the rest of the city is comparatively thin. IT-belt apartments set the pace.',
      'Coastal humidity means we pay extra attention to moisture-safe packing for electronics and wood; that is built into the quote.',
    ],
    localities: ['OMR', 'Velachery', 'Adyar', 'Porur', 'Anna Nagar'],
  },
];

const ROUTES = [
  { o: 'delhi', d: 'mumbai', km: 1400, days: 3 },
  { o: 'delhi', d: 'bengaluru', km: 2150, days: 4 },
  { o: 'mumbai', d: 'pune', km: 150, days: 1 },
  { o: 'bengaluru', d: 'hyderabad', km: 570, days: 2 },
];

const GLOBAL_FAQS = [
  {
    question: 'Will the price change on delivery day?',
    answer:
      'No. The written quote is fixed; the only things that can change it are stated up front on the quote.',
  },
  {
    question: 'Are my goods insured in transit?',
    answer:
      'Yes, transit insurance is available and the premium is shown as a line item on your quote — never hidden.',
  },
  {
    question: 'How do you verify the crew and vehicle?',
    answer:
      'Every crew and vehicle is ID-verified; you can check who is coming and in what vehicle before they load.',
  },
  {
    question: 'What happens if something is damaged?',
    answer:
      'Damage is rare, but when it happens we settle. We publish our median settlement time on the claims page.',
  },
];

// Editable home copy — mirrors the `home-content` global so the DB-less build renders
// exactly what the CMS produces (the pillars drive the "why us" bento via `variant`).
const HOME_CONTENT = {
  taglineLine1: 'Shifting Aapki,',
  taglineLine2: 'Zimmedari Hamari.',
  servicesHeading: 'What we move',
  servicesIntro: 'One operation, verified crews, and a written fixed quote for every service.',
  trustHeading: 'House Shifting you can actually verify',
  trustIntro: 'Everything below is backed by real job data — no vanity counters, no stock photos.',
  statsHeading: 'By the numbers',
  statsIntro: "Unflattering when it needs to be — that's the point.",
  citiesHeading: 'Cities we pick up from',
  citiesIntro:
    'Own crews in each. Pick your pickup city for the areas we cover, local rate bands and real reviews — delivery goes anywhere in India.',
  faqHeading: 'Questions people ask',
  pillars: [
    {
      icon: 'fixed-quote',
      variant: 'lead',
      title: 'Fixed quote, no surprises',
      body: 'The written quote is the price you pay. Anything that could change it — floor rise, long carry, extra packing — is itemised up front, never sprung on you on delivery day.',
    },
    {
      icon: 'claims',
      variant: 'dark',
      title: 'Claims settled — and published',
      body: 'Damage is rare, but when it happens we settle. And we publish our median settlement time on the claims page — an unflattering-but-honest number nobody else in this category shows.',
      link: { href: '/claims', label: 'See our claims data' },
    },
    {
      icon: 'verified-crew',
      variant: 'default',
      title: 'Verified crews & vehicles',
      body: "Every crew and vehicle is ID-verified. Check who's coming, and in what vehicle, before they load.",
    },
    {
      icon: 'insurance',
      variant: 'default',
      title: 'Transit insurance',
      body: 'Optional transit cover, shown as a clear line item on your quote — never buried in the fine print.',
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const SHARD = {
  home: 'sitemaps/core.xml',
  'service-hub': 'sitemaps/core.xml',
  'city-hub': 'sitemaps/cities.xml',
  'city-service': 'sitemaps/city-services.xml',
  locality: 'sitemaps/localities.xml',
  route: 'sitemaps/routes.xml',
};
const lslug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const abs = (p) => (p === '/' ? `${ORIGIN}/` : `${ORIGIN}${p}`);
const priceFrom = Math.min(...BANDS.map((b) => b.base));
const reviewsFor = (city) => [
  {
    jobRef: `${city.slug.slice(0, 3).toUpperCase()}-2026-1001`,
    author: 'Rahul S.',
    rating: 5,
    text: `On time in ${city.name}, nothing broken, and the final bill matched the quote to the rupee.`,
    date: '2026-07-20',
  },
  {
    jobRef: `${city.slug.slice(0, 3).toUpperCase()}-2026-1002`,
    author: 'Meena K.',
    rating: 5,
    text: `The ${city.name} crew wrapped every fragile item and reassembled the beds. Would use again.`,
    date: '2026-07-12',
  },
  {
    jobRef: `${city.slug.slice(0, 3).toUpperCase()}-2026-1005`,
    author: 'Vikram T.',
    rating: 4,
    text: `40 minutes late in ${city.name} but they called ahead and adjusted the bill. Fixed it.`,
    date: '2026-07-04',
    response: 'Thanks for the fair rating and for letting us make it right.',
  },
];
const cityFaqs = (city) => [
  {
    question: `What is included in a ${city.name} home shift?`,
    answer: `Packing, loading, transport, unloading, and basic reassembly. Society gate passes in ${city.name} are arranged by your coordinator.`,
  },
  {
    question: `Do you handle service-lift booking in ${city.name}?`,
    answer: `Yes. Your ${city.name} coordinator confirms the lift slot and gate timings before the crew is dispatched.`,
  },
  {
    question: `How early should the crew reach in ${city.name}?`,
    answer: `Early, because several ${city.name} societies restrict vehicle entry until mid-morning. We plan the load-out around it.`,
  },
];

const pages = [];
const row = (r) => {
  pages.push({
    pageType: r.pageType,
    path: r.path,
    canonical: abs(r.path),
    slug: r.slug,
    sitemapShard: SHARD[r.pageType],
    cacheTag: r.cacheTag,
    lastmod: LASTMOD,
    title: r.title,
    metaDescription: r.metaDescription,
    h1: r.h1,
    noindex: false,
    breadcrumbs: r.breadcrumbs ?? [],
    relatedLinks: r.relatedLinks ?? [],
    inboundLinks: [],
    data: r.data ?? {},
  });
};

const cyclic = (arr, i, n) =>
  Array.from({ length: n }, (_, k) => arr[(i + k + 1) % arr.length]).filter((x) => x !== arr[i]);
const CITY_SERVICE_SLUGS = SERVICES.slice(0, 2).map((s) => s.slug); // which services get city×service pages

// Service hubs (cyclic sibling cross-links so each has >= 3 inbound)
for (const [i, s] of SERVICES.entries()) {
  const siblings = cyclic(SERVICES, i, 3);
  const hasCityService = CITY_SERVICE_SLUGS.includes(s.slug);
  const cityLinks = hasCityService
    ? CITIES.map((c) => ({
        path: `/packers-and-movers/${c.slug}/${s.slug}`,
        anchor: `${s.name} in ${c.name}`,
        group: 'cities',
      }))
    : CITIES.slice(0, 6).map((c) => ({
        path: `/packers-and-movers/${c.slug}`,
        anchor: `Serving ${c.name}`,
        group: 'cities',
      }));
  row({
    pageType: 'service-hub',
    path: `/services/${s.slug}`,
    slug: s.slug,
    cacheTag: 'service-hub',
    title: `${s.name} Services in India – MrPackerMover`.slice(0, 60),
    h1: `${s.name} Services`,
    breadcrumbs: [{ path: '/', anchor: 'Home' }],
    relatedLinks: [
      ...cityLinks,
      ...siblings.map((x) => ({ path: `/services/${x.slug}`, anchor: x.name, group: 'services' })),
    ],
    data: {
      serviceName: s.name,
      summary: SERVICE_SUMMARY[s.slug],
      inclusions: ['Packing & materials', 'Loading & unloading', 'Transport', 'Basic reassembly'],
      exclusions: [
        'Floor rise above 2 floors without a lift',
        'Long carry beyond 50 m',
        'Extra packing for oversized items',
      ],
    },
  });
}

// City hubs + localities + a couple city×service each
for (const [ci, city] of CITIES.entries()) {
  const cityPath = `/packers-and-movers/${city.slug}`;
  const localitySlugs = city.localities.map((n) => ({ name: n, slug: lslug(n) }));
  const cityRoutes = ROUTES.filter((r) => r.o === city.slug || r.d === city.slug).map((r) => {
    const oc = CITIES.find((c) => c.slug === r.o),
      dc = CITIES.find((c) => c.slug === r.d);
    return {
      path: `/routes/${r.o}-to-${r.d}`,
      anchor: `${oc.name} to ${dc.name}`,
      group: 'routes',
    };
  });
  row({
    pageType: 'city-hub',
    path: cityPath,
    slug: city.slug,
    cacheTag: `city-${city.slug}`,
    title: `Packers and Movers in ${city.name} – MrPackerMover`.slice(0, 60),
    h1: `Packers and Movers in ${city.name}`,
    breadcrumbs: [{ path: '/', anchor: 'Home' }],
    relatedLinks: [
      ...SERVICES.slice(0, 6).map((s) => ({
        path: CITY_SERVICE_SLUGS.includes(s.slug) ? `${cityPath}/${s.slug}` : `/services/${s.slug}`,
        anchor: `${s.name} in ${city.name}`,
        group: 'services',
      })),
      ...localitySlugs.map((l) => ({
        path: `${cityPath}/${l.slug}`,
        anchor: l.name,
        group: 'localities',
      })),
      ...cityRoutes,
    ],
    data: {
      cityName: city.name,
      editorial: city.editorial,
      rateBands: BANDS,
      stats: {
        jobs12m: city.jobs,
        onTimePct: city.onTime,
        avgSettlementDays: city.settle,
        damagePct: 1,
      },
      reviews: reviewsFor(city),
      faqs: cityFaqs(city),
      priceFrom,
      areas: localitySlugs.map((l) => ({ path: `${cityPath}/${l.slug}`, name: l.name })),
    },
  });

  for (const [li, l] of localitySlugs.entries()) {
    row({
      pageType: 'locality',
      path: `${cityPath}/${l.slug}`,
      slug: `${city.slug}/${l.slug}`,
      cacheTag: `city-${city.slug}`,
      title: `Packers and Movers in ${l.name}, ${city.name} – MrPackerMover`.slice(0, 60),
      h1: `Packers and Movers in ${l.name}, ${city.name}`,
      breadcrumbs: [
        { path: '/', anchor: 'Home' },
        { path: cityPath, anchor: city.name },
      ],
      relatedLinks: cyclic(localitySlugs, li, 3).map((x) => ({
        path: `${cityPath}/${x.slug}`,
        anchor: `Movers in ${x.name}`,
        group: 'siblings',
      })),
      data: {
        localityName: l.name,
        cityName: city.name,
        cityPath,
        editorial: [
          `${l.name} in ${city.name}: our crews are briefed on the society gate-pass rules, lift or stair access, and no-entry windows specific to this pocket before they quote.`,
          `Most jobs here are 2BHK. We confirm the exact access for your block so the fixed quote holds on the day.`,
        ],
        rateBands: BANDS,
        stats: {
          jobs12m: Math.round(city.jobs / 3),
          onTimePct: city.onTime,
          avgSettlementDays: city.settle,
        },
        reviews: reviewsFor(city).slice(0, 2),
        faqs: cityFaqs(city).slice(0, 3),
        priceFrom,
      },
    });
  }

  for (const s of SERVICES.slice(0, 2)) {
    row({
      pageType: 'city-service',
      path: `${cityPath}/${s.slug}`,
      slug: `${city.slug}/${s.slug}`,
      cacheTag: `city-${city.slug}`,
      title: `${s.name} in ${city.name} – Fixed Quotes, MrPackerMover`.slice(0, 60),
      metaDescription: `${s.name} in ${city.name} from ₹${priceFrom.toLocaleString('en-IN')}. ${city.jobs} moves completed in ${city.name}, ${city.onTime}% on time. Fixed quote, no surprises.`,
      h1: `${s.name} in ${city.name}`,
      breadcrumbs: [
        { path: '/', anchor: 'Home' },
        { path: cityPath, anchor: city.name },
      ],
      relatedLinks: [
        { path: `/services/${s.slug}`, anchor: `${s.name} across India`, group: 'nearby' },
        ...cyclic(CITIES, ci, 4).map((c) => ({
          path: `/packers-and-movers/${c.slug}/${s.slug}`,
          anchor: `${s.name} in ${c.name}`,
          group: 'nearby',
        })),
      ],
      data: {
        cityName: city.name,
        serviceName: s.name,
        editorial: city.editorial.slice(0, 1),
        rateBands: BANDS,
        stats: {
          jobs12m: Math.round(city.jobs * 0.7),
          onTimePct: city.onTime,
          avgSettlementDays: city.settle,
        },
        reviews: reviewsFor(city).slice(0, 2),
        faqs: cityFaqs(city).slice(0, 3),
        inclusions: ['Packing & materials', 'Loading & unloading', 'Transport', 'Basic reassembly'],
        exclusions: ['Floor rise above 2 floors without a lift', 'Long carry beyond 50 m'],
        priceFrom,
      },
    });
  }
}

// Routes
for (const r of ROUTES) {
  const oc = CITIES.find((c) => c.slug === r.o),
    dc = CITIES.find((c) => c.slug === r.d);
  row({
    pageType: 'route',
    path: `/routes/${r.o}-to-${r.d}`,
    slug: `${r.o}-to-${r.d}`,
    cacheTag: 'route',
    title: `${oc.name} to ${dc.name} Packers and Movers – MrPackerMover`.slice(0, 60),
    h1: `${oc.name} to ${dc.name} Packers and Movers`,
    breadcrumbs: [
      { path: '/', anchor: 'Home' },
      { path: `/packers-and-movers/${r.o}`, anchor: oc.name },
    ],
    relatedLinks: [
      { path: `/packers-and-movers/${r.o}`, anchor: `Movers in ${oc.name}`, group: 'endpoints' },
      { path: `/packers-and-movers/${r.d}`, anchor: `Movers in ${dc.name}`, group: 'endpoints' },
      // reverse route only if it exists in the sample
      ...(ROUTES.some((x) => x.o === r.d && x.d === r.o)
        ? [
            {
              path: `/routes/${r.d}-to-${r.o}`,
              anchor: `${dc.name} to ${oc.name}`,
              group: 'reverse',
            },
          ]
        : []),
    ],
    data: {
      originName: oc.name,
      destName: dc.name,
      roadKm: r.km,
      transitDays: r.days,
      frequency: '3× a week',
      overnight: [
        `Load by 8 PM at the ${oc.name} end, roll out after the no-entry window lifts, and cover the trunk route overnight. You take no leave — the truck is already moving while you sleep.`,
      ],
      borderNotes:
        'Inter-state permits handled end to end. Monsoon can add a day on the ghat sections.',
      rateBands: BANDS,
      priceFrom,
    },
  });
}

// Home
row({
  pageType: 'home',
  path: '/',
  slug: 'home',
  cacheTag: 'home',
  title: `Packers and Movers in India – Fixed Quotes | MrPackerMover`.slice(0, 60),
  h1: 'Packers and Movers you can actually verify',
  relatedLinks: [
    ...SERVICES.map((s) => ({ path: `/services/${s.slug}`, anchor: s.name, group: 'services' })),
    ...CITIES.map((c) => ({
      path: `/packers-and-movers/${c.slug}`,
      anchor: c.name,
      group: 'cities',
    })),
    ...ROUTES.map((r) => ({
      path: `/routes/${r.o}-to-${r.d}`,
      anchor: `${CITIES.find((c) => c.slug === r.o).name} to ${CITIES.find((c) => c.slug === r.d).name}`,
      group: 'routes',
    })),
  ],
  data: {
    totalJobs12m: CITIES.reduce((s, c) => s + c.jobs, 0),
    onTimePct: Math.round(CITIES.reduce((s, c) => s + c.onTime, 0) / CITIES.length),
    medianSettlementDays: 11,
    faqs: GLOBAL_FAQS,
    content: HOME_CONTENT,
  },
});

// Reciprocal inbound links (Doc 02 §7) — every relatedLink + breadcrumb registers
// an inbound edge on its target, so nothing is orphaned and each page has >= 3.
const byPath = new Map(pages.map((p) => [p.path, p]));
for (const p of pages) {
  for (const link of [...p.relatedLinks, ...p.breadcrumbs]) {
    const target = byPath.get(link.path);
    if (target && target.path !== p.path)
      target.inboundLinks.push({ path: p.path, anchor: link.anchor });
  }
}
for (const p of pages) if (p.inboundLinks.length > 12) p.inboundLinks = p.inboundLinks.slice(0, 12);

const JOBS = [
  {
    title: 'Packing & moving crew',
    slug: 'packing-moving-crew',
    team: 'Field',
    employmentType: 'full-time',
    location: 'NCR',
    summary:
      'Pack, load, transport and set up homes and offices to our standard. Training and equipment provided; attitude essential.',
  },
  {
    title: 'Move coordinator',
    slug: 'move-coordinator',
    team: 'Operations',
    employmentType: 'full-time',
    location: 'NCR',
    summary:
      "Own a customer's move end-to-end — survey, fixed quote, scheduling and day-of coordination. The single point of contact.",
  },
  {
    title: 'Claims & quality specialist',
    slug: 'claims-quality-specialist',
    team: 'Trust',
    employmentType: 'full-time',
    location: 'Delhi',
    summary:
      'Investigate and settle claims fairly and fast, and feed what you learn back into how crews pack.',
  },
  {
    title: 'Customer support',
    slug: 'customer-support',
    team: 'Support',
    employmentType: 'full-time',
    location: 'Remote',
    summary:
      'Answer real questions from people mid-move with clarity and calm — first response within our published SLA.',
  },
];

const manifest = {
  generatedAt: LASTMOD,
  siteOrigin: ORIGIN,
  org: {
    brandName: 'MrPackerMover',
    legalName: 'AAJneeti Connect Private Limited',
    gstin: '07AAAAA0000A1Z5',
    cin: 'U63030DL2020PTC000000',
    yearsOperating: 6,
    insurancePartner: 'ICICI Lombard',
    registeredOffice: 'Registered office address — confirm before launch.',
    complaintSla: 'First response within 24 hours.',
    phone: '+91-00000-00000',
    whatsapp: '+91-00000-00000',
    sameAs: ['https://www.linkedin.com/company/mrpackermover'],
  },
  jobs: JOBS,
  editorial: {},
  pages,
};

fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
const under3 = pages.filter((p) => p.inboundLinks.length < 3).map((p) => p.path);
console.info(`Wrote ${pages.length} pages → ${path.relative(process.cwd(), OUT)}`);
if (under3.length) console.warn(`WARNING: ${under3.length} pages have < 3 inbound links:`, under3);
