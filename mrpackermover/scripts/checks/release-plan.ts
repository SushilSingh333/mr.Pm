import {
  LIVE_BEFORE_RELEASE,
  LOCALITY_PAGES,
  LOCALITY_REDIRECTS,
  RELEASE_BATCH_SIZE,
  RELEASE_ORDER,
} from '@mpm/shared';
import { fail, type CheckResult } from './load.js';

/**
 * Release plan (geo-pages/release.ts): every locality brief is either already live or in
 * exactly one release batch. A brief in neither would never get a page; a key with no
 * brief would make a batch release nothing.
 */
export function checkReleasePlan(): CheckResult {
  const messages: string[] = [];
  const planned = [...LIVE_BEFORE_RELEASE, ...RELEASE_ORDER];
  const seen = new Set<string>();
  for (const key of planned) {
    if (seen.has(key)) messages.push(`"${key}" is in the release plan twice.`);
    seen.add(key);
    if (!LOCALITY_PAGES[key]) messages.push(`"${key}" is in the release plan but has no brief.`);
  }
  for (const key of Object.keys(LOCALITY_PAGES)) {
    if (LOCALITY_REDIRECTS[key]) continue;
    if (!seen.has(key))
      messages.push(`"${key}" has a brief but no release batch (add it to a queue in release.ts).`);
  }
  const result = fail('release-plan', messages);
  if (result.ok)
    result.messages.push(
      `(${LIVE_BEFORE_RELEASE.length} live, ${RELEASE_ORDER.length} in ${Math.ceil(RELEASE_ORDER.length / RELEASE_BATCH_SIZE)} batches)`,
    );
  return result;
}
