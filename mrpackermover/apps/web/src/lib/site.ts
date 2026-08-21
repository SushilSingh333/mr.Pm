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

/**
 * Footer/header links. A `key` marks a link to a CMS-editable editorial page: when
 * that page is unpublished in the CMS, the link is dropped (see `isPageHidden`).
 * Links without a `key` are structural (never unpublishable) and always render.
 */
export const FOOTER_COMPANY = [
  { label: 'About us', href: '/company/about', key: 'about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Licences & GST', href: '/company/licences', key: 'licences' },
  { label: 'Careers', href: '/company/careers' },
  { label: 'Contact', href: '/company/contact' },
];

export const FOOTER_TRUST = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Track your move', href: '/track' },
  { label: 'Verify crew & vehicle', href: '/verify' },
  { label: 'Claims & settlement', href: '/claims', key: 'claims' },
  { label: 'Transit insurance', href: '/insurance', key: 'insurance' },
];

/** Legal & safety column (Doc 01 §8 — kept inside the ≤20 footer link budget). */
export const FOOTER_LEGAL = [
  { label: 'Protection & claims', href: '/protection', key: 'protection' },
  { label: 'Fraud check', href: '/fraud-check', key: 'fraud-check' },
  { label: 'Raise a complaint', href: '/raise-a-complaint', key: 'raise-a-complaint' },
  { label: 'Terms', href: '/terms', key: 'terms' },
  { label: 'Privacy', href: '/privacy', key: 'privacy' },
];

/** Primary header navigation — kept to three top-level items (user request). */
export const PRIMARY_NAV = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Corporate', href: '/corporate' },
];

/** Secondary items, tucked under the header "More" dropdown to keep the bar clean. */
export const MORE_NAV = [
  {
    label: 'About us',
    href: '/company/about',
    icon: 'users',
    desc: 'Who we are & why',
    key: 'about',
  },
  { label: 'Blog', href: '/blog', icon: 'doc', desc: 'Guides & moving tips' },
  { label: 'Verify us', href: '/verify', icon: 'shield-check', desc: 'Check crew & vehicle' },
  { label: 'Track your move', href: '/track', icon: 'truck', desc: 'Live shipment status' },
  {
    label: 'Claims & settlement',
    href: '/claims',
    icon: 'claims',
    desc: 'Our published data',
    key: 'claims',
  },
  {
    label: 'Transit insurance',
    href: '/insurance',
    icon: 'insurance',
    desc: 'Cover, explained',
    key: 'insurance',
  },
  { label: 'Contact', href: '/company/contact', icon: 'headset', desc: 'Talk to a human' },
];

/** Primary contact — click-to-call in the header + everywhere (user-provided). */
export const PHONE_DISPLAY = '+91 99104 26834';
export const PHONE_TEL = '+919910426834';
export const EMAIL = 'shiftwith@mrpackermover.com';

/** WhatsApp click-to-chat: same number, digits only (wa.me rejects "+" and spaces). */
export const WHATSAPP_NUMBER = PHONE_TEL.replace(/\D/g, '');
export const WHATSAPP_MESSAGE = 'Hi MrPackerMover, I would like a fixed quote for my move.';
export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

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
