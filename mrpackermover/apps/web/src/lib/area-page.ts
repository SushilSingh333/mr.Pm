import type { GeoPage, LocalityData, ManifestRow, SubAreaCard } from '@mpm/shared';
import {
  LOCALITY_PAGES,
  fallbackGeoPage,
  geoPageWithCount,
  plainText,
  serviceCopy,
} from '@mpm/shared';
import { jsonld } from '@mpm/seo';
import { rowsOfType, dataOf } from '../data/manifest.js';
import { SITE_ORIGIN } from './site.js';
import { cardPhoto } from './card-photo.js';

type Link = { href: string; label: string; sub?: string; image?: { src: string; alt: string } };

/** Everything an area page needs, worked out once from its manifest row. */
export interface AreaPage {
  loc: LocalityData;
  page: GeoPage;
  citySlug: string;
  crumbs: { href?: string; label: string }[];
  serviceLinks: Link[];
  nearbyLinks: Link[];
  subAreas: SubAreaCard[];
  jsonLd: (Record<string, unknown> | null)[];
}

/**
 * An area page: a locality (/packers-and-movers/ghaziabad/indirapuram) or a sub-area, a
 * part of a locality with a page of its own (/packers-and-movers/ghaziabad/indirapuram/
 * vaibhav-khand). Both are built alike - the photo banner and price bar, then the brief on
 * the canvas of cards - and both come from `locality` rows; a sub-area's row also names
 * the locality it is in (`parentName`, `parentPath`).
 */
export function areaPage(row: ManifestRow): AreaPage {
  const loc = dataOf<LocalityData>(row);
  const cityName = loc.cityName;
  const page: GeoPage =
    loc.page ??
    geoPageWithCount(
      LOCALITY_PAGES[row.slug] ??
        fallbackGeoPage({
          place: loc.localityName,
          city: loc.cityName,
          notes: loc.editorial,
          faqs: loc.faqs,
        }),
      rowsOfType('city-hub').length,
    );

  const serviceLinks = row.relatedLinks
    .filter((l) => l.group === 'services')
    .map((l) => {
      const slug = l.path.split('/').pop() ?? '';
      const name = serviceCopy(slug)?.name;
      return {
        href: l.path,
        label: name ?? l.anchor,
        sub: name ? `in ${cityName}` : undefined,
        image: cardPhoto(slug) ?? undefined,
      };
    });

  // A sub-area starts with the whole of its locality; a locality with the whole city. Then
  // the sibling areas (or sibling Khands) with pages of their own.
  const nearbyLinks: Link[] = [
    loc.parentPath && loc.parentName
      ? { href: loc.parentPath, label: loc.parentName, sub: `All of ${loc.parentName}` }
      : { href: loc.cityPath, label: cityName, sub: 'The whole city' },
    ...row.relatedLinks
      .filter((l) => l.group === 'siblings')
      .map((l) => ({ href: l.path, label: l.anchor.replace(/^Movers in /, '') })),
  ];

  const crumbs = [
    { href: '/', label: 'Home' },
    { href: loc.cityPath, label: cityName },
    ...(loc.parentPath && loc.parentName ? [{ href: loc.parentPath, label: loc.parentName }] : []),
    { label: loc.localityName },
  ];

  // "Vaibhav Khand, Indirapuram, Ghaziabad" for a sub-area; "Indirapuram, Ghaziabad" else.
  const where = [loc.localityName, loc.parentName, cityName].filter(Boolean).join(', ');
  const jsonLd = [
    jsonld.service({
      siteOrigin: SITE_ORIGIN,
      name: `Packers and movers in ${where}`,
      serviceType: 'Packers and movers',
      description: plainText(page.subhead),
      areaServed: where,
      offer: loc.priceFrom ? { priceFrom: loc.priceFrom } : undefined,
    }),
    jsonld.faqPage(page.faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) }))),
  ];

  return {
    loc,
    page,
    citySlug: row.slug.split('/')[0] ?? '',
    crumbs,
    serviceLinks,
    nearbyLinks,
    subAreas: loc.subAreas ?? [],
    jsonLd,
  };
}
