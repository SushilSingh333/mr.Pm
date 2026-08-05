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
  { label: 'Packing & Unpacking', href: '/services/packing-unpacking' },
];

export const FOOTER_COMPANY = [
  { label: 'About us', href: '/company/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Licences & GST', href: '/company/licences' },
  { label: 'Careers', href: '/company/careers' },
  { label: 'Contact', href: '/company/contact' },
];

export const FOOTER_TRUST = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Track your move', href: '/track' },
  { label: 'Verify crew & vehicle', href: '/verify' },
  { label: 'Claims & settlement', href: '/claims' },
  { label: 'Transit insurance', href: '/insurance' },
];

/** Legal & safety column (Doc 01 §8 — kept inside the ≤20 footer link budget). */
export const FOOTER_LEGAL = [
  { label: 'Protection & claims', href: '/protection' },
  { label: 'Fraud check', href: '/fraud-check' },
  { label: 'Raise a complaint', href: '/raise-a-complaint' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
];

/** Primary header navigation — kept to three top-level items (user request). */
export const PRIMARY_NAV = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Corporate', href: '/corporate' },
];

/** Secondary items, tucked under the header "More" dropdown to keep the bar clean. */
export const MORE_NAV = [
  { label: 'About us', href: '/company/about', icon: 'users', desc: 'Who we are & why' },
  { label: 'Blog', href: '/blog', icon: 'doc', desc: 'Guides & moving tips' },
  { label: 'Verify us', href: '/verify', icon: 'shield-check', desc: 'Check crew & vehicle' },
  { label: 'Track your move', href: '/track', icon: 'truck', desc: 'Live shipment status' },
  { label: 'Claims & settlement', href: '/claims', icon: 'claims', desc: 'Our published data' },
  { label: 'Transit insurance', href: '/insurance', icon: 'insurance', desc: 'Cover, explained' },
  { label: 'Contact', href: '/company/contact', icon: 'headset', desc: 'Talk to a human' },
];

/** Primary contact — click-to-call in the header + everywhere (user-provided). */
export const PHONE_DISPLAY = '+91 99104 26834';
export const PHONE_TEL = '+919910426834';
export const EMAIL = 'mrmoverpacker25@gmail.com';

/** Social profiles (user-provided). */
export const SOCIALS = [
  {
    label: 'Facebook',
    icon: 'facebook',
    href: 'https://www.facebook.com/profile.php?id=61592102864935',
  },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/mrpackermover/' },
  { label: 'YouTube', icon: 'youtube', href: 'https://www.youtube.com/@mrpackermover' },
  { label: 'X', icon: 'x', href: 'https://x.com/mrpackermover' },
];
