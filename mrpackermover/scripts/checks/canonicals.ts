import { absoluteUrl } from '@mpm/shared';
import { loadManifest, fail, type CheckResult } from './load.js';

/**
 * Canonical parity (Doc 02 §4): every row's canonical is the self-referencing
 * absolute URL derived from siteOrigin + path — never anything else. Also asserts
 * path uniqueness (no two rows may claim the same URL).
 */
export function checkCanonicals(): CheckResult {
  const m = loadManifest();
  const messages: string[] = [];
  const seen = new Set<string>();

  for (const page of m.pages) {
    const expected = absoluteUrl(m.siteOrigin, page.path);
    if (page.canonical !== expected) {
      messages.push(`${page.path}: canonical "${page.canonical}" ≠ expected "${expected}"`);
    }
    if (seen.has(page.path)) messages.push(`Duplicate path in manifest: ${page.path}`);
    seen.add(page.path);
  }
  return fail('canonical-parity', messages);
}
