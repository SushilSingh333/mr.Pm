/**
 * Tell search engines which pages a deploy added or changed, through IndexNow (used by
 * Bing, Yandex, Seznam, Naver and others; Google reads the sitemap instead). Locality
 * pages go live in batches, so each release run reports its five new pages, and the city
 * hubs that gained an area card, within minutes instead of waiting for a crawl.
 *
 * Two steps, run by deploy/deploy.sh:
 *   node scripts/indexnow.mjs diff <live dir> <new dist dir> <out file>
 *       before publishing: compares the live sitemaps with the new ones and writes every
 *       URL that is new or whose lastmod moved to <out file>.
 *   node scripts/indexnow.mjs submit <out file>
 *       after publishing and purging the cache: sends that list.
 *
 * Env: INDEXNOW_KEY - any 8-128 letters, digits or dashes. deploy.sh publishes it as
 * /<key>.txt, which is how the search engines check the ping is ours. Not set ⇒ skipped.
 * Never fails a deploy: a problem here is reported and the deploy carries on.
 */
import fs from 'node:fs';
import path from 'node:path';

const [mode, ...args] = process.argv.slice(2);
const key = (process.env.INDEXNOW_KEY ?? '').trim();

/** url → lastmod, from every sitemap shard under <dir>/sitemaps. */
function readSitemaps(dir) {
  const out = new Map();
  const shardDir = path.join(dir, 'sitemaps');
  if (!fs.existsSync(shardDir)) return out;
  for (const file of fs.readdirSync(shardDir)) {
    if (!file.endsWith('.xml')) continue;
    const xml = fs.readFileSync(path.join(shardDir, file), 'utf8');
    for (const m of xml.matchAll(
      /<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/url>/g,
    ))
      out.set(m[1], m[2] ?? '');
  }
  return out;
}

try {
  if (mode === 'diff') {
    const [liveDir, newDir, outFile] = args;
    const live = readSitemaps(liveDir);
    const next = readSitemaps(newDir);
    const changed = [...next].filter(([url, lastmod]) => live.get(url) !== lastmod).map(([u]) => u);
    fs.writeFileSync(outFile, changed.join('\n'));
    console.info(`IndexNow: ${changed.length} new or changed URL(s) in this build.`);
  } else if (mode === 'submit') {
    const [listFile] = args;
    if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
      console.info(
        'IndexNow: INDEXNOW_KEY not set (or not 8-128 letters/digits/dashes), skipping.',
      );
      process.exit(0);
    }
    const urls = fs.existsSync(listFile)
      ? fs
          .readFileSync(listFile, 'utf8')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (!urls.length) {
      console.info('IndexNow: nothing new to report.');
      process.exit(0);
    }
    const host = new URL(urls[0]).host;
    for (let i = 0; i < urls.length; i += 10_000) {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key,
          keyLocation: `https://${host}/${key}.txt`,
          urlList: urls.slice(i, i + 10_000),
        }),
      });
      // 200 and 202 both mean accepted.
      if (res.status === 200 || res.status === 202)
        console.info(`IndexNow: reported ${Math.min(10_000, urls.length - i)} URL(s).`);
      else console.warn(`IndexNow: HTTP ${res.status} ${await res.text().catch(() => '')}`);
    }
  } else {
    console.warn('Usage: indexnow.mjs diff <live dir> <new dir> <out file> | submit <out file>');
  }
} catch (err) {
  console.warn('IndexNow: skipped after an error:', err instanceof Error ? err.message : err);
}
