/**
 * The URL contract (ADR-0003, city-nested). This is the ONLY place canonical
 * paths are constructed, so the CMS manifest and the Astro routes can never
 * disagree about what a page's URL is.
 *
 * All paths are lowercase, hyphenated, ASCII, no trailing slash.
 */

const clean = (s: string): string => s.trim().toLowerCase();

export const paths = {
  home: (): string => '/',

  serviceHub: (service: string): string => `/services/${clean(service)}`,

  cityHub: (city: string): string => `/packers-and-movers/${clean(city)}`,

  cityService: (city: string, service: string): string =>
    `/packers-and-movers/${clean(city)}/${clean(service)}`,

  locality: (city: string, locality: string): string =>
    `/packers-and-movers/${clean(city)}/${clean(locality)}`,

  route: (origin: string, destination: string): string =>
    `/routes/${clean(origin)}-to-${clean(destination)}`,

  pricing: (): string => '/pricing',
  cityPricing: (city: string): string => `/pricing/${clean(city)}`,

  cityReviews: (city: string): string => `/reviews/${clean(city)}`,

  guide: (slug: string): string => `/guides/${clean(slug)}`,

  corporate: (slug: string): string => `/corporate/${clean(slug)}`,
  corporateCity: (city: string): string => `/corporate/office-relocation/${clean(city)}`,

  company: (slug: string): string => `/company/${clean(slug)}`,
  trust: (slug: string): string => `/${clean(slug)}`, // /pricing /claims /verify /insurance
} as const;

/** Absolute canonical from a site origin + a manifest path. Never derived from a request. */
export function absoluteUrl(siteOrigin: string, path: string): string {
  const base = siteOrigin.replace(/\/$/, '');
  // The homepage canonicalises to the origin with a single trailing slash.
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/** A route lane slug: "delhi-to-bengaluru". Split back into endpoints when needed. */
export function parseRouteSlug(lane: string): { origin: string; destination: string } | null {
  const match = clean(lane).match(/^(.+)-to-(.+)$/);
  if (!match || !match[1] || !match[2]) return null;
  return { origin: match[1], destination: match[2] };
}
