/**
 * CMS fields → the page-copy overrides the site lays over its built-in text
 * (packages/shared/src/page-copy.ts).
 *
 * Only what an editor actually filled in comes out: blank text and empty lists are
 * dropped, so the site keeps its built-in copy for them. List rows that lost a required
 * part are skipped rather than rendered half-empty.
 */
import type {
  CopyOverrides,
  FaqCopy,
  HomePageCopy,
  LinkCopy,
  ServiceBlock,
  ServicePageOverrides,
  ServiceSection,
  ServicesPageCopy,
} from '@mpm/shared';

type Row = Record<string, unknown>;
type Id = string | number;

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const link = (r: Row): LinkCopy | undefined => {
  const href = str(r.linkHref);
  return href ? { href, label: str(r.linkLabel) ?? 'Learn more' } : undefined;
};

/** Drop undefined and empty values, so only real overrides remain. */
function clean<T extends object>(o: { [K in keyof T]?: T[K] | undefined }): CopyOverrides<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as CopyOverrides<T>;
}

const texts = (v: unknown): string[] =>
  rows(v)
    .map((r) => str(r.text))
    .filter((t): t is string => Boolean(t));

const faqs = (v: unknown): FaqCopy[] =>
  rows(v).flatMap((r) => {
    const question = str(r.question);
    const answer = str(r.answer);
    if (!question || !answer) return [];
    const l = link(r);
    return [{ question, answer, ...(l ? { link: l } : {}) }];
  });

/** The `home-content` global's "Home page sections" group. */
export function homePageOverrides(page: unknown): CopyOverrides<HomePageCopy> {
  const p = (page ?? {}) as Row;
  return clean<HomePageCopy>({
    tagline: str(p.tagline),
    h1: str(p.h1),
    subhead: str(p.subhead),
    trust: texts(p.trust),
    promisesHeading: str(p.promisesHeading),
    promises: rows(p.promises).flatMap((r) => {
      const title = str(r.title);
      const text = str(r.text);
      if (!title || !text) return [];
      const l = link(r);
      return [{ title, text, ...(l ? { link: l } : {}) }];
    }),
    stepsHeading: str(p.stepsHeading),
    steps: rows(p.steps).flatMap((r) => {
      const title = str(r.title);
      const text = str(r.text);
      return title && text ? [{ title, text }] : [];
    }),
    compareHeading: str(p.compareHeading),
    compare: rows(p.compare).flatMap((r) => {
      const label = str(r.label);
      const them = str(r.them);
      const us = str(r.us);
      return label && them && us ? [{ label, them, us }] : [];
    }),
    nightHeading: str(p.nightHeading),
    nightText: str(p.nightText),
    packingHeading: str(p.packingHeading),
    packing: rows(p.packing).flatMap((r) => {
      const item = str(r.item);
      const how = str(r.how);
      return item && how ? [{ item, how }] : [];
    }),
    chargesHeading: str(p.chargesHeading),
    chargesIntro: str(p.chargesIntro),
    chargesFactors: rows(p.chargesFactors).flatMap((r) => {
      const title = str(r.title);
      const text = str(r.text);
      return title && text ? [{ title, text }] : [];
    }),
    chargesIncluded: str(p.chargesIncluded),
    chargesPromise: str(p.chargesPromise),
    servicesHeading: str(p.servicesHeading),
    citiesHeading: str(p.citiesHeading),
    citiesIntro: str(p.citiesIntro),
    faqHeading: str(p.faqHeading),
    faqs: faqs(p.faqs),
    closingHeading: str(p.closingHeading),
    closingText: str(p.closingText),
  });
}

/** The `services-page` global. `slugOf` turns a related service into its slug. */
export function servicesPageOverrides(
  doc: unknown,
  slugOf: (ref: unknown) => string | undefined,
): CopyOverrides<ServicesPageCopy> {
  const d = (doc ?? {}) as Row;
  return clean<ServicesPageCopy>({
    metaTitle: str(d.metaTitle),
    metaDescription: str(d.metaDescription),
    h1: str(d.h1),
    intro: str(d.intro),
    trust: texts(d.trust),
    cardsHeading: str(d.cardsHeading),
    chooserHeading: str(d.chooserHeading),
    chooser: rows(d.chooser).flatMap((r) => {
      const situation = str(r.situation);
      const need = (Array.isArray(r.need) ? r.need : [])
        .map(slugOf)
        .filter((s): s is string => Boolean(s));
      return situation && need.length > 0 ? [{ situation, need }] : [];
    }),
    chooserNoteLead: str(d.chooserNoteLead),
    chooserNoteLink: str(d.chooserNoteLink),
    chooserNoteTail: str(d.chooserNoteTail),
    standardsHeading: str(d.standardsHeading),
    standardsIntro: str(d.standardsIntro),
    standards: rows(d.standards).flatMap((r) => {
      const lead = str(r.lead);
      const rest = str(r.rest);
      if (!lead || !rest) return [];
      const l = link(r);
      return [{ lead, rest, ...(l ? { link: l } : {}) }];
    }),
    combineHeading: str(d.combineHeading),
    combineText: str(d.combineText),
    combineButton: str(d.combineButton),
    faqHeading: str(d.faqHeading),
    faqs: faqs(d.faqs),
    closingHeading: str(d.closingHeading),
    closingText: str(d.closingText),
  });
}

