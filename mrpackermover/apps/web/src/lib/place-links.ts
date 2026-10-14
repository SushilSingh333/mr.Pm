import type { GeoPage, LocalityData, ServiceBlock } from '@mpm/shared';
import { rowsOfType, dataOf } from '../data/manifest.js';
import { FEATURE, isChecklist } from './section-shapes.js';

/**
 * Link the city's live area pages wherever the page names them.
 *
 * The city, area and city × service texts were written while area pages were still being
 * released a batch at a time (geo-pages/release.ts), so they link only the areas that were
 * live then: the Delhi zones table named Saket, Greater Kailash and Hauz Khas as plain text
 * long after their pages went live. Instead of hand-linking every text (and its CMS copy)
 * after each batch, the page links itself: in each section, the first time it names an
 * area of the same city that has a live page, the name becomes a link. A page that goes
 * live is in the next build's manifest, so its name lights up everywhere on that build,
 * and a name the CMS adds later is linked the same way.
 *
 * Only area pages that are built (they come from the manifest), never the page itself,
 * and never inside a link the text already has. Once per section, so a name repeated in
 * one paragraph is not a run of identical links.
 */
interface Place {
  name: string;
  href: string;
  re: RegExp;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LINK = /\[[^\]]+\]\([^)\s]+\)/g;

/** The live area pages of a city, longest name first ("Greater Kailash" before "Kailash"). */
function placesOf(citySlug: string, selfPath?: string): Place[] {
  return rowsOfType('locality')
    .filter((r) => r.slug.startsWith(`${citySlug}/`) && r.path !== selfPath)
    .map((r) => {
      const name = dataOf<LocalityData>(r).localityName;
      // A whole name only: "Sector 6" must not light up inside "Sector 62".
      return { name, href: r.path, re: new RegExp(`(?<![\\w-])${escapeRe(name)}(?![\\w-])`) };
    })
    .sort((a, b) => b.name.length - a.name.length);
}

/** Link the first mention of each place not yet linked in this section. */
function linkText(text: string, places: Place[], done: Set<string>): string {
  let out = text;
  for (const p of places) {
    if (done.has(p.href)) continue;
    // Search only the stretches outside existing [label](href) links.
    let result = '';
    let last = 0;
    let linked = false;
    for (const m of out.matchAll(LINK)) {
      const before = out.slice(last, m.index);
      if (!linked && p.re.test(before)) {
        result += before.replace(p.re, (hit) => `[${hit}](${p.href})`);
        linked = true;
      } else result += before;
      result += m[0];
      last = (m.index ?? 0) + m[0].length;
    }
    const tail = out.slice(last);
    if (!linked && p.re.test(tail)) {
      result += tail.replace(p.re, (hit) => `[${hit}](${p.href})`);
      linked = true;
    } else result += tail;
    out = result;
    if (linked) done.add(p.href);
  }
  return out;
}

function linkBlock(b: ServiceBlock, places: Place[], done: Set<string>): ServiceBlock {
  const t = (s: string): string => linkText(s, places, done);
  switch (b.kind) {
    case 'text':
      return { ...b, body: t(b.body) };
    case 'list':
      // A feature tile's name is plain text (and a bracket in it would stop the list being
      // tiles at all), so only the text after the name is linked.
      return {
        ...b,
        items: b.items.map((item) => {
          const m = FEATURE.exec(item);
          return m ? item.slice(0, item.length - m[2]!.length) + t(m[2]!) : t(item);
        }),
      };
    case 'steps':
      return { ...b, items: b.items.map((i) => ({ title: i.title, body: t(i.body) })) };
    case 'table':
      // A checklist prints its chips as plain text inside the tick label: leave it alone.
      return isChecklist(b) ? b : { ...b, rows: b.rows.map((r) => r.map(t)) };
    default:
      return b;
  }
}

/** Where a link to this href is already written in a block, it counts as done. */
const linkedIn = (b: ServiceBlock): string[] => {
  const text =
    b.kind === 'text'
      ? b.body
      : b.kind === 'list'
        ? b.items.join('\n')
        : b.kind === 'steps'
          ? b.items.map((i) => i.body).join('\n')
          : b.kind === 'table'
            ? b.rows.flat().join('\n')
            : '';
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => (m[1] ?? '').replace(/[?#].*$/, ''));
};

/** The page with its city's live area pages linked, section by section. */
export function withPlaceLinks(page: GeoPage, citySlug: string, selfPath?: string): GeoPage {
  const places = placesOf(citySlug, selfPath);
  if (!places.length) return page;
  return {
    ...page,
    sections: page.sections.map((s) => {
      const done = new Set(s.blocks.flatMap(linkedIn));
      return { ...s, blocks: s.blocks.map((b) => linkBlock(b, places, done)) };
    }),
  };
}
