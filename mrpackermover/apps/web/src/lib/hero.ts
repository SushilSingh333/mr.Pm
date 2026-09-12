/**
 * Which hero backdrop each service page uses. Images live in
 * public/images/hero/{name}.jpg alongside the WebP variants built from them.
 *
 * Every service has its own photograph, named for the service so the file itself is a
 * useful signal to image search. A service with no entry falls back to `home` - the
 * three-panel montage that shows the whole operation - because it is the one slot
 * guaranteed to exist.
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

export const heroForService = (slug: string): string => HERO_FOR_SERVICE[slug] ?? 'home';

/**
 * What each hero photograph actually shows.
 *
 * The banner used to be a CSS background, which a browser paints but a search engine
 * ignores: none of this photography could appear in image search, and a screen reader
 * reached the banner and said nothing. The heroes are real <img> elements now, and an
 * image is only as useful as its description.
 *
 * These are written from the photographs themselves rather than from the page title,
 * because alt text that repeats the heading next to it adds nothing for either reader.
 */
export const HERO_ALT: Record<string, string> = {
  home: 'Three MrMoverPacker services side by side: a rider with a branded delivery box, a uniformed crew member carrying a packed carton from a house, and a branded truck being loaded with wrapped furniture.',
  'home-shifting':
    'A MrMoverPacker crew carrying a wrapped sofa out of a family home while a branded truck is loaded with cartons and a family watches from the doorway.',
  'office-shifting':
    'MrMoverPacker movers wheeling wrapped office chairs, cabinets and cartons to a branded truck outside a corporate building.',
  'packing-unpacking':
    'A MrMoverPacker crew wrapping furniture and packing crockery, books and electronics into branded cartons in a living room.',
  'loading-unloading':
    'A MrMoverPacker crew carrying cartons and wrapped furniture up a ramp into a branded truck at an apartment tower entrance.',
  'car-transport':
    'A car being driven up a ramp into an enclosed MrMoverPacker carrier while a crew member guides it from the driveway.',
  'bike-transport':
    'A motorcycle being wheeled up a ramp into a MrMoverPacker truck, beside a padded branded bike cover and cartons.',
  'international-relocation':
    'A MrMoverPacker crew loading a branded wooden crate at an air-freight terminal, with a cargo aircraft and a container port behind.',
};

/**
 * Returns '' for an unknown slot on purpose. An empty alt marks an image decorative,
 * which is the honest answer when we cannot say what it shows; inventing a description
 * would be worse than saying nothing to a screen reader.
 */
export const heroAlt = (image: string): string => HERO_ALT[image] ?? '';