/** What a service's card shows, as filled in on the service ("Heading and cards"). */
export interface ServiceCardOverrides {
  h1?: string;
  lines?: string;
  bestFor?: string;
  homeLine?: string;
  anchor?: string;
}
export function serviceCardOverrides(card: unknown): ServiceCardOverrides {
  const c = (card ?? {}) as Row;
  const out: ServiceCardOverrides = {};
  const set = (k: keyof ServiceCardOverrides, v: unknown): void => {
    const s = str(v);
    if (s) out[k] = s;
  };
  set('h1', c.h1);
  set('lines', c.lines);
  set('bestFor', c.bestFor);
  set('homeLine', c.homeLine);
  set('anchor', c.linkText);
  return out;
}

/** One CMS content block → the page's block shape; undefined when it is unusable. */
function serviceBlock(b: Row): ServiceBlock | undefined {
  switch (b.blockType) {
    case 'svcText': {
      const body = str(b.body);
      return body ? { kind: 'text', body } : undefined;
    }
    case 'svcSteps': {
      const items = rows(b.items).flatMap((r) => {
        const title = str(r.title);
        return title ? [{ title, body: str(r.body) ?? '' }] : [];
      });
      return items.length ? { kind: 'steps', items } : undefined;
    }
    case 'svcList': {
      const items = texts(b.items);
      return items.length ? { kind: 'list', items } : undefined;
    }
    case 'svcTable': {
      // Two columns unless the third has a heading or any cell. The first heading may
      // be blank on purpose: the corner of a comparison table.
      const three = Boolean(str(b.h3)) || rows(b.rows).some((r) => str(r.c3));
      const columns = [str(b.h1) ?? '', str(b.h2) ?? '', ...(three ? [str(b.h3) ?? ''] : [])];
      const body = rows(b.rows).flatMap((r) => {
        const c1 = str(r.c1);
        const c2 = str(r.c2);
        if (!c1 || !c2) return [];
        return [three ? [c1, c2, str(r.c3) ?? ''] : [c1, c2]];
      });
      return body.length ? { kind: 'table', columns, rows: body } : undefined;
    }
    case 'svcScope':
      return { kind: 'scope' };
    default:
      return undefined;
  }
}

/**
 * Services → "Service page" → the overrides the service page lays over its brief
 * (packages/shared/src/service-pages). A section with no usable content is dropped, and a
 * list is sent only when it has rows - an empty list means "keep the brief's".
 */
export function servicePageOverrides(page: unknown): ServicePageOverrides {
  const d = (page ?? {}) as Row;
  const sections: ServiceSection[] = rows(d.sections).flatMap((r) => {
    const blocks = rows(r.blocks)
      .map(serviceBlock)
      .filter((b): b is ServiceBlock => Boolean(b));
    return blocks.length ? [{ heading: str(r.heading) ?? '', blocks }] : [];
  });
  return clean<Required<ServicePageOverrides>>({
    subhead: str(d.subhead),
    trust: rows(d.trust)
      .map((r) => str(r.item))
      .filter((t): t is string => Boolean(t)),
    quoteNote: str(d.quoteNote),
    sections,
    faqHeading: str(d.faqHeading),
    faqs: rows(d.faqs).flatMap((r) => {
      const question = str(r.question);
      const answer = str(r.answer);
      return question && answer ? [{ question, answer }] : [];
    }),
    citiesHeading: str(d.citiesHeading),
    citiesIntro: str(d.citiesIntro),
    ctaHeading: str(d.ctaHeading),
    ctaText: str(d.ctaText),
    chip: str(d.chip),
    cardTitle: str(d.cardTitle),
    ctaCheck: str(d.ctaCheck),
    ctaCall: str(d.ctaCall),
    ctaWhatsapp: str(d.ctaWhatsapp),
    related: rows(d.related).flatMap((r) => {
      const label = str(r.label);
      const href = str(r.href);
      return label && href ? [{ label, href }] : [];
    }),
  }) as ServicePageOverrides;
}

export const idOf = (ref: unknown): Id | undefined =>
  ref && typeof ref === 'object' && 'id' in (ref as object)
    ? ((ref as { id: Id }).id as Id)
    : typeof ref === 'string' || typeof ref === 'number'
      ? ref
      : undefined;
