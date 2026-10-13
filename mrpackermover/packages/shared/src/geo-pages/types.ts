import type { ServiceFaq, ServiceSection } from '../service-pages/types.js';

/**
 * A city page (/packers-and-movers/<city>) or a locality page
 * (/packers-and-movers/<city>/<locality>), in the shape of the owner's city briefs:
 * the hero (the same banner and price check as before - only its words come from here),
 * a run of sections built from the service pages' blocks, the FAQs, the service links,
 * the nearby places and routes, and a closing call to action.
 *
 * Text conventions are the service pages' (see service-pages/types.ts): `[label](/path)`
 * links, a blank line between paragraphs, `{count}` for the number of live cities.
 *
 * What the page builds by itself, so it is never typed here: the links to the services
 * offered in the city, the links to nearby cities or sibling localities (only live ones),
 * the breadcrumbs, and the schema.
 */
export interface GeoPage {
  /**
   * The place's name as people write it ("Greater Kailash", "Sector 18"). Set on locality
   * pages: the import script creates the place's CMS record from it when there is none.
   */
  name?: string;
  /** <title>, at most 60 characters. */
  title: string;
  /** Meta description, at most 160 characters. */
  metaDescription: string;
  h1: string;
  /** The line under the H1 in the hero. */
  subhead: string;
  /** Three or four short proofs, shown as the hero's trust strip. */
  trust: string[];
  /** The body sections, in order. */
  sections: ServiceSection[];
  faqHeading: string;
  faqs: ServiceFaq[];
  /** Heading over the links to this place's services, e.g. "Moving services in Delhi". */
  servicesHeading: string;
  /** Heading and one line over the nearby places (cities, or sibling areas) and routes. */
  nearbyHeading: string;
  nearbyIntro: string;
  /**
   * Popular routes from here, as plain names ("Delhi to Bangalore"). Shown as text, not
   * links, until each route has a page of its own.
   */
  routes: string[];
  ctaHeading: string;
  ctaText: string;
  /**
   * Customer reviews an editor adds in the CMS (Locations → Page content → Customer
   * reviews). The briefs carry none: the page shows a reviews section only once a real
   * review is added.
   */
  reviewsHeading?: string;
  reviews?: GeoReview[];
  /**
   * The housing societies, apartment complexes and named blocks in a locality, as people
   * write them ("Supertech Capetown", "Gaur Saundaryam"). Shown as a band of chips, each
   * opening the quote form with that society filled in. People search for movers by
   * their society's name, so every real one listed is a way in.
   */
  societies?: string[];
  /**
   * The societies band's heading, when the list is the area's neighbours rather than the
   * area itself ("Homes we move in and around Udyog Vihar"). Blank: "Societies we move in
   * <Place>".
   */
  societiesHeading?: string;
}

/** One customer review, as the customer agreed to have it shown. */
export interface GeoReview {
  /** As shown, e.g. "Priya S.". */
  name: string;
  text: string;
  /** Their move, e.g. "2 BHK, Rohini to Dwarka". */
  move?: string;
  /** 1 to 5 stars. */
  rating?: number;
  /** When, e.g. "March 2026". */
  date?: string;
  /** Where it was first posted: Google, Justdial, Facebook… */
  source?: string;
}

/** The parts an editor has filled in; blank keeps the built-in copy. */
export type GeoPageOverrides = Partial<
  Pick<
    GeoPage,
    | 'subhead'
    | 'trust'
    | 'sections'
    | 'faqHeading'
    | 'faqs'
    | 'servicesHeading'
    | 'nearbyHeading'
    | 'nearbyIntro'
    | 'routes'
    | 'ctaHeading'
    | 'ctaText'
    | 'reviewsHeading'
    | 'reviews'
    | 'societies'
  >
>;
