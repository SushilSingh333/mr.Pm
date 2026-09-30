import { materialUrl, type MaterialIcon } from '../icons/material.js';

/**
 * Icons for the sidebar - Google's Material Symbols, the set Google Calendar and Gmail use.
 *
 * Payload gives every nav link a stable id - `nav-<slug>` for a collection,
 * `nav-global-<slug>` for a global - so the icons are attached by CSS to those ids,
 * without replacing Payload's nav. Each is a CSS mask filled with currentColor, so one
 * icon is grey in a row, dark on the selected row, and light in the dark phone drawer.
 */

/** Which icon each sidebar entry wears, by the id Payload gives its link. */
const NAV: Record<string, MaterialIcon> = {
  'nav-leads': 'inbox',
  'nav-proposals': 'request_quote',
  'nav-global-lead-routing': 'alt_route',
  'nav-global-sales-messages': 'sms',
  'nav-global-schedule-settings': 'tune',
  'nav-posts': 'newspaper',
  'nav-guides': 'menu_book',
  'nav-pages': 'web',
  'nav-content-blocks': 'widgets',
  'nav-faqs': 'quiz',
  'nav-locations': 'location_on',
  'nav-services': 'local_shipping',
  'nav-lanes': 'route',
  'nav-rate-cards': 'sell',
  'nav-reviews': 'reviews',
  'nav-people': 'group',
  'nav-media': 'photo_library',
  'nav-jobs': 'work',
  'nav-jobs-stats': 'analytics',
  'nav-job-applications': 'assignment',
  'nav-contact-messages': 'mail',
  'nav-operating-bases': 'domain',
  'nav-users': 'manage_accounts',
  'nav-login-events': 'history',
  'nav-global-home-content': 'home',
  'nav-global-integrations': 'extension',
  'nav-global-org-profile': 'badge',
  'nav-global-seo-defaults': 'travel_explore',
};

/**
 * The stylesheet: every nav link's icon. An entry this map does not know (a collection
 * added later) wears a small circle rather than leaving a gap.
 */
export const NAV_ICON_CSS = [
  `.nav .nav-group__content .nav__link{ --ico:${materialUrl('circle')}; }`,
  ...Object.entries(NAV).map(([id, icon]) => `#${id}{ --ico:${materialUrl(icon)}; }`),
].join('\n');
