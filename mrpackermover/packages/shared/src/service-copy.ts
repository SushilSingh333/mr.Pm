/**
 * The words for each of the seven services, in one place.
 *
 * Read by the website (the service cards on /services and the home page). The copy is
 * from the Services Page brief (3 Oct 2026). Each service's own page - its title, H1,
 * meta description and everything below the fold - is in ./service-pages, from the
 * per-service page briefs.
 *
 * Keyed by the service's slug. A service with no entry here still works everywhere - the
 * callers fall back to its name - it just gets none of this copy.
 */
export interface ServiceCopy {
  /** Sentence-case name, as the cards and headings print it. */
  name: string;
  /** Two lines on the /services card. */
  lines: string;
  /** Who it is for, on the /services card. */
  bestFor: string;
  /** The card link's words - descriptive, never "Learn more". */
  anchor: string;
  /** One line on the home page tile. */
  homeLine: string;
}

export const SERVICE_COPY: Record<string, ServiceCopy> = {
  'home-shifting': {
    name: 'Home shifting',
    lines: 'Packed, moved, unpacked and reassembled. Overnight option for local moves.',
    bestFor: 'Flats and houses, 1 RK to villa',
    anchor: 'Home shifting services',
    homeLine: 'Packed, moved, unpacked.',
  },
  'office-shifting': {
    name: 'Office shifting',
    lines: 'Desks, files and IT moved over a weekend or night. Labelled by team and floor.',
    bestFor: 'Offices, shops, clinics',
    anchor: 'Office shifting services',
    homeLine: 'Weekend and night moves.',
  },
  'car-transport': {
    name: 'Car transport',
    lines: 'Enclosed or open carrier, door to door. Photographed at pickup and drop.',
    bestFor: 'City to city moves, new postings',
    anchor: 'Car transport services',
    homeLine: 'Enclosed or open carriers.',
  },
  'bike-transport': {
    name: 'Bike transport',
    lines: 'Fuel drained, foam-wrapped and crated. Delivered ready to ride.',
    bestFor: 'Bikes and scooters',
    anchor: 'Bike transport services',
    homeLine: 'Crated, door to door.',
  },
  'packing-unpacking': {
    name: 'Packing and unpacking',
    lines:
      'Our crew and materials, your transport. Unpacked and set up at the other end if you want.',
    bestFor: 'People who have a vehicle sorted',
    anchor: 'Packing and unpacking services',
    homeLine: 'Just the packing.',
  },
  'loading-unloading': {
    name: 'Loading and unloading',
    lines: 'Trained hands for the heavy part. Furniture carried, stacked and strapped properly.',
    bestFor: 'Your own truck or tempo',
    anchor: 'Loading and unloading services',
    homeLine: 'Trained hands, your vehicle.',
  },
  'international-relocation': {
    name: 'International relocation',
    lines: 'Packing, sea or air freight and customs paperwork, door to door.',
    bestFor: 'Moves abroad',
    anchor: 'International relocation services',
    homeLine: 'Customs handled.',
  },
};

/** The copy for a service, if it has any. */
export const serviceCopy = (slug: string): ServiceCopy | undefined => SERVICE_COPY[slug];
