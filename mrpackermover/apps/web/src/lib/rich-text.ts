/**
 * The small text format the service pages are written in (packages/shared/src/service-pages):
 * a blank line starts a paragraph, `[words](/path)` is a link. Turned into HTML here, with
 * everything escaped first - the text can come from the CMS, so nothing in it is trusted
 * as markup.
 *
 * Only links the site can vouch for become links: its own paths, WhatsApp and the phone.
 * Anything else keeps its words and loses the link, so a typo in the CMS can never send a
 * customer somewhere we did not mean.
 */
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

/** One line of text, links resolved. */
export function inlineHtml(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [all, label, href] = m as unknown as [string, string, string];
    out += escape(text.slice(last, m.index));
    if (SITE.test(href)) out += `<a href="${escape(href)}">${escape(label)}</a>`;
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
