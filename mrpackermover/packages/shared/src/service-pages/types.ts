/**
 * The shape of a service page (/services/<slug>), as the owner's page briefs lay it out:
 * a hero, a run of sections made of paragraphs, steps, lists and tables, the FAQs, the
 * cities, and a closing call to action.
 *
 * The built-in copy for each service lives beside this file, one module per service. The
 * CMS mirrors this shape field for field (Services → "Service page"), and any field an
 * editor fills in replaces the built-in one (`mergeServicePage`). Blank means "use the
 * brief", the same rule as the home page and /services.
 *
 * Text conventions, shared by every string below:
 *   - `[label](/path)` is a link. Only site paths, `https://wa.me/...` and `tel:` are kept;
 *     anything else renders as plain text.
 *   - A blank line starts a new paragraph (text blocks and FAQ answers).
 *   - `{count}` is the number of live pickup cities, filled in at build time. A city
 *     count is never written as a number: the live list changes from the CMS.
 */

export type ServiceBlock =
  /** One or more paragraphs. */
  | { kind: 'text'; body: string }
  /** A numbered sequence: a bold lead word or phrase, then the rest of the step. */
  | { kind: 'steps'; items: { title: string; body: string }[] }
  /** A bulleted list. */
  | { kind: 'list'; items: string[] }
  /**
   * A table of two or three columns. `columns` are the header cells; an empty first
   * header is the corner of a comparison table ("|  | Train | Carrier |").
   */
  | { kind: 'table'; columns: string[]; rows: string[][] }
  /** The service's "What's included / What costs extra" lists, from the CMS. */
  | { kind: 'scope' };

export interface ServiceSection {
  /** The on-page H2. Empty for the lead paragraphs that sit straight under the hero. */
  heading: string;
  blocks: ServiceBlock[];
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceLink {
  label: string;
  href: string;
}

/**
 * Which enquiry form sits in the hero. Every service page has one: it saves the lead with
 * the details that size the job, and the fixed price follows in writing. (The instant
 * price check lives on /get-quote and the home page, not on service pages.)
 */
export type ServiceQuoteMode =
  'home' | 'office' | 'car' | 'bike' | 'international' | 'labour' | 'packing';

export interface ServicePage {
  /** <title>, at most 60 characters. */
  title: string;
  /** Meta description, at most 160 characters. */
  metaDescription: string;
  h1: string;
  /** The line under the H1. */
  subhead: string;
  /** Four short proofs under the form. */
  trust: string[];
  quoteMode: ServiceQuoteMode;
  /** One line under the form (what the estimate is and is not). */
  quoteNote: string;
  sections: ServiceSection[];
  faqHeading: string;
  faqs: ServiceFaq[];
  /** May contain {count}. */
  citiesHeading: string;
  /** May contain {count}. */
  citiesIntro: string;
  ctaHeading: string;
  ctaText: string;
  related: ServiceLink[];
  /** schema.org Service `serviceType`. */
  serviceType: string;
  /**
   * The service photograph (top strip and the photo under the heading), uploaded in the
   * CMS. Absent: the built-in file for the service in /images/hero.
   */
  photo?: { url: string; alt?: string };
  /** The chip on the strip. The part after " · " is dropped on a phone. */
  chip?: string;
  /** The form card's title. */
  cardTitle?: string;
  /** The closing panel's three buttons. */
  ctaCheck?: string;
  ctaCall?: string;
  ctaWhatsapp?: string;
}

/**
 * The parts of a page an editor has filled in. Every field is optional: a missing or
 * blank one keeps the built-in copy.
 */
export type ServicePageOverrides = Partial<
  Pick<
    ServicePage,
    | 'subhead'
    | 'trust'
    | 'quoteNote'
    | 'sections'
    | 'faqHeading'
    | 'faqs'
    | 'citiesHeading'
    | 'citiesIntro'
    | 'ctaHeading'
    | 'ctaText'
    | 'related'
    | 'photo'
    | 'chip'
    | 'cardTitle'
    | 'ctaCheck'
    | 'ctaCall'
    | 'ctaWhatsapp'
  >
>;
