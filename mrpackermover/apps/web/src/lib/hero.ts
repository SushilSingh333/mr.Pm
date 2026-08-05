/**
 * Which hero backdrop illustration each page uses. Illustrations live in
 * public/images/hero/*.svg. These are on-brand placeholders — real crew/truck
 * photos (Doc 01 §2) drop into the same paths later with no code change.
 */
export const HERO_FOR_SERVICE: Record<string, string> = {
  'home-shifting': 'moving',
  'office-shifting': 'office',
  'car-transport': 'car',
  'bike-transport': 'bike',
  'storage-warehousing': 'storage',
  'international-relocation': 'globe',
  'loading-unloading': 'moving',
  'packing-unpacking': 'moving',
};

export const heroForService = (slug: string): string => HERO_FOR_SERVICE[slug] ?? 'moving';
