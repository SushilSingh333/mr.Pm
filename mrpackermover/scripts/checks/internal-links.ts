import fs from 'node:fs';
import path from 'node:path';
import { WEB_DIST, listDistHtml, fail, type CheckResult } from './load.js';

/**
 * No dead internal links: every `href="/…"` in the built pages resolves to a file in the
 * build. Locality pages go live in batches, so a link to one that is not out yet would be
 * a 404 on a live page; rich-text drops those, and this gate proves it. Paths the web
 * server answers itself (the CMS admin and API, the Noida Extension redirect) are skipped.
 */
const SERVER_PATHS = /^\/(admin|api)(\/|$)|^\/packers-and-movers\/noida\/noida-extension$/;

export function checkInternalLinks(): CheckResult {
  const files = listDistHtml();
  if (files.length === 0) {
    return { name: 'internal-links', ok: true, messages: ['(skipped — no dist build present)'] };
  }
  const exists = (p: string): boolean => {
    const clean = decodeURIComponent(p.replace(/[?#].*$/, '')).replace(/\/$/, '');
    if (clean === '') return fs.existsSync(path.join(WEB_DIST, 'index.html'));
    const base = path.join(WEB_DIST, clean);
    return (
      fs.existsSync(`${base}.html`) ||
      fs.existsSync(path.join(base, 'index.html')) ||
      (fs.existsSync(base) && fs.statSync(base).isFile())
    );
  };
  const broken = new Map<string, string>();
  let checked = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of html.matchAll(/href="(\/(?!\/)[^"]*)"/g)) {
      const href = m[1]!.replace(/&amp;/g, '&');
      if (SERVER_PATHS.test(href.replace(/[?#].*$/, ''))) continue;
      checked += 1;
      if (!exists(href) && !broken.has(href)) broken.set(href, path.relative(WEB_DIST, file));
    }
  }
  const result = fail(
    'internal-links',
    [...broken].slice(0, 25).map(([href, from]) => `${href} (linked from ${from}) does not exist`),
  );
  if (broken.size > 25) result.messages.push(`…and ${broken.size - 25} more`);
  if (result.ok) result.messages.push(`(${checked} links)`);
  return result;
}
