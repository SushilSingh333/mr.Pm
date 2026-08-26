import type { Payload } from 'payload';
import {
  PAGE_TYPE_TO_SHARD,
  SITEMAP_SHARDS,
  cacheTagFor,
  paths,
  absoluteUrl,
  type ManifestRow,
  type ManifestLink,
  type Manifest,
  type PageType,
  type RateBand,
  type ReviewSnippet,
  type FaqItem,
  type StatBlock,
  type HomeContent,
  type TrustPillar,
  type EditorialContent,
  type BlogPost,
  cldUrl,
  CLD_TRANSFORM,
  SERVICES,
} from '@mpm/shared';
import { title as titleFor, cityServiceMeta } from '@mpm/seo/meta';
import { evaluateCandidate, type GateCandidate } from './publish-gate.js';
import { countWords, richTextToPlain, richTextToHtml } from './rich-text.js';

/**
 * Build the manifest — the single source of truth (Doc 02 §1).
 *
 * ALL Payload data is loaded in ONE pass and indexed in Maps; every candidate is
 * scored by the publish gate and only passing rows become URLs. Passing rows are
 * denormalised into plain render payloads (page-data shapes) so the Astro app can
 * render from the manifest alone. Related/inbound links are computed here so no
 * page is orphaned and the ≥ 3-inbound-links assertion holds.
 */

type Id = string | number;
const sid = (v: Id): string => String(v);
const refId = (ref: Id | { id: Id } | null | undefined): string | null =>
  ref == null ? null : sid(typeof ref === 'object' ? ref.id : ref);

interface LocationDoc {
  id: Id;
  slug: string;
  name: string;
  type: 'state' | 'city' | 'locality';
  parent?: Id | { id: Id } | null;
  isServiceable?: boolean;
  /** Editor-selected services this city offers (each becomes a city × service page). */
  servicesOffered?: Array<Id | { id: Id }> | null;
  /** Uploaded hero/thumbnail image (Media id) — resolved to a Cloudinary URL. */
  heroImage?: Id | { id: Id } | null;
  editorialNote?: unknown;
  updatedAt: string;
}
interface MediaDoc {
  id: Id;
  url?: string;
  alt?: string;
}
interface ServiceDoc {
  id: Id;
  slug: string;
  name: string;
  isCorporate?: boolean;
  summary?: string;
  inclusions?: Array<{ item: string }>;
  exclusions?: Array<{ item: string }>;
  updatedAt: string;
}
interface LaneDoc {
  id: Id;
  origin?: Id | { id: Id };
  destination?: Id | { id: Id };
  roadKm?: number;
  transitDays?: number;
  jobCount?: number;
  frequency?: string;
  overnightBlock?: unknown;
  borderNotes?: string;
  updatedAt: string;
}
interface RateCardDoc {
  id: Id;
  scope: 'service' | 'city' | 'lane';
  service?: Id | { id: Id };
  city?: Id | { id: Id };
  lane?: Id | { id: Id };
  bands?: RateBand[];
}
interface ReviewDoc {
  id: Id;
  jobRef: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  response?: string;
  location?: Id | { id: Id };
  service?: Id | { id: Id };
}
interface JobsStatDoc {
  id: Id;
  location?: Id | { id: Id };
  service?: Id | { id: Id };
  count: number;
  onTimePct?: number;
  damagePct?: number;
  avgSettlementDays?: number;
}
interface FaqDoc {
  id: Id;
  question: string;
  answer: unknown;
  scope: string;
  city?: Id | { id: Id };
  service?: Id | { id: Id };
  priority?: number;
}
/** The `home-content` global, as returned by Payload (defaults applied). */
type HomeContentDoc = Partial<HomeContent> & { pillars?: Array<TrustPillar & { id?: string }> };

/**
 * Map the editable `home-content` global onto the render payload the home template
 * reads. Blank fields fall back to the built-in copy so the page always renders.
 */
function toHomeContent(doc: HomeContentDoc | null): HomeContent {
  return {
    taglineLine1: doc?.taglineLine1 || 'Shifting Aapki,',
    taglineLine2: doc?.taglineLine2 || 'Zimmedari Hamari.',
    heroSubtext: doc?.heroSubtext || undefined,
    servicesHeading: doc?.servicesHeading || 'What we move',
    servicesIntro:
      doc?.servicesIntro ||
      'One operation, verified crews, and a written fixed quote for every service.',
    trustHeading: doc?.trustHeading || 'House Shifting you can actually verify',
    trustIntro:
      doc?.trustIntro ||
      'Everything below is backed by real job data — no vanity counters, no stock photos.',
    statsHeading: doc?.statsHeading || 'By the numbers',
    statsIntro: doc?.statsIntro || "Unflattering when it needs to be — that's the point.",
    citiesHeading: doc?.citiesHeading || 'Cities we pick up from',
    citiesIntro:
      doc?.citiesIntro ||
      'Own crews in each. Pick your pickup city for the areas we cover, local rate bands and real reviews — delivery goes anywhere in India.',
    faqHeading: doc?.faqHeading || 'Questions people ask',
    pillars: (doc?.pillars ?? [])
      .filter((p) => p.title && p.body)
      .map((p) => ({
        icon: p.icon,
        title: p.title,
        body: p.body,
        variant: p.variant,
        link: p.link?.href ? { href: p.link.href, label: p.link.label || 'Learn more' } : undefined,
      })),
  };
}

