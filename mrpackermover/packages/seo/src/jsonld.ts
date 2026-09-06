/**
 * JSON-LD builders (Doc 02 §8). JSON-LD only — no microdata, no duplication.
 *
 * Hard rules baked in here (and enforced by CI gate G10):
 *   • Exactly ONE Organization carries the legal identity, referenced by @id.
 *   • Geo pages emit Service + areaServed with provider → the Organization @id.
 *   • NO MovingCompany / LocalBusiness (we publish no premises).
 *   • NO self-serving AggregateRating on the Organization.
 *   • NO Product markup for a services business.
 *   • Offer prices must match the visible price on the page.
 */

export type JsonLd = Record<string, unknown>;

export const orgId = (siteOrigin: string): string => `${trim(siteOrigin)}/#organization`;
export const websiteId = (siteOrigin: string): string => `${trim(siteOrigin)}/#website`;

interface OrgInput {
  siteOrigin: string;
  legalName: string;
  brandName: string;
  gstin: string;
  cin: string;
  registeredOffice: string;
  logoUrl?: string;
  sameAs?: string[];
}

/** The single Organization node. Rendered once (home), referenced everywhere via @id. */
export function organization(input: OrgInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId(input.siteOrigin),
    name: input.brandName,
    legalName: input.legalName,
    url: trim(input.siteOrigin),
    // GSTIN / CIN / registered office are legal identifiers Google reads as proof of
    // a real business. `seed.ts` ships obvious placeholders so a fresh install boots,
    // and those were reaching production — a fake tax ID in structured data is worse
    // than none. Emit each field only once it holds a real value.
    ...(isPlaceholder(input.gstin) ? {} : { taxID: input.gstin }),
    ...(isPlaceholder(input.cin) ? {} : { identifier: input.cin }),
    ...(isPlaceholder(input.registeredOffice)
      ? {}
      : {
          address: {
            '@type': 'PostalAddress',
            streetAddress: input.registeredOffice,
            addressCountry: 'IN',
          },
        }),
    ...(input.logoUrl ? { logo: input.logoUrl } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

/**
 * Values seeded by `apps/cms/src/seed.ts` as stand-ins, plus anything still carrying
 * an obvious "fill me in" marker. Matched exactly rather than by pattern so a real
 * GSTIN/CIN can never be suppressed by accident.
 */
const PLACEHOLDERS = new Set([
  '07AAAAA0000A1Z5',
  'U63030DL2020PTC000000',
  'Registered office address — confirm before launch.',
]);

export function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  return v === '' || PLACEHOLDERS.has(v) || /confirm before launch|TODO|XXX/i.test(v);
}

/** WebSite + SearchAction (rendered once, on home). */
export function website(siteOrigin: string, brandName: string): JsonLd {
  const origin = trim(siteOrigin);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(siteOrigin),
    url: origin,
    name: brandName,
    publisher: { '@id': orgId(siteOrigin) },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin}/search?q={query}` },
      'query-input': 'required name=query',
    },
  };
}

/** BreadcrumbList from ordered {name, url} items. Rendered on every non-home page. */
export function breadcrumbs(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface ServiceInput {
  siteOrigin: string;
  name: string;
  description?: string;
  /** The serviceable city or locality name (never a premises). */
  areaServed: string;
  /** Optional Offer, for city×service and route pages. Must match visible price. */
  offer?: { priceFrom: number; priceCurrency?: 'INR' };
}

/** Service + areaServed, provider → the Organization. The geo-page workhorse. */
export function service(input: ServiceInput): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    serviceType: input.name,
    areaServed: { '@type': 'Place', name: input.areaServed },
    provider: { '@id': orgId(input.siteOrigin) },
    ...(input.description ? { description: input.description } : {}),
  };
  if (input.offer) {
    node.offers = {
      '@type': 'Offer',
      priceCurrency: input.offer.priceCurrency ?? 'INR',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: input.offer.priceCurrency ?? 'INR',
        minPrice: input.offer.priceFrom,
      },
    };
  }
  return node;
}

interface ArticleInput {
  headline: string;
  authorName: string;
  datePublished: string;
  dateModified: string;
  reviewedByName?: string;
}

/** Article for guides (author, dates, optional reviewedBy). */
export function article(input: ArticleInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    author: { '@type': 'Person', name: input.authorName },
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    ...(input.reviewedByName
      ? { reviewedBy: { '@type': 'Person', name: input.reviewedByName } }
      : {}),
  };
}

/** FAQPage — only where the Q&A is genuinely on the page and visible. */
export function faqPage(faqs: Array<{ question: string; answer: string }>): JsonLd | null {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** Individual Review nodes (never AggregateRating on the Organization). */
export function reviews(
  items: Array<{ author: string; rating: number; text: string; datePublished: string }>,
): JsonLd[] {
  return items.map((r) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author },
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
    reviewBody: r.text,
    datePublished: r.datePublished,
  }));
}

const trim = (origin: string): string => origin.replace(/\/$/, '');
