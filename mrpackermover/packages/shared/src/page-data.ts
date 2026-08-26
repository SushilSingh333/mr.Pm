/**
 * Denormalised render payloads carried in `ManifestRow.data`.
 *
 * The manifest is the single source of truth (Doc 02 §1), so the CMS denormalises
 * everything a template needs into plain serialisable values here, and the Astro
 * web app renders from the manifest alone — no database or Lexical dependency at
 * render time. Both sides import these types so the shape can never disagree.
 */

export interface RateBand {
  band: string;
  base: number;
  perKm?: number;
  packing?: number;
  insurancePct?: number;
}

export interface ReviewSnippet {
  jobRef: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  response?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Hero/thumbnail image uploaded via the CMS (stored on Cloudinary). The `url` is a
 * plain Cloudinary delivery URL; templates inject a transform with `cldUrl()`.
 * Absent ⇒ the template falls back to the static `/images/hero/...` file.
 */
export interface HeroImage {
  url: string;
  alt?: string;
}

export interface StatBlock {
  jobs12m: number;
  onTimePct?: number;
  damagePct?: number;
  avgSettlementDays?: number;
}

export interface CityHubData {
  cityName: string;
  editorial: string[];
  rateBands: RateBand[];
  stats: StatBlock;
  reviews: ReviewSnippet[];
  faqs: FaqItem[];
  priceFrom?: number;
  /** Localities we cover in this city — the "Areas we cover" grid. */
  areas?: Array<{ path: string; name: string }>;
  /** This city's own uploaded hero. */
  heroImage?: HeroImage;
}

export interface CityServiceData {
  cityName: string;
  serviceName: string;
  editorial: string[];
  rateBands: RateBand[];
  stats: StatBlock;
  reviews: ReviewSnippet[];
  faqs: FaqItem[];
  inclusions: string[];
  exclusions: string[];
  priceFrom?: number;
  /** Inherited from the parent city — a service page has no upload of its own. */
  heroImage?: HeroImage;
}

export interface LocalityData {
  localityName: string;
  cityName: string;
  cityPath: string;
  editorial: string[];
  rateBands: RateBand[];
  stats: StatBlock;
  reviews: ReviewSnippet[];
  faqs: FaqItem[];
  priceFrom?: number;
  /**
   * The locality's own uploaded hero when the editor set one, else the parent city's.
   * Resolved in the CMS manifest builder so templates need no fallback logic.
   */
  heroImage?: HeroImage;
}

export interface RouteData {
  originName: string;
  destName: string;
  roadKm?: number;
  transitDays?: number;
  frequency?: string;
  overnight: string[];
  borderNotes?: string;
  rateBands: RateBand[];
  priceFrom?: number;
}

export interface ServiceHubData {
  serviceName: string;
  summary?: string;
  inclusions: string[];
  exclusions: string[];
}

/** A trust pillar in the "why us" bento (editable from the CMS). */
export interface TrustPillar {
  icon: string;
  title: string;
  body: string;
  link?: { href: string; label: string };
  variant?: 'lead' | 'dark' | 'default';
}

/** Editable marketing copy for the home page (CMS: HomeContent global). */
export interface HomeContent {
  taglineLine1: string;
  taglineLine2: string;
  heroSubtext?: string;
  servicesHeading: string;
  servicesIntro?: string;
  trustHeading: string;
  trustIntro?: string;
  pillars?: TrustPillar[];
  statsHeading: string;
  statsIntro?: string;
  citiesHeading: string;
  citiesIntro?: string;
  faqHeading: string;
}

export interface HomeData {
  totalJobs12m: number;
  onTimePct?: number;
  medianSettlementDays?: number;
  faqs?: FaqItem[];
  content?: HomeContent;
}