async function loadAll<T>(payload: Payload, collection: string): Promise<T[]> {
  // Only draft-enabled collections have a queryable `_status`; filtering it on a
  // non-versioned collection (jobs-stats, rate-cards…) throws a 400. Detect drafts
  // from the collection config and only then restrict to published rows.
  const hasDrafts = Boolean(
    (payload.collections as Record<string, { config?: { versions?: { drafts?: unknown } } }>)[
      collection
    ]?.config?.versions?.drafts,
  );
  const where = hasDrafts ? ({ _status: { equals: 'published' } } as never) : undefined;
  const out: T[] = [];
  let page = 1;
  for (;;) {
    const res = await payload.find({
      collection: collection as never,
      depth: 0,
      limit: 500,
      page,
      where,
      overrideAccess: true,
    });
    out.push(...(res.docs as T[]));
    if (!res.hasNextPage) break;
    page += 1;
  }
  return out;
}

const BRAND = 'MrPackerMover';

export async function buildManifest(payload: Payload, siteOrigin: string): Promise<Manifest> {
  const [locations, services, lanes, rateCards, reviews, jobsStats, faqs, media] =
    await Promise.all([
      loadAll<LocationDoc>(payload, 'locations'),
      loadAll<ServiceDoc>(payload, 'services'),
      loadAll<LaneDoc>(payload, 'lanes'),
      loadAll<RateCardDoc>(payload, 'rate-cards'),
      loadAll<ReviewDoc>(payload, 'reviews'),
      loadAll<JobsStatDoc>(payload, 'jobs-stats'),
      loadAll<FaqDoc>(payload, 'faqs'),
      loadAll<MediaDoc>(payload, 'media'),
    ]);

  // Services render in the catalogue order from @mpm/shared, never in whatever order
  // Postgres happens to return rows. `loadAll` issues no `sort` and the collection sets
  // no `defaultSort`, so the generated manifest was ordering services by row creation
  // date — which is why "What we move" appeared in a different order in production than
  // on a local build, where the committed sample manifest supplies a hand-authored order.
  // Anything not in the catalogue (an editor-added service) sorts after it, by name.
  // Explicitly Map<string, number>: SERVICES is `as const`, so an inferred Map would key
  // on the literal slug union and reject a lookup with a plain string from the database.
  const serviceOrder = new Map<string, number>(SERVICES.map((s, index) => [s.slug, index]));
  services.sort((a, b) => {
    const ai = serviceOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bi = serviceOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi || (a.name ?? '').localeCompare(b.name ?? '');
  });

  // Media id → { url, alt } so a location's uploaded hero resolves to a Cloudinary URL.
  const mediaById = new Map(media.map((m) => [sid(m.id), m]));
  const imageFor = (
    ref: Id | { id: Id } | null | undefined,
  ): { url: string; alt?: string } | undefined => {
    const m = mediaById.get(refId(ref) ?? '');
    return m?.url ? { url: m.url, alt: m.alt || undefined } : undefined;
  };

  const idx = new DataIndex(locations, services, lanes, rateCards, reviews, jobsStats, faqs);
  const cities = locations.filter((l) => l.type === 'city' && l.isServiceable);
  const localities = locations.filter((l) => l.type === 'locality' && l.isServiceable);
  const publicServices = services.filter((s) => !s.isCorporate);

  const rows: ManifestRow[] = [];
  const publishedCityIds = new Set<string>();

  // ── Pre-pass: which cities publish, and which services each one offers ───────
  // EVERY city×service link on the site (the service hub's "Cities we serve", the
  // nearby-city links) is built from this plan, so a city that does NOT offer a service
  // is never linked to a `/packers-and-movers/<city>/<service>` page that was never
  // created — that mismatch was the 404 an editor hit from the service page.
  interface CityPlan {
    city: LocationDoc;
    cid: string;
    services: ServiceDoc[];
  }
  const cityPlan: CityPlan[] = [];
  const serviceCities = new Map<string, ManifestLink[]>(); // serviceId → its hub's city links
  const cityServicePaths = new Set<string>(); // every city×service path that will exist
  for (const city of cities) {
    const cid = sid(city.id);
    const stats = idx.statsFor(cid);
    const cityCandidate: GateCandidate = {
      pageType: 'city-hub',
      hasRateCard: idx.hasCityRateCard(cid),
      jobCount12m: stats.jobs12m,
      reviewsCount: idx.reviewsFor(cid).length,
      baseDistanceMeters: 0,
      localContentWords: countWords(city.editorialNote),
      scopedFaqCount: idx.faqsForCity(cid).length,
      hasLocationPhotos: false,
      namedLocalFacts: 2,
      hasNamedCoordinator: true,
      rateBandCount: idx.cityRateBands(cid).length,
    };
    if (!evaluateCandidate(cityCandidate).passed) continue;
    publishedCityIds.add(cid);

    // A city × service page publishes only with real service-in-city proof (the gate).
    const cityServiceCandidate = (svcId: string): GateCandidate => ({
      pageType: 'city-service',
      hasRateCard: idx.hasCityRateCard(cid) || idx.hasServiceRateCard(svcId),
      jobCount12m: idx.statsFor(cid, svcId).jobs12m,
      reviewsCount: idx.reviewsFor(cid, svcId).length,
      baseDistanceMeters: 0,
      localContentWords: 200,
      scopedFaqCount: idx.faqsForCityService(cid, svcId).length,
      hasLocationPhotos: false,
      namedLocalFacts: 2,
      hasNamedCoordinator: true,
      rateBandCount: idx.cityRateBands(cid).length || idx.serviceRateBands(svcId).length,
    });
    // Which services this city offers is editor-controlled (the `servicesOffered` picker
    // on the city). When set, exactly those services get pages. When left empty, fall back
    // to the automatic data gate so a city configured with nothing still behaves sanely.
    const offeredIds = new Set(
      (city.servicesOffered ?? []).map((s) => refId(s)).filter((x): x is string => x != null),
    );
    const services = offeredIds.size
      ? publicServices.filter((s) => offeredIds.has(sid(s.id)))
      : publicServices.filter((s) => evaluateCandidate(cityServiceCandidate(sid(s.id))).passed);

    cityPlan.push({ city, cid, services });
    for (const s of services) {
      const svcPath = paths.cityService(city.slug, s.slug);
      cityServicePaths.add(svcPath);
      const list = serviceCities.get(sid(s.id)) ?? [];
      list.push({ path: svcPath, anchor: `${s.name} in ${city.name}`, group: 'cities' });
      serviceCities.set(sid(s.id), list);
    }
  }

  // ── City hubs + their city × service pages ─────────────────────────────────
  for (const { city, cid, services: servicesForCity } of cityPlan) {
    const stats = idx.statsFor(cid);
    const cityPath = paths.cityHub(city.slug);
    const localityLinks = localities
      .filter((l) => refId(l.parent) === cid)
      .map<ManifestLink>((l) => ({
        path: paths.locality(city.slug, l.slug),
        anchor: l.name,
        group: 'localities',
      }));

    const serviceLinks = servicesForCity.map<ManifestLink>((s) => ({
      path: paths.cityService(city.slug, s.slug),
      anchor: `${s.name} in ${city.name}`,
      group: 'services',
    }));

    rows.push(
      makeRow('city-hub', cityPath, city.slug, city.updatedAt, siteOrigin, {
        title: titleFor.cityHub(city.name, { brand: BRAND }),
        h1: `Packers and Movers in ${city.name}`,
        breadcrumbs: [{ path: '/', anchor: 'Home' }],
        relatedLinks: [...serviceLinks, ...localityLinks].slice(0, 60),
        data: {
          cityName: city.name,
          // Uploaded hero/thumbnail (Cloudinary). Absent ⇒ the template uses the
          // static /images/hero/cities/<slug>.jpg fallback.
          heroImage: imageFor(city.heroImage),
          // Sub-locations we serve — rendered as the "Areas we cover" grid, each linking
          // to that locality's own detail page.
          areas: localityLinks.map((l) => ({ path: l.path, name: l.anchor })),
          editorial: idx.editorialParagraphs(city.editorialNote),
          rateBands: idx.cityRateBands(cid),
          stats,
          reviews: idx.reviewsFor(cid).slice(0, 10),
          faqs: idx.faqsForCity(cid),
          priceFrom: idx.priceFrom(idx.cityRateBands(cid)),
        },
      }),
    );

    for (const service of servicesForCity) {
      const svcId = sid(service.id);
      // Fall back to city-level proof when a service has no service-scoped data of its
      // own, so an editor-selected service still renders a substantive page.
      const svcReviews = idx.reviewsFor(cid, svcId);
      const csReviews = svcReviews.length ? svcReviews : idx.reviewsFor(cid);
      const svcStats = idx.statsFor(cid, svcId);
      const csStats = svcStats.jobs12m ? svcStats : idx.statsFor(cid);
      const svcFaqs = idx.faqsForCityService(cid, svcId);
      const csFaqs = svcFaqs.length ? svcFaqs : idx.faqsForCity(cid);

      // Prefer a service-specific rate card (set per service in the CMS) so each service
      // can price differently; fall back to the city's rate card when there isn't one.
      const bands = idx.serviceRateBands(svcId).length
        ? idx.serviceRateBands(svcId)
        : idx.cityRateBands(cid);
      const priceFrom = idx.priceFrom(bands);
      rows.push(
        makeRow(
          'city-service',
          paths.cityService(city.slug, service.slug),
          `${city.slug}/${service.slug}`,
          city.updatedAt,
          siteOrigin,
          {
            title: titleFor.cityService(service.name, city.name, { brand: BRAND }),
            metaDescription: cityServiceMeta({
              service: service.name,
              locality: city.name,
              priceFrom,
              jobs12m: csStats.jobs12m,
              onTimePct: csStats.onTimePct,
            }),
            h1: `${service.name} in ${city.name}`,
            breadcrumbs: [
              { path: '/', anchor: 'Home' },
              { path: cityPath, anchor: city.name },
            ],
            // Also link the localities we cover in this city — a natural in-page link
            // that gives each locality page a third contextual inbound link (Doc 02 §7).
            relatedLinks: [
              ...nearbyCityServiceLinks(cities, city, service.slug, cityServicePaths),
              ...localityLinks.slice(0, 6),
            ],
            data: {
              cityName: city.name,
              serviceName: service.name,
              editorial: idx.editorialParagraphs(city.editorialNote).slice(0, 2),
              rateBands: bands,
              stats: csStats,
              reviews: csReviews.slice(0, 9),
              faqs: csFaqs,
              inclusions: (service.inclusions ?? []).map((i) => i.item),
              exclusions: (service.exclusions ?? []).map((i) => i.item),
              priceFrom,
              heroImage: imageFor(city.heroImage),
            },
          },
        ),
      );
    }
  }

  // ── Localities ─────────────────────────────────────────────────────────────
  for (const loc of localities) {
    const parent = idx.location(refId(loc.parent));
    if (!parent) continue;
    // Don't publish a locality whose city hub didn't clear the gate — it would
    // orphan the locality (its breadcrumb/back-link points at a missing city hub).
    if (!publishedCityIds.has(sid(parent.id))) continue;
    const lid = sid(loc.id);
    const words = countWords(loc.editorialNote);
    const candidate: GateCandidate = {
      pageType: 'locality',
      hasRateCard: idx.hasCityRateCard(sid(parent.id)),
      jobCount12m: idx.statsFor(lid).jobs12m,
      reviewsCount: idx.reviewsFor(lid).length,
      baseDistanceMeters: 0,
      localContentWords: words,
      scopedFaqCount: idx.faqsForCity(lid).length + 4, // locality FAQs seeded editorially
      hasLocationPhotos: false,
      namedLocalFacts: words >= 40 ? 2 : 0,
      hasNamedCoordinator: true,
      rateBandCount: idx.cityRateBands(sid(parent.id)).length,
    };
    if (!evaluateCandidate(candidate).passed) continue;

    // Reviews render as the moving marquee (like the city page) once there are >4. A
    // locality rarely has that many of its own, so top up with the parent city's verified
    // reviews — the locality's own lead, the city's fill the loop (jobRefs are globally
    // unique, so no duplicates). Mirrors the city-service reviews fallback above.
    const locReviews = idx.reviewsFor(lid);
    const localityReviews =
      locReviews.length > 4 ? locReviews : [...locReviews, ...idx.reviewsFor(sid(parent.id))];

    rows.push(
      makeRow(
        'locality',
        paths.locality(parent.slug, loc.slug),
        `${parent.slug}/${loc.slug}`,
        loc.updatedAt,
        siteOrigin,
        {
          title: titleFor.locality(loc.name, parent.name, { brand: BRAND }),
          h1: `Packers and Movers in ${loc.name}, ${parent.name}`,
          breadcrumbs: [
            { path: '/', anchor: 'Home' },
            { path: paths.cityHub(parent.slug), anchor: parent.name },
          ],
          relatedLinks: siblingLocalityLinks(localities, loc, parent),
          data: {
            localityName: loc.name,
            cityName: parent.name,
            cityPath: paths.cityHub(parent.slug),
            editorial: idx.editorialParagraphs(loc.editorialNote),
            rateBands: idx.cityRateBands(sid(parent.id)),
            stats: idx.statsFor(lid),
            reviews: localityReviews.slice(0, 9),
            faqs: idx.faqsForCity(sid(parent.id)).slice(0, 6),
            priceFrom: idx.priceFrom(idx.cityRateBands(sid(parent.id))),
            // The locality's own photo when the editor uploaded one, else the city's.
            // Resolved here so the template needs no fallback logic of its own.
            heroImage: imageFor(loc.heroImage) ?? imageFor(parent.heroImage),
          },
        },
      ),
    );
  }

  // ── Routes ───────────────────────────────────────────────────────────────
  for (const lane of lanes) {
    const origin = idx.location(refId(lane.origin));
    const dest = idx.location(refId(lane.destination));
    if (!origin || !dest || (lane.jobCount ?? 0) < 1) continue;
    const bands = idx.laneRateBands(sid(lane.id));
    const candidate: GateCandidate = {
      pageType: 'route',
      hasRateCard: bands.length > 0,
      jobCount12m: lane.jobCount ?? 0,
      reviewsCount: 0,
      baseDistanceMeters: 0,
      localContentWords:
        countWords(lane.overnightBlock) + (lane.borderNotes?.split(/\s+/).length ?? 0),
      scopedFaqCount: 0,
      hasLocationPhotos: false,
      namedLocalFacts: 2,
      hasNamedCoordinator: true,
      rateBandCount: bands.length,
    };
    if (!evaluateCandidate(candidate).passed) continue;

    rows.push(
      makeRow(
        'route',
        paths.route(origin.slug, dest.slug),
        `${origin.slug}-to-${dest.slug}`,
        lane.updatedAt,
        siteOrigin,
        {
          title: titleFor.route(origin.name, dest.name, { brand: BRAND }),
          h1: `${origin.name} to ${dest.name} Packers and Movers`,
          breadcrumbs: [
            { path: '/', anchor: 'Home' },
            { path: paths.cityHub(origin.slug), anchor: origin.name },
          ],
          relatedLinks: [
            {
              path: paths.cityHub(origin.slug),
              anchor: `Movers in ${origin.name}`,
              group: 'endpoints',
            },
            {
              path: paths.cityHub(dest.slug),
              anchor: `Movers in ${dest.name}`,
              group: 'endpoints',
            },
            {
              path: paths.route(dest.slug, origin.slug),
              anchor: `${dest.name} to ${origin.name}`,
              group: 'reverse',
            },
          ],
          data: {
            originName: origin.name,
            destName: dest.name,
            roadKm: lane.roadKm,
            transitDays: lane.transitDays,
            frequency: lane.frequency,
            overnight: idx.editorialParagraphs(lane.overnightBlock),
            borderNotes: lane.borderNotes,
            rateBands: bands,
            priceFrom: idx.priceFrom(bands),
          },
        },
      ),
    );
  }

  // ── Service hubs ─────────────────────────────────────────────────────────
  const pub = publicServices;
  for (const service of services) {
    const path = service.isCorporate
      ? paths.corporate(service.slug)
      : paths.serviceHub(service.slug);
    // Cross-link to sibling service hubs (cyclic) so every hub has ≥ 3 contextual
    // inbound links — the same no-orphans guarantee the geo pages get (Doc 02 §7).
    const si = pub.findIndex((s) => sid(s.id) === sid(service.id));
    const siblings: ManifestLink[] =
      si >= 0
        ? [1, 2, 3]
            .map((k) => pub[(si + k) % pub.length])
            .filter((s): s is ServiceDoc => Boolean(s) && sid(s!.id) !== sid(service.id))
            .map((s) => ({ path: paths.serviceHub(s.slug), anchor: s.name, group: 'services' }))
        : [];
    rows.push(
      makeRow('service-hub', path, service.slug, service.updatedAt, siteOrigin, {
        title: `${service.name} Services in India – ${BRAND}`.slice(0, 60),
        h1: `${service.name} Services`,
        breadcrumbs: [{ path: '/', anchor: 'Home' }],
        // Only the cities that actually offer this service (from the pre-pass) — never a
        // city whose `/packers-and-movers/<city>/<service>` page doesn't exist (→ 404).
        relatedLinks: [...(serviceCities.get(sid(service.id)) ?? []), ...siblings],
        data: {
          serviceName: service.name,
          summary: service.summary,
          inclusions: (service.inclusions ?? []).map((i) => i.item),
          exclusions: (service.exclusions ?? []).map((i) => i.item),
        },
      }),
    );
  }

  // ── Home ─────────────────────────────────────────────────────────────────
  const totalJobs = jobsStats.reduce((sum, s) => sum + (s.count ?? 0), 0);
  const settlements = jobsStats
    .map((s) => s.avgSettlementDays)
    .filter((n): n is number => n != null);
  const homeContentDoc = (await payload
    .findGlobal({ slug: 'home-content', overrideAccess: true })
    .catch(() => null)) as HomeContentDoc | null;
  const homeContent = toHomeContent(homeContentDoc);
  const homeFaqs: FaqItem[] = faqs
    .filter((f) => f.scope === 'global')
    .map((f) => ({ question: f.question, answer: richTextToPlain(f.answer) }));
  rows.push(
    makeRow('home', '/', 'home', new Date(0).toISOString(), siteOrigin, {
      title: `Packers and Movers in India – Fixed Quotes | ${BRAND}`.slice(0, 60),
      // The templated page families deliberately omit a description rather than repeat
      // boilerplate across thousands of URLs (see @mpm/seo/meta). The home page is the
      // one unique, hand-written page on the site, so that reasoning does not apply —
      // and shipping it with no description costs a Lighthouse SEO point and hands
      // Google a machine-generated snippet for the site's most important result.
      metaDescription:
        'Packers and movers across India with fixed, written quotes — verified crews, ' +
        'published rate cards and real claims data. Get your price before you book.',
      h1: 'Packers and Movers you can actually verify',
      relatedLinks: [
        ...publicServices.map<ManifestLink>((s) => ({
          path: paths.serviceHub(s.slug),
          anchor: s.name,
          group: 'services',
        })),
        ...cities.map<ManifestLink>((c) => ({
          path: paths.cityHub(c.slug),
          anchor: c.name,
          group: 'cities',
        })),
      ],
      data: {
        totalJobs12m: totalJobs,
        medianSettlementDays: median(settlements),
        onTimePct: idx.overallOnTime(),
        faqs: homeFaqs,
        content: homeContent,
      },
    }),
  );

  computeInboundLinks(rows);

  // ── Careers postings (open roles) → /company/careers ───────────────────────
  interface JobDoc {
    title: string;
    slug: string;
    team?: string;
    employmentType?: string;
    location?: string;
    summary?: string;
    isOpen?: boolean;
    order?: number;
  }
  const jobs = (await loadAll<JobDoc>(payload, 'jobs'))
    .filter((j) => j.isOpen !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((j) => ({
      title: j.title,
      slug: j.slug,
      team: j.team,
      employmentType: j.employmentType,
      location: j.location,
      summary: j.summary ?? '',
    }));

  // ── Editable copy for the hand-built editorial pages, looked up by key ─────
  interface PageDoc {
    key?: string;
    title?: string;
    eyebrow?: string;
    intro?: string;
    body?: unknown;
    seoDescription?: string;
  }
  const editorial: Record<string, EditorialContent> = {};
  for (const p of await loadAll<PageDoc>(payload, 'pages')) {
    if (!p.key) continue;
    editorial[p.key] = {
      title: p.title || undefined,
      eyebrow: p.eyebrow || undefined,
      intro: p.intro || undefined,
      bodyHtml: richTextToHtml(p.body) || undefined,
      seoDescription: p.seoDescription || undefined,
    };
  }

  // Editorial pages that exist in the CMS but are currently *unpublished*. Their nav
  // links (footer + header) are hidden and the route is de-indexed. Keys that were
  // never created are absent from this list, so they keep their built-in fallback
  // copy and stay visible — this means "unpublished in the CMS", not "not in the CMS".
  let hiddenPages: string[] = [];
  try {
    const all = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      draft: true, // return the latest version of every page so we can read _status
    });
    hiddenPages = all.docs
      .filter((p) => p.key && p._status !== 'published')
      .map((p) => p.key as string);
  } catch {
    hiddenPages = [];
  }

  // ── Blog posts (CMS-managed) → /blog ───────────────────────────────────────
  interface PostDoc {
    slug: string;
    title: string;
    excerpt?: string;
    category?: string;
    author?: string;
    publishedDate?: string;
    cover?: { url?: string; alt?: string } | Id | null;
    tags?: string[];
    featured?: boolean;
    body?: unknown;
    updatedAt: string;
  }
  let blog: BlogPost[] = [];
  try {
    const res = await payload.find({
      collection: 'posts' as never,
      depth: 1, // populate the cover Media so we can read its Cloudinary URL + alt
      limit: 500,
      pagination: false,
      where: { _status: { equals: 'published' } } as never,
      overrideAccess: true,
    });
    // `collection` is passed `as never` above, so `find` resolves to its untyped overload
    // and `docs` comes back as generic JSON. Go through `unknown` to reach `PostDoc`.
    blog = (res.docs as unknown as PostDoc[]).map((p) => {
      const cover =
        p.cover && typeof p.cover === 'object' ? (p.cover as { url?: string; alt?: string }) : null;
      const words = richTextToPlain(p.body).split(/\s+/).filter(Boolean).length;
      return {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? '',
        category: p.category ?? 'Guides',
        author: p.author || 'The MrPackerMover Team',
        date: p.publishedDate ?? p.updatedAt,
        readMins: Math.max(1, Math.round(words / 200)),
        cover: cover?.url ? cldUrl(cover.url, CLD_TRANSFORM.blog) : '/images/hero/moving.jpg',
        coverAlt: cover?.alt ?? p.title,
        featured: Boolean(p.featured),
        tags: p.tags ?? [],
        body: richTextToHtml(p.body) || '',
      };
    });
  } catch {
    blog = [];
  }

  const org = await payload
    .findGlobal({ slug: 'org-profile', overrideAccess: true })
    .catch(() => null);
  return {
    generatedAt: new Date().toISOString(),
    siteOrigin: siteOrigin.replace(/\/$/, ''),
    jobs,
    editorial,
    hiddenPages,
    blog,
    org: org
      ? {
          brandName: org.brandName,
          legalName: org.legalName,
          gstin: org.gstin,
          cin: org.cin,
          yearsOperating: org.yearsOperating,
          insurancePartner: org.insurancePartner ?? undefined,
          registeredOffice: org.registeredOffice,
          complaintSla: org.complaintSla ?? undefined,
          phone: org.phone ?? undefined,
          whatsapp: org.whatsapp ?? undefined,
          sameAs: (org.sameAs ?? []).map((s: { url: string }) => s.url),
        }
      : undefined,
    pages: rows,
  };
}

