import fs from 'node:fs';
import { listDistHtml, fail, type CheckResult } from './load.js';

/**
 * Structured-data gate G10 (Doc 02 §8, ADR-0004). We publish no premises, so any
 * MovingCompany / LocalBusiness entity or a self-serving AggregateRating on the
 * Organization is fabricated — exactly what triggers a spam action. This scans the
 * built HTML (if present) and fails the build if any banned entity appears.
 */
const BANNED = ['"MovingCompany"', '"LocalBusiness"'];

export function checkBannedEntities(): CheckResult {
  const files = listDistHtml();
  if (files.length === 0) {
    return { name: 'banned-entities', ok: true, messages: ['(skipped — no dist build present)'] };
  }
  const messages: string[] = [];
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    // Only inspect JSON-LD blocks.
    const blocks = [
      ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ].map((m) => m[1] ?? '');
    const ld = blocks.join('\n');
    for (const bad of BANNED) {
      if (ld.includes(bad)) messages.push(`${file}: contains banned entity ${bad}`);
    }
    if (/"@type"\s*:\s*"Organization"[\s\S]*"aggregateRating"/i.test(ld)) {
      messages.push(`${file}: AggregateRating on Organization is not allowed`);
    }
  }
  return fail('banned-entities', messages);
}
