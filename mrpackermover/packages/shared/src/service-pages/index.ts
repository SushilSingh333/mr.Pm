import type { ServicePage, ServicePageOverrides } from './types.js';
import { homeShifting } from './home-shifting.js';
import { officeShifting } from './office-shifting.js';
import { carTransport } from './car-transport.js';
import { bikeTransport } from './bike-transport.js';
import { packingUnpacking } from './packing-unpacking.js';
import { loadingUnloading } from './loading-unloading.js';
import { internationalRelocation } from './international-relocation.js';

export type * from './types.js';

/**
 * The built-in copy of every service page, keyed by the service's slug - from the owner's
 * page briefs of 3 to 8 October 2026. The CMS can replace any part of it (Services →
 * "Service page"); this is what shows wherever an editor has left a field blank, and what
 * the import script copies into the CMS so editors start from the brief.
 */
export const SERVICE_PAGES: Record<string, ServicePage> = {
  'home-shifting': homeShifting,
  'office-shifting': officeShifting,
  'car-transport': carTransport,
  'bike-transport': bikeTransport,
  'packing-unpacking': packingUnpacking,
  'loading-unloading': loadingUnloading,
  'international-relocation': internationalRelocation,
};

export const servicePage = (slug: string): ServicePage | undefined => SERVICE_PAGES[slug];

/**
 * The small fixed words every service page shares, used wherever the CMS field is blank.
 * One place, so the CMS placeholders, the import and the page all say the same thing.
 */
export const SERVICE_PAGE_LABELS = {
  chip: 'Free video survey · one fixed, written price',
  cardTitle: 'Get your fixed price',
  ctaCheck: 'Check my price',
  ctaCall: 'Call us',
  ctaWhatsapp: 'WhatsApp',
} as const;

const filled = (v: unknown): boolean =>
  typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : v != null;

/**
 * The page as it should render: each field an editor filled in, the brief for the rest.
 * Field by field, never deep - a list the editor touched is the editor's whole list, so a
 * removed FAQ stays removed instead of being put back by the brief.
 */
export function mergeServicePage(
  base: ServicePage,
  overrides: ServicePageOverrides | null | undefined,
): ServicePage {
  if (!overrides) return base;
  const out: ServicePage = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (filled(value)) (out as unknown as Record<string, unknown>)[key] = value;
  }
  return out;
}

/** Fill in `{count}`, the number of live pickup cities. */
export const withCityCount = (text: string, count: number): string =>
  text.replaceAll('{count}', String(count));

/** Every string of a page with `{count}` filled in - title, meta and body alike. */
export function pageWithCityCount(page: ServicePage, count: number): ServicePage {
  const fill = (v: unknown): unknown =>
    typeof v === 'string'
      ? withCityCount(v, count)
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v;
  return fill(page) as ServicePage;
}

/** A text with its `[label](href)` links reduced to their labels - for schema and meta. */
export const plainText = (text: string): string =>
  text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\s*\n\s*\n\s*/g, ' ')
    .trim();
