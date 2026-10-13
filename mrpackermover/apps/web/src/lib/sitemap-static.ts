import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { manifest } from '../data/manifest.js';
import { POSTS } from '../data/blog.js';
import { isPathHidden } from './page.js';

/**
 * The pages built straight from the site's code (About, Pricing, Claims, the blog...),
 * for the core sitemap. The manifest only carries the pages the CMS generates (cities,
 * areas, services), so before this list existed none of these were in any sitemap.
 *
 * Each page's lastmod is the later of two real dates: the last commit to its source file
 * and its last CMS edit (Pages, or the post itself). No date is ever made up: a build
 * without git history (a bare copy of the files) leaves lastmod out, which the protocol
 * allows, rather than stamping the build time on every page.
 *
 * Pages that are never indexed stay out: the thank-you page and the 404 always, and an
 * editorial page the CMS has unpublished (Licences, Team, Track) for as long as it is.
 */
interface StaticPage {
  path: string;
  /** Source file under src/pages. */
  file: string;
  /** Pages → key, when the page has CMS copy. */
  key?: string;
}

const PAGES: StaticPage[] = [
  { path: '/services', file: 'services/index.astro' },
  { path: '/pricing', file: 'pricing.astro', key: 'pricing' },
  { path: '/get-quote', file: 'get-quote.astro' },
  { path: '/company/about', file: 'company/about.astro', key: 'about' },
  { path: '/company/contact', file: 'company/contact.astro' },
  { path: '/company/careers', file: 'company/careers.astro' },
  { path: '/company/licences', file: 'company/licences.astro', key: 'licences' },
  { path: '/company/team', file: 'company/team.astro', key: 'team' },
  { path: '/verify', file: 'verify.astro' },
  { path: '/claims', file: 'claims.astro', key: 'claims' },
  { path: '/insurance', file: 'insurance.astro', key: 'insurance' },
  { path: '/protection', file: 'protection.astro', key: 'protection' },
  { path: '/fraud-check', file: 'fraud-check.astro', key: 'fraud-check' },
  { path: '/corporate', file: 'corporate.astro' },
  { path: '/raise-a-complaint', file: 'raise-a-complaint.astro', key: 'raise-a-complaint' },
  { path: '/terms', file: 'terms.astro', key: 'terms' },
  { path: '/privacy', file: 'privacy.astro', key: 'privacy' },
  { path: '/blog', file: 'blog/index.astro' },
];

// From the working directory, not import.meta.url: at build time this module runs from
// a bundled chunk under dist/, where a path relative to it points at nothing. The build
// always runs in apps/web (pnpm --filter @mpm/web build).
const PAGES_DIR = path.resolve(process.cwd(), 'src', 'pages');

/** The last commit date of a file, or undefined when git or its history is not there. */
function committedAt(file: string): string | undefined {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      cwd: PAGES_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? new Date(out).toISOString() : undefined;
  } catch {
    return undefined;
  }
}

const latest = (...dates: (string | undefined)[]): string | undefined =>
  dates
    .filter((d): d is string => Boolean(d))
    .reduce<string | undefined>((a, b) => (!a || b > a ? b : a), undefined);

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export function staticSitemapEntries(): SitemapEntry[] {
  const m = manifest();
  const origin = m.siteOrigin.replace(/\/$/, '');
  // The posts the blog shows: CMS posts plus any built-in ones they have not replaced.
  const posts = POSTS;
  const postDate = (p: (typeof posts)[number]): string | undefined => latest(p.date, p.updatedAt);

  const pages = PAGES.filter((p) => !isPathHidden(p.path)).map((p) => {
    const cms = p.key ? m.editorial?.[p.key]?.updatedAt : undefined;
    // The blog index changes whenever a post does.
    const extra = p.path === '/blog' ? latest(...posts.map(postDate)) : undefined;
    return { loc: `${origin}${p.path}`, lastmod: latest(committedAt(p.file), cms, extra) };
  });
  const articles = posts.map((p) => ({
    loc: `${origin}/blog/${p.slug}`,
    lastmod: postDate(p),
  }));
  return [...pages, ...articles];
}
