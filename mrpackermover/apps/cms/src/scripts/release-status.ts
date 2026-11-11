/**
 * Is the locality release finished? Answers for the release timer, which switches itself
 * off once it is (deploy/mrpackermover-release.service).
 *
 * "Finished" means both:
 *   1. no batch is still due - every batch time in geo-pages/release.ts has passed, and
 *   2. the LIVE site has every area page - each released place is in the published
 *      sitemap (DEPLOY_PATH/sitemaps/localities.xml).
 *
 * The second matters: the timer only asks for a rebuild, and a rebuild can fail (deploy.sh
 * keeps the old site live when a gate is red). Switching the timer off the moment the last
 * batch time passed could strand that batch. So after the last batch, each run triggers
 * one more rebuild and checks again; the timer stops only when the pages are really live.
 *
 * Exit codes: 0 finished (the timer may stop), 1 not yet, 2 no schedule set (leave it).
 *
 * Usage:  pnpm --filter @mpm/cms release-status      (reads LOCALITY_RELEASE_START from
 *         apps/cms/.env, DEPLOY_PATH from the environment, default /var/www/mrpackermover)
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  RELEASE_ORDER,
  SUBAREA_RELEASE_ORDER,
  releaseBatches,
  subAreaBatches,
  type ReleaseBatch,
} from '@mpm/shared';

const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
// The LAST assignment wins, as it does for deploy.sh, which sources this file in the shell:
// a date written twice must mean the same thing to the site build and to this check.
const envValue = (name: string): string | undefined =>
  process.env[name] ??
  [...envFile.matchAll(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^"'\\s#]*)`, 'gm'))].at(-1)?.[1];
const start = envValue('LOCALITY_RELEASE_START');
// The second wave (the Khands, geo-pages/release.ts). Unset: not scheduled, so not waited for.
const subStart = envValue('SUBAREA_RELEASE_START');
const subScheduled = Boolean(subStart && (subStart === 'all' || subAreaBatches(subStart)[0]?.at));
const deployPath = process.env.DEPLOY_PATH || '/var/www/mrpackermover';
const sitemap = path.join(deployPath, 'sitemaps', 'localities.xml');

const ist = (d: Date): string =>
  d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

if (!start || (start !== 'all' && !releaseBatches(start)[0]?.at)) {
  console.info('No release schedule (LOCALITY_RELEASE_START is not set): leaving the timer alone.');
  process.exit(2);
}

const now = Date.now();
const pending = (list: ReleaseBatch[], s: string): ReleaseBatch[] =>
  s === 'all' ? [] : list.filter((b) => b.at && b.at.getTime() > now);
const batches = releaseBatches(start);
const subBatches = subScheduled ? subAreaBatches(subStart) : [];
const due = [
  ...pending(batches, start).map((b) => ({ ...b, wave: 'area' })),
  ...(subScheduled ? pending(subBatches, subStart!) : []).map((b) => ({ ...b, wave: 'Khand' })),
].sort((a, b) => a.at!.getTime() - b.at!.getTime());
if (due.length) {
  const next = due[0]!;
  console.info(
    `Not finished: ${due.length} of ${batches.length + subBatches.length} batches still due. Next: ${next.wave} batch ${next.batch} at ${ist(next.at!)} IST.`,
  );
  process.exit(1);
}

let live = '';
try {
  live = fs.readFileSync(sitemap, 'utf8');
} catch {
  console.info(`Every batch time has passed, but the live sitemap is not readable (${sitemap}).`);
  process.exit(1);
}
const released = [...RELEASE_ORDER, ...(subScheduled ? SUBAREA_RELEASE_ORDER : [])];
const missing = released.filter((key) => !live.includes(`/packers-and-movers/${key}</loc>`));
if (missing.length) {
  console.info(
    `Every batch time has passed, but ${missing.length} area page(s) are not live yet (waiting for the rebuild): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`,
  );
  process.exit(1);
}

console.info(
  `Finished: all ${released.length} released area pages are live (${batches.length + subBatches.length} batches)` +
    (subScheduled ? '' : '; the Khand pages are not scheduled (SUBAREA_RELEASE_START is not set)') +
    '. The release timer can stop.',
);
process.exit(0);
