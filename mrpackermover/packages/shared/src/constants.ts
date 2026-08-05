/**
 * Domain constants — the enumerable spine of the site.
 *
 * The eight services and the page-type taxonomy are fixed vocabulary; the CMS
 * validates against them and the URL contract (paths.ts) is built from them.
 */

export const PAGE_TYPES = [
  'home',
  'service-hub',
  'city-hub',
  'city-service',
  'locality',
  'route',
  'pricing',
  'city-pricing',
  'city-reviews',
  'guide',
  'corporate',
  'corporate-city',
  'trust',
  'core',
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

/** The eight national services (Excel Build Sheet, rows P0016–P0023). */
export const SERVICES = [
  { slug: 'home-shifting', name: 'Home Shifting' },
  { slug: 'office-shifting', name: 'Office Shifting' },
  { slug: 'car-transport', name: 'Car Transport' },
  { slug: 'bike-transport', name: 'Bike Transport' },
  { slug: 'loading-unloading', name: 'Loading & Unloading' },
  { slug: 'packing-unpacking', name: 'Packing & Unpacking' },
  { slug: 'international-relocation', name: 'International Relocation' },
] as const;

export type ServiceSlug = (typeof SERVICES)[number]['slug'];

/**
 * Sitemap shards (Doc 02 §5). Each page family maps to exactly one shard so
 * per-family indexation is readable in Search Console. CI asserts 1:1 parity.
 */
export const SITEMAP_SHARDS = {
  core: 'sitemaps/core.xml',
  cities: 'sitemaps/cities.xml',
  'city-services': 'sitemaps/city-services.xml',
  localities: 'sitemaps/localities.xml',
  routes: 'sitemaps/routes.xml',
  guides: 'sitemaps/guides.xml',
  reviews: 'sitemaps/reviews.xml',
} as const;

export type SitemapShard = keyof typeof SITEMAP_SHARDS;

/** Which shard a page type belongs to. */
export const PAGE_TYPE_TO_SHARD: Record<PageType, SitemapShard> = {
  home: 'core',
  core: 'core',
  trust: 'core',
  corporate: 'core',
  pricing: 'core',
  'service-hub': 'core',
  'city-hub': 'cities',
  'city-service': 'city-services',
  'corporate-city': 'city-services',
  'city-pricing': 'cities',
  locality: 'localities',
  route: 'routes',
  guide: 'guides',
  'city-reviews': 'reviews',
};

/** Cloudflare cache tag for a page (Doc 02 §2 — purge by tag, not URL list). */
export function cacheTagFor(pageType: PageType, citySlug?: string): string {
  if (
    citySlug &&
    (pageType === 'city-hub' || pageType === 'locality' || pageType === 'city-service')
  ) {
    return `city-${citySlug}`;
  }
  return pageType;
}

/** The publish-gate pass threshold (Doc 01 §6). Weights live in the CMS. */
export const PUBLISH_GATE_THRESHOLD = 60;

/** Duplication ceiling: fail the build if the median 8-gram Jaccard exceeds this. */
export const DUPLICATION_CEILING = 0.45;

/** Minimum contextual inbound links per published page (Doc 02 §7). */
export const MIN_INBOUND_LINKS = 3;

/** Outbound link budget per page (Doc 02 §7). */
export const MAX_OUTBOUND_LINKS = 80;
