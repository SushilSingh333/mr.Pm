/**
 * Which hero backdrop each service page uses. Images live in
 * public/images/hero/{name}.jpg. Each service points at its own artwork (matched by
 * name); services without dedicated artwork fall back to the generic `moving` image.
 */
export const HERO_FOR_SERVICE: Record<string, string> = {
  'home-shifting': 'home-shifting',
  'office-shifting': 'office-shifting',
  'car-transport': 'car-transport',
  'bike-transport': 'bike-transport',
  'international-relocation': 'international-relocation',
  'loading-unloading': 'loading-unloading',
  'packing-unpacking': 'packing-unpacking',
};

export const heroForService = (slug: string): string => HERO_FOR_SERVICE[slug] ?? 'moving';
