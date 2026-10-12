/**
 * The seasons a "best time to shift" list names - "Summer (April to June)", "Monsoon (July
 * to September)", "Winter fog (December to January)" - as month spans, for the season
 * strip (components/g/SeasonStrip.astro). Read from each item's own title, so the strip
 * always says exactly what the copy says; a list with fewer than two dated seasons gets no
 * strip.
 */
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface Season {
  /** "Winter fog" - the title without its bracketed months. */
  name: string;
  /** Month indexes, 0 = January, in calendar order of the span (may wrap the year). */
  months: number[];
  /** The band's colour family. */
  tone: 'heat' | 'rain' | 'fog' | 'festive' | 'brand';
}

const M = MONTHS.join('|');
const SPAN = new RegExp(`\\b(${M})\\b(?:\\s*(?:to|and|-|–)\\s*\\b(${M})\\b)?`, 'i');
const idx = (name: string): number =>
  MONTHS.findIndex((m) => m.toLowerCase() === name.toLowerCase());

const toneOf = (name: string): Season['tone'] =>
  /summer|heat|hot/i.test(name)
    ? 'heat'
    : /monsoon|rain/i.test(name)
      ? 'rain'
      : /winter|fog|cold/i.test(name)
        ? 'fog'
        : /wedding|festival|navratri|diwali|mela|semester|possession/i.test(name)
          ? 'festive'
          : 'brand';

export function seasonsOf(items: [string, string][]): Season[] | null {
  const out: Season[] = [];
  for (const [title] of items) {
    const m = SPAN.exec(title);
    if (!m) continue;
    const a = idx(m[1]!);
    const b = m[2] ? idx(m[2]) : a;
    const months: number[] = [];
    for (let k = a; ; k = (k + 1) % 12) {
      months.push(k);
      if (k === b || months.length > 12) break;
    }
    const name = title.replace(/\s*\([^)]*\)\s*/g, ' ').trim() || title;
    out.push({ name, months, tone: toneOf(title) });
  }
  return out.length >= 2 ? out : null;
}
