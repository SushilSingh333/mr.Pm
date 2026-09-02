import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listDistHtml, fail, type CheckResult } from './load.js';

const LOADER = /<script[^>]+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([^"]+)"/g;
const CONFIG = /gtag\('config',\s*'([^']+)'\)/g;
const VERIFY = /<meta name="google-site-verification" content="([^"]+)"/g;

/**
 * Head-tag coverage. Every built page must carry exactly one Google tag, and all
 * pages must carry the same measurement ID. A new page that forgets BaseLayout —
 * or hand-rolls its own <head>, the way 404.astro does — silently stops reporting,
 * and nobody notices until a month of traffic is missing. This gate catches it at
 * build time instead.
 *
 * Also guards the Search Console ownership meta, which Google warns must stay put
 * "even after verification succeeds" — drop it and the property silently unverifies,
 * taking the Search Console data with it.
 *
 * Runs on dist, so it covers manifest-generated routes (cities, localities,
 * services, lanes) as well as hand-written pages.
 */
export function checkHeadTags(): CheckResult {
  const files = listDistHtml();
  if (files.length === 0) {
    return { name: 'head-tags', ok: true, messages: ['(skipped — no dist build present)'] };
  }
  const messages: string[] = [];
  const ids = new Set<string>();
  const tokens = new Set<string>();

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    const verify = [...html.matchAll(VERIFY)].map((m) => m[1]);
    if (verify.length === 0) messages.push(`${rel}: no google-site-verification meta.`);
    for (const token of verify) tokens.add(token);

    const loaders = [...html.matchAll(LOADER)].map((m) => m[1]);
    const configs = [...html.matchAll(CONFIG)].map((m) => m[1]);

    if (loaders.length === 0) {
      messages.push(`${rel}: no Google tag — does the page use BaseLayout?`);
      continue;
    }
    // Google: "Don't add more than one Google tag to each page."
    if (loaders.length > 1) messages.push(`${rel}: ${loaders.length} Google tags — expected 1.`);
    if (!configs.includes(loaders[0])) {
      messages.push(`${rel}: loads ${loaders[0]} but never calls gtag('config', …) for it.`);
    }
    for (const id of loaders) ids.add(id);
  }

  if (tokens.size > 1) {
    messages.push(`Pages disagree on the verification token: ${[...tokens].sort().join(', ')}`);
  }
  if (ids.size > 1) {
    messages.push(`Pages disagree on the measurement ID: ${[...ids].sort().join(', ')}`);
  }
  return fail('head-tags', messages);
}
