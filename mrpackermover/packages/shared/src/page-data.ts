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

export interface HomeData {
  totalJobs12m: number;
  onTimePct?: number;
  medianSettlementDays?: number;
}
