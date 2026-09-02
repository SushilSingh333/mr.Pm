/**
 * CI quality gates (Doc 02 §11). Any red fails the build. Run: `pnpm check`.
 *
 * These are the checks that keep this site on the right side of Google's scaled-
 * content policy: manifest-derived canonicals + sitemaps, the ≥3-inbound-links
 * assertion, the duplication ceiling, the no-catch-all rule, and the banned-entity
 * scan. Structural checks run on the manifest offline; HTML checks run when a dist
 * build is present (they self-skip otherwise, and the deploy workflow always builds).
 */
import { checkCanonicals } from './checks/canonicals.js';
import { checkSitemapParity } from './checks/sitemap-parity.js';
import { checkInboundLinks } from './checks/inbound-links.js';
import { checkDuplication } from './checks/duplication.js';
import { checkCatchAll } from './checks/catchall.js';
import { checkBannedEntities } from './checks/banned-entities.js';
import { checkStatusCodes } from './checks/status-codes.js';
import { checkHeadTags } from './checks/head-tags.js';
import type { CheckResult } from './checks/load.js';

const checks: Array<() => CheckResult> = [
  checkCanonicals,
  checkSitemapParity,
  checkInboundLinks,
  checkDuplication,
  checkCatchAll,
  checkStatusCodes,
  checkHeadTags,
  checkBannedEntities,
];

let failed = 0;
for (const run of checks) {
  const result = run();
  if (result.ok) {
    const note = result.messages[0] ?? '';
    console.info(`  ✓ ${result.name} ${note}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${result.name}`);
    for (const msg of result.messages) console.error(`      • ${msg}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} gate(s) failed.`);
  process.exit(1);
}
console.info('\nAll CI gates green.');