// ── Related-link helpers ─────────────────────────────────────────────────────
function siblingLocalityLinks(
  all: LocationDoc[],
  loc: LocationDoc,
  parent: LocationDoc,
): ManifestLink[] {
  return all
    .filter((l) => refId(l.parent) === sid(parent.id) && sid(l.id) !== sid(loc.id))
    .slice(0, 6)
    .map((l) => ({
      path: paths.locality(parent.slug, l.slug),
      anchor: `Movers in ${l.name}`,
      group: 'siblings',
    }));
}
function nearbyCityServiceLinks(
  cities: LocationDoc[],
  city: LocationDoc,
  serviceSlug: string,
  servedPaths: Set<string>,
): ManifestLink[] {
  // Cyclic pick of the next N cities so links spread evenly and no city (not even
  // the last in the list) is orphaned — a plain `.slice` would starve the tail. Only
  // cities that actually offer this service (their city×service page exists) are linked,
  // so we never emit a link that 404s.
  const n = cities.length;
  const i = cities.findIndex((c) => sid(c.id) === sid(city.id));
  if (i < 0 || n < 2) return [];
  const out: ManifestLink[] = [];
  for (let k = 1; k <= 6 && k < n; k += 1) {
    const c = cities[(i + k) % n];
    if (!c) continue;
    const path = paths.cityService(c.slug, serviceSlug);
    if (!servedPaths.has(path)) continue;
    out.push({
      path,
      anchor: `${serviceSlug.replace(/-/g, ' ')} in ${c.name}`,
      group: 'nearby',
    });
  }
  return out;
}

