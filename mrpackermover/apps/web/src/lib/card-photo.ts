import fs from 'node:fs';
import path from 'node:path';
import { heroAlt, heroForService } from './hero.js';
import cardPhotos from '../data/card-photos.json';

/**
 * A service's card photograph: a real photo of that job carrying our mark, a 600x375 crop
 * (~20 KB) built with its alt text by scripts/build-card-photos.mjs. A service added later
 * with no photo yet has none, and its card shows without one.
 */
export function cardPhoto(slug: string): { src: string; alt: string } | null {
  if (!fs.existsSync(path.resolve('public/images/cards', `${slug}.webp`))) return null;
  return {
    src: `/images/cards/${slug}.webp`,
    alt:
      (cardPhotos as Record<string, { alt: string }>)[slug]?.alt ?? heroAlt(heroForService(slug)),
  };
}
