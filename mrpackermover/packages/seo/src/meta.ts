/**
 * Title + meta-description composition (Doc 02 §9).
 *
 * Titles are budgeted to ≤ 60 characters; descriptions to 140–160. If the data
 * needed for a full description is missing, we return `undefined` and fall back to
 * a shorter/omitted meta rather than padding — a missing description beats an
 * identical one repeated across thousands of pages.
 */

export const TITLE_MAX = 60;
export const META_MIN = 140;
export const META_MAX = 160;

interface TitleParts {
  brand: string;
}

export const title = {
  cityHub: (city: string, { brand }: TitleParts): string =>
    clamp(`Packers and Movers in ${city} – ${brand}`, TITLE_MAX),

  cityService: (service: string, city: string, { brand }: TitleParts): string =>
    clamp(`${service} in ${city} – Fixed Quotes, ${brand}`, TITLE_MAX),

  locality: (locality: string, city: string, { brand }: TitleParts): string =>
    clamp(`Packers and Movers in ${locality}, ${city} – ${brand}`, TITLE_MAX),

  route: (origin: string, destination: string, { brand }: TitleParts): string =>
    clamp(`${origin} to ${destination} Packers and Movers – ${brand}`, TITLE_MAX),

  guide: (headline: string): string => clamp(headline, TITLE_MAX),
};

/**
 * Data-driven meta description. Returns undefined when the required figures are
 * missing, so the caller omits the tag rather than shipping a padded duplicate.
 */
export function cityServiceMeta(input: {
  service: string;
  locality: string;
  priceFrom?: number;
  jobs12m?: number;
  onTimePct?: number;
}): string | undefined {
  const { service, locality, priceFrom, jobs12m, onTimePct } = input;
  if (priceFrom == null || jobs12m == null || onTimePct == null) return undefined;
  const text = `${service} in ${locality} from ₹${priceFrom.toLocaleString('en-IN')}. ${jobs12m} moves completed in ${locality}, ${onTimePct}% on time. Fixed quote, no surprises.`;
  return withinBudget(text) ? text : clamp(text, META_MAX);
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

function withinBudget(text: string): boolean {
  return text.length >= META_MIN && text.length <= META_MAX;
}
