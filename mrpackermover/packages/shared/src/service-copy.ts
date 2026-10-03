/**
 * The words for each of the seven services, in one place.
 *
 * Read by the CMS manifest builder (each service page's H1 and meta description) and by
 * the website (the service cards on /services and the home page), so a service is never
 * described one way on its own page and another on a card that links to it. The copy is
 * from the Services Page brief (3 Oct 2026); the meta descriptions were written to its
 * note that all seven pages shipped with none.
 *
 * Keyed by the service's slug. A service with no entry here still works everywhere - the
 * callers fall back to its name - it just gets none of this copy.
 */
export interface ServiceCopy {
  /** Sentence-case name, as the cards and headings print it. */
  name: string;
  /** The service page's H1: the service plus a reason to click. */
  h1: string;
  /** The service page's meta description, 140-160 characters. */
  metaDescription: string;
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
    h1: 'Home shifting services with one fixed, written price',
    metaDescription:
      'Home shifting with one fixed, written price. Our own crew packs, moves, unpacks and reassembles, with a photo inventory and an overnight option for local moves.',
    lines: 'Packed, moved, unpacked and reassembled. Overnight option for local moves.',
    bestFor: 'Flats and houses, 1 RK to villa',
    anchor: 'Home shifting services',
    homeLine: 'Packed, moved, unpacked.',
  },
  'office-shifting': {
    name: 'Office shifting',
    h1: 'Office shifting services with one fixed, written price',
    metaDescription:
      'Office shifting over a weekend or night, so work never stops. Desks, files and IT labelled by team and floor, moved by our own crew on one fixed, written quote.',
    lines: 'Desks, files and IT moved over a weekend or night. Labelled by team and floor.',
    bestFor: 'Offices, shops, clinics',
    anchor: 'Office shifting services',
    homeLine: 'Weekend and night moves.',
  },
  'car-transport': {
    name: 'Car transport',
    h1: 'Car transport services with one fixed, written price',
    metaDescription:
      'Car transport door to door in an enclosed or open carrier. Photographed at pickup and at drop, insured transit available, and one fixed, written quote up front.',
    lines: 'Enclosed or open carrier, door to door. Photographed at pickup and drop.',
    bestFor: 'City to city moves, new postings',
    anchor: 'Car transport services',
    homeLine: 'Enclosed or open carriers.',
  },
  'bike-transport': {
    name: 'Bike transport',
    h1: 'Bike transport services with one fixed, written price',
    metaDescription:
      'Bike and scooter transport across India. Fuel drained, foam-wrapped and crated, photographed at pickup and delivered ready to ride, on one fixed, written quote.',
    lines: 'Fuel drained, foam-wrapped and crated. Delivered ready to ride.',
    bestFor: 'Bikes and scooters',
    anchor: 'Bike transport services',
    homeLine: 'Crated, door to door.',
  },
  'packing-unpacking': {
    name: 'Packing and unpacking',
    h1: 'Packing and unpacking services with one fixed, written price',
    metaDescription:
      'Packing and unpacking with our crew and materials while you arrange the vehicle. Unpacked and set up at the other end if you want, on one fixed, written price.',
    lines:
      'Our crew and materials, your transport. Unpacked and set up at the other end if you want.',
    bestFor: 'People who have a vehicle sorted',
    anchor: 'Packing and unpacking services',
    homeLine: 'Just the packing.',
  },
  'loading-unloading': {
    name: 'Loading and unloading',
    h1: 'Loading and unloading services with one fixed, written price',
    metaDescription:
      'Loading and unloading for your own truck or tempo. Trained hands carry, stack and strap your furniture properly, priced up front in one fixed, written quote.',
    lines: 'Trained hands for the heavy part. Furniture carried, stacked and strapped properly.',
    bestFor: 'Your own truck or tempo',
    anchor: 'Loading and unloading services',
    homeLine: 'Trained hands, your vehicle.',
  },
  'international-relocation': {
    name: 'International relocation',
    h1: 'International relocation services with one fixed, written price',
    metaDescription:
      'International relocation with packing, sea or air freight and customs paperwork handled door to door. One coordinator, one invoice and one fixed, written quote.',
    lines: 'Packing, sea or air freight and customs paperwork, door to door.',
    bestFor: 'Moves abroad',
    anchor: 'International relocation services',
    homeLine: 'Customs handled.',
  },
};

/** The copy for a service, if it has any. */
export const serviceCopy = (slug: string): ServiceCopy | undefined => SERVICE_COPY[slug];
