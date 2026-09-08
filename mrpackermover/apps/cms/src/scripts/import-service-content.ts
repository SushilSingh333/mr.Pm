/**
 * Fill the national service pages with their own prose.
 *
 * The seven `/services/<slug>` pages carried a one-line summary, an inclusions list
 * and a city list, and nothing written for the service itself. This loads the
 * paragraphs in `data/service-content.json` into each service's `editorialNote`, which
 * the manifest exposes as `ServiceHubData.editorial` and the page renders above the
 * generic trust band.
 *
 * Safe by design:
 *   - Matched by slug. A slug with no entry in the JSON is left alone.
 *   - Skips any service that already has an editorialNote, so a rerun cannot overwrite
 *     an editor's rewrite. Pass --force to replace it deliberately.
 *   - Written through Payload, so versions and the build trigger behave exactly as they
 *     would for a hand-typed edit.
 *
 * Usage (from apps/cms):
 *   npx tsx src/scripts/import-service-content.ts --dry-run
 *   npx tsx src/scripts/import-service-content.ts
 *   npx tsx src/scripts/import-service-content.ts --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const here = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.join(here, 'data', 'service-content.json');
const content: Record<string, string[]> = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

/** Plain paragraphs into the Lexical shape Payload stores for a richText field. */
function paragraphsToLexical(paragraphs: string[]): unknown {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  };
}

/** True when the stored richText has no actual words in it. */
function isEmpty(node: unknown): boolean {
  const text = JSON.stringify(node ?? '')
    .replace(/[^A-Za-z]/g, '')
    .trim();
  return text.length === 0;
}

const payload = await getPayload({ config });

const services = await payload.find({
  collection: 'services',
  limit: 200,
  depth: 0,
  draft: true,
  overrideAccess: true,
});

type ServiceDoc = { id: string | number; slug?: string; name?: string; editorialNote?: unknown };
const docs = services.docs as ServiceDoc[];
console.info(`Services in the CMS: ${docs.length}`);

let updated = 0;
const skipped: string[] = [];
const unmatched: string[] = [];

for (const service of docs) {
  const slug = service.slug ?? '';
  const paragraphs = content[slug];
  if (!paragraphs) {
    unmatched.push(slug || String(service.id));
    continue;
  }
  if (!isEmpty(service.editorialNote) && !force) {
    skipped.push(slug);
    continue;
  }
  if (!dryRun) {
    await payload.update({
      collection: 'services',
      id: service.id,
      overrideAccess: true,
      data: { editorialNote: paragraphsToLexical(paragraphs) } as never,
    });
  }
  updated += 1;
  const words = paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0);
  console.info(`service ~ ${slug} (${paragraphs.length} paragraphs, ${words} words)`);
}

console.info(
  `\n${dryRun ? 'DRY RUN. Nothing written. Would update' : 'Updated'}: ${updated} service(s). ` +
    `Skipped (already written, use --force to replace): ${skipped.length}` +
    `${skipped.length ? ` [${skipped.join(', ')}]` : ''}. ` +
    `No content authored for: ${unmatched.length}${unmatched.length ? ` [${unmatched.join(', ')}]` : ''}.`,
);
process.exit(0);
