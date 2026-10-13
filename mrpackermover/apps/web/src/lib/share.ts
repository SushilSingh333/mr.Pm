import type { ManifestRow } from '@mpm/shared';
import { HERO_ALT, HERO_FOR_SERVICE, heroForService } from './hero.js';

/**
 * The picture a shared link shows (og:image), for every page.
 *
 * The images are the banner photographs cropped to 1200x630 with our mark on them, built
 * by scripts/build-share-images.mjs into public/og/. A page shares the photo its own banner
 * shows: a service page and a city × service page share that service's photo, and every
 * other page (home, cities, areas, the company pages) shares the montage that the home
 * page and the city banners use.
 */
export interface Share {
  /** Site path (/og/home.jpg) or an absolute URL (a CMS upload). */
  image: string;
  alt: string;
  /** Pixel size, when known: our own images are always 1200x630. */
  width?: number;
  height?: number;
  type?: 'website' | 'article';
  /** ISO dates, for an article. */
  published?: string;
  modified?: string;
}

const OWN = { width: 1200, height: 630 };

const shareOf = (name: string): Share => ({
  image: `/og/${name}.jpg`,
  alt: HERO_ALT[name] ?? HERO_ALT.home ?? '',
  ...OWN,
});

/** The share image for a page, from its manifest row. */
export function shareFor(row: ManifestRow): Share {
  if (row.pageType === 'service-hub') return shareOf(heroForService(row.slug));
  if (row.pageType === 'city-service') return shareOf(heroForService(row.slug.split('/')[1] ?? ''));
  return shareOf('home');
}

/**
 * The share image for a blog post: its cover. A cover that is one of the banner photos
 * (/images/hero/<name>.jpg) uses that photo's 1200x630 version; a CMS upload is shared as
 * it is; anything else falls back to the montage.
 */
export function shareForCover(cover: string, alt: string): Share {
  const own = cover.match(/^\/images\/hero\/([\w-]+)\.jpg$/)?.[1];
  if (own && (own === 'home' || own in HERO_FOR_SERVICE)) return { ...shareOf(own), alt };
  if (/^https?:\/\//.test(cover)) return { image: cover, alt };
  return { ...shareOf('home'), alt };
}
