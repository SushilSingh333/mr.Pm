/**
 * Move the in-repo blog posts into the CMS `posts` collection so editors own them.
 *
 * The five posts in `apps/web/src/data/blog.ts` are FALLBACK_POSTS: they render when
 * the manifest carries no CMS posts, which keeps the blog populated on a fresh install.
 * That is why articles appear on the site while the CMS blog list looks empty. This
 * script imports them once, matching slug for slug, after which the site serves the CMS
 * copy (the merge in blog.ts drops a fallback whose slug a CMS post has taken) and every
 * edit happens in the admin.
 *
 * Safe by design:
 *   - Idempotent: a slug that already exists is skipped, never overwritten, so a repeat
 *     run cannot clobber an editor's changes.
 *   - Created through Payload, so slug validation, versions and the build trigger behave
 *     exactly as they would for a hand-written post.
 *   - Bodies are converted to the Lexical shape Payload stores. The HTML in the fallback
 *     file is block level (p, h2, ul, ol, blockquote), so headings and lists survive as
 *     real nodes rather than a wall of text.
 *
 * Usage (from apps/cms):
 *   npx tsx src/scripts/import-blog.ts --dry-run
 *   npx tsx src/scripts/import-blog.ts
 */
import fs from 'node:fs';

const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
for (const rawLine of envFile.split('\n')) {
  const line = rawLine.trim();
  const eq = line.indexOf('=');
  if (!line || line.startsWith('#') || eq < 1) continue;
  const key = line.slice(0, eq).trim();
  if (!/^[A-Z0-9_]+$/.test(key) || process.env[key] !== undefined) continue;
  process.env[key] = line
    .slice(eq + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const { FALLBACK_POSTS } = await import('@mpm/shared/blog-fallback');

const dryRun = process.argv.includes('--dry-run');

type Node = Record<string, unknown>;

const textNode = (text: string, bold = false): Node => ({
  type: 'text',
  text,
  format: bold ? 1 : 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const block = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
  ...extra,
});

/** Strip tags from an inline fragment, decoding the few entities the source uses. */
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert the fallback posts' block-level HTML into Lexical. Only the tags the source
 * actually uses are handled; anything unrecognised degrades to a paragraph so no content
 * is silently dropped.
 */
function htmlToLexical(html: string): unknown {
  const children: Node[] = [];
  const blockRe = /<(h2|h3|p|ul|ol|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(html)) !== null) {
    const tag = match[1]!.toLowerCase();
    const inner = match[2]!;
    if (tag === 'ul' || tag === 'ol') {
      const items: Node[] = [];
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let li: RegExpExecArray | null;
      while ((li = liRe.exec(inner)) !== null) {
        const text = plain(li[1]!);
        if (text) {
          items.push(
            block('listitem', [textNode(text)], { value: items.length + 1, checked: undefined }),
          );
        }
      }
      if (items.length) {
        children.push(
          block('list', items, { listType: tag === 'ol' ? 'number' : 'bullet', start: 1, tag }),
        );
      }
      continue;
    }
    const text = plain(inner);
    if (!text) continue;
    if (tag === 'h2' || tag === 'h3') {
      children.push(block('heading', [textNode(text)], { tag }));
    } else if (tag === 'blockquote') {
      children.push(block('quote', [textNode(text)]));
    } else {
      children.push(block('paragraph', [textNode(text)]));
    }
  }
  if (!children.length) children.push(block('paragraph', [textNode(plain(html))]));
  return {
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  };
}

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: 'posts',
  limit: 500,
  depth: 0,
  draft: true,
  overrideAccess: true,
});
const haveSlugs = new Set(
  (existing.docs as Array<{ slug?: string }>).map((d) => d.slug).filter(Boolean),
);
console.info(`Existing CMS posts: ${haveSlugs.size}`);

let created = 0;
const skipped: string[] = [];

for (const post of FALLBACK_POSTS) {
  if (haveSlugs.has(post.slug)) {
    skipped.push(post.slug);
    continue;
  }
  if (!dryRun) {
    await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        author: post.author,
        publishedDate: post.date,
        readMins: post.readMins,
        tags: post.tags ?? [],
        featured: post.featured ?? false,
        body: htmlToLexical(post.body),
        _status: 'published',
      } as never,
    });
  }
  created += 1;
  console.info(`post + ${post.slug}`);
}

console.info(
  `\n${dryRun ? 'DRY RUN. Nothing written. Would create' : 'Created'}: ${created} post(s). ` +
    `Skipped (already in the CMS): ${skipped.length}${skipped.length ? ` [${skipped.join(', ')}]` : ''}`,
);
console.info(
  'Cover images are not imported (they are static files, not Media records). Attach a ' +
    'cover in the admin if you want a CMS image; until then the post renders without one.',
);
process.exit(0);