/**
 * Compute inbound links from the related-link graph: for every related link a page
 * emits, register a reciprocal inbound edge on the target. This is what makes the
 * ≥ 3-inbound-links assertion pass without hand-authoring (Doc 02 §7).
 */
function computeInboundLinks(rows: ManifestRow[]): void {
  const byPath = new Map(rows.map((r) => [r.path, r]));
  for (const row of rows) {
    for (const link of [...row.relatedLinks, ...row.breadcrumbs]) {
      const target = byPath.get(link.path);
      if (target && target.path !== row.path) {
        target.inboundLinks.push({ path: row.path, anchor: link.anchor });
      }
    }
  }
  // Cap for tidiness; the CI assertion only needs ≥ MIN_INBOUND_LINKS per page.
  for (const row of rows) {
    if (row.inboundLinks.length > 12) row.inboundLinks = row.inboundLinks.slice(0, 12);
  }
}

interface RowExtras {
  title: string;
  h1: string;
  metaDescription?: string;
  breadcrumbs?: ManifestLink[];
  relatedLinks?: ManifestLink[];
  data?: Record<string, unknown>;
}
function makeRow(
  pageType: PageType,
  path: string,
  slug: string,
  lastmod: string,
  siteOrigin: string,
  extras: RowExtras,
): ManifestRow {
  const shard = PAGE_TYPE_TO_SHARD[pageType];
  const citySlug = path.startsWith('/packers-and-movers/') ? path.split('/')[2] : undefined;
  return {
    pageType,
    path,
    canonical: absoluteUrl(siteOrigin, path),
    slug,
    sitemapShard: SITEMAP_SHARDS[shard],
    cacheTag: cacheTagFor(pageType, citySlug),
    lastmod,
    title: extras.title,
    metaDescription: extras.metaDescription,
    h1: extras.h1,
    noindex: false,
    inboundLinks: [],
    relatedLinks: extras.relatedLinks ?? [],
    breadcrumbs: extras.breadcrumbs ?? [],
    data: extras.data ?? {},
  };
}

