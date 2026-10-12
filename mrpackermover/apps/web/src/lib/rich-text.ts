/**
 * The small text format the service pages are written in (packages/shared/src/service-pages):
 * a blank line starts a paragraph, `[words](/path)` is a link. Turned into HTML here, with
 * everything escaped first - the text can come from the CMS, so nothing in it is trusted
 * as markup.
 *
 * Only links the site can vouch for become links: its own paths, WhatsApp and the phone.
 * Anything else keeps its words and loses the link, so a typo in the CMS can never send a
 * customer somewhere we did not mean.
 *
 * A link to a place page (/packers-and-movers/…) also needs that page to be in this build.
 * New locality pages go live a batch at a time (geo-pages/release.ts), so the text on a
 * live page can name an area whose page is not out yet: its words show, unlinked, and
 * become a link in the build that releases it. No 404s in between.
 */
import { manifest } from '../data/manifest.js';

const escape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const SITE = /^\/(?!\/)/;
const OUTSIDE = /^(https:\/\/wa\.me\/|tel:)/;
const PLACE = /^\/packers-and-movers\//;

let livePaths: { from: object; paths: Set<string> } | null = null;
/** Whether a site path can be linked: any page, but a place page only once it is built. */
function linkable(href: string): boolean {
  if (!PLACE.test(href)) return true;
  const m = manifest();
  if (livePaths?.from !== m) livePaths = { from: m, paths: new Set(m.pages.map((r) => r.path)) };
  return livePaths.paths.has(href.replace(/[?#].*$/, '').replace(/\/$/, ''));
}

/** One line of text, links resolved. */
export function inlineHtml(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [all, label, href] = m as unknown as [string, string, string];
    out += escape(text.slice(last, m.index));
    if (SITE.test(href) && linkable(href)) out += `<a href="${escape(href)}">${escape(label)}</a>`;
    else if (OUTSIDE.test(href))
      out += `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
    else out += escape(label);
    last = (m.index ?? 0) + all.length;
  }
  return out + escape(text.slice(last));
}

/** A text block, one HTML string per paragraph. */
export const paragraphsHtml = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(inlineHtml);
