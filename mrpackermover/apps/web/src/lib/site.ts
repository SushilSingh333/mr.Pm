import { manifest } from '../data/manifest.js';

/** Site-wide constants. Origin comes from the manifest (baked at manifest-build). */
export const SITE_ORIGIN = manifest().siteOrigin;
export const BRAND = 'MrPackerMover';

/** Footer link budget ≤ 20 (Doc 01 §8) — no city dump, ever. */
export const FOOTER_SERVICES = [
  { label: 'Home Shifting', href: '/services/home-shifting' },
  { label: 'Office Shifting', href: '/services/office-shifting' },
  { label: 'Car Transport', href: '/services/car-transport' },
  { label: 'Bike Transport', href: '/services/bike-transport' },
  { label: 'Storage & Warehousing', href: '/services/storage-warehousing' },
];

export const FOOTER_COMPANY = [
  { label: 'About', href: '/company/about' },
  { label: 'Licences & GST', href: '/company/licences' },
  { label: 'Careers', href: '/company/careers' },
  { label: 'Contact', href: '/company/contact' },
];

export const FOOTER_TRUST = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Claims & settlement', href: '/claims' },
  { label: 'Verify crew & vehicle', href: '/verify' },
  { label: 'Transit insurance', href: '/insurance' },
];