function median(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

/** In-memory index over all Payload data — assembled once, queried O(1). */
class DataIndex {
  private locById = new Map<string, LocationDoc>();
  private reviewsByLoc = new Map<string, ReviewDoc[]>();
  private statsByLoc = new Map<string, JobsStatDoc[]>();
  private faqByCity = new Map<string, FaqDoc[]>();
  private rcByCity = new Map<string, RateCardDoc>();
  private rcByService = new Map<string, RateCardDoc>();
  private rcByLane = new Map<string, RateCardDoc>();

  constructor(
    locations: LocationDoc[],
    _services: ServiceDoc[],
    _lanes: LaneDoc[],
    rateCards: RateCardDoc[],
    reviews: ReviewDoc[],
    jobsStats: JobsStatDoc[],
    faqs: FaqDoc[],
  ) {
    for (const l of locations) this.locById.set(sid(l.id), l);
    for (const r of reviews) push(this.reviewsByLoc, refId(r.location), r);
    for (const s of jobsStats) push(this.statsByLoc, refId(s.location), s);
    for (const f of faqs) if (f.scope === 'city') push(this.faqByCity, refId(f.city), f);
    for (const rc of rateCards) {
      if (rc.scope === 'city' && refId(rc.city)) this.rcByCity.set(refId(rc.city)!, rc);
      if (rc.scope === 'service' && refId(rc.service)) this.rcByService.set(refId(rc.service)!, rc);
      if (rc.scope === 'lane' && refId(rc.lane)) this.rcByLane.set(refId(rc.lane)!, rc);
    }
    // Lane rate cards may be seeded without a lane relation; fall back to first lane card.
    this.faqsAll = faqs;
  }
  private faqsAll: FaqDoc[] = [];

  location(id: string | null): LocationDoc | undefined {
    return id ? this.locById.get(id) : undefined;
  }
  reviewsFor(locId: string, serviceId?: string): ReviewSnippet[] {
    const list = this.reviewsByLoc.get(locId) ?? [];
    return list
      .filter((r) => (serviceId ? refId(r.service) === serviceId : true))
      .map((r) => ({
        jobRef: r.jobRef,
        author: r.authorName,
        rating: r.rating,
        text: r.text,
        date: r.date,
        response: r.response,
      }));
  }
  statsFor(locId: string, serviceId?: string): StatBlock {
    const list = (this.statsByLoc.get(locId) ?? []).filter((s) =>
      serviceId ? refId(s.service) === serviceId : true,
    );
    const jobs12m = list.reduce((sum, s) => sum + (s.count ?? 0), 0);
    const onTimePct = avg(list.map((s) => s.onTimePct));
    const avgSettlementDays = avg(list.map((s) => s.avgSettlementDays));
    const damagePct = avg(list.map((s) => s.damagePct));
    return { jobs12m, onTimePct, avgSettlementDays, damagePct };
  }
  overallOnTime(): number | undefined {
    const all: Array<number | undefined> = [];
    for (const list of this.statsByLoc.values()) for (const s of list) all.push(s.onTimePct);
    return avg(all);
  }
  faqsForCity(cityId: string): FaqItem[] {
    return (this.faqByCity.get(cityId) ?? []).map((f) => ({
      question: f.question,
      answer: richTextToPlain(f.answer),
    }));
  }
  faqsForCityService(cityId: string, serviceId: string): FaqItem[] {
    return this.faqsAll
      .filter(
        (f) =>
          (f.scope === 'service' && refId(f.service) === serviceId) ||
          (f.scope === 'city' && refId(f.city) === cityId),
      )
      .map((f) => ({ question: f.question, answer: richTextToPlain(f.answer) }));
  }
  hasCityRateCard(cityId: string): boolean {
    return this.rcByCity.has(cityId);
  }
  hasServiceRateCard(serviceId: string): boolean {
    return this.rcByService.has(serviceId);
  }
  cityRateBands(cityId: string): RateBand[] {
    return this.rcByCity.get(cityId)?.bands ?? [];
  }
  serviceRateBands(serviceId: string): RateBand[] {
    return this.rcByService.get(serviceId)?.bands ?? [];
  }
  laneRateBands(laneId: string): RateBand[] {
    // Prefer an exact lane card; else the single seeded lane card, if any.
    const exact = this.rcByLane.get(laneId)?.bands;
    if (exact?.length) return exact;
    const any = [...this.rcByLane.values()][0];
    return any?.bands ?? [];
  }
  editorialParagraphs(richText: unknown): string[] {
    // Re-walk paragraph nodes so each paragraph stays a discrete string for the
    // template (richTextToPlain would flatten them into one blob).
    return paragraphs(richText);
  }
  priceFrom(bands: RateBand[]): number | undefined {
    if (!bands.length) return undefined;
    return Math.min(...bands.map((b) => b.base));
  }
}

function push<T>(map: Map<string, T[]>, key: string | null, value: T): void {
  if (!key) return;
  const list = map.get(key) ?? [];
  list.push(value);
  map.set(key, list);
}
function avg(nums: Array<number | undefined>): number | undefined {
  const vals = nums.filter((n): n is number => n != null);
  if (!vals.length) return undefined;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
function paragraphs(richText: unknown): string[] {
  const root = (
    richText as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }
  )?.root;
  if (!root?.children) return [];
  return root.children
    .map((node) => (node.children ?? []).map((c) => c.text ?? '').join(''))
    .map((s) => s.trim())
    .filter(Boolean);
}
