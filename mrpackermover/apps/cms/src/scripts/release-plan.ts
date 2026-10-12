/**
 * Show the locality release schedule (packages/shared/src/geo-pages/release.ts): which
 * areas are live, which batch comes next and when. Reads LOCALITY_RELEASE_START from
 * apps/cms/.env, the same value the site build uses. Changes nothing.
 *
 *   pnpm --filter @mpm/cms release-plan
 *   pnpm --filter @mpm/cms release-plan -- 2026-10-14     # preview another start date
 */
import fs from 'node:fs';
import { LIVE_BEFORE_RELEASE, LOCALITY_PAGES, releaseBatches } from '@mpm/shared';

const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const fromEnv = /^\s*LOCALITY_RELEASE_START\s*=\s*["']?([^"'\s#]*)/m.exec(envFile)?.[1];
const start =
  process.argv.slice(2).find((a) => a !== '--') ?? process.env.LOCALITY_RELEASE_START ?? fromEnv;

const CITY: Record<string, string> = {
  delhi: 'Delhi',
  noida: 'Noida',
  'greater-noida': 'Greater Noida',
  gurgaon: 'Gurgaon',
  ghaziabad: 'Ghaziabad',
  faridabad: 'Faridabad',
  meerut: 'Meerut',
};
const name = (key: string): string => {
  const city = key.split('/')[0] ?? '';
  return `${LOCALITY_PAGES[key]?.name ?? key} (${CITY[city] ?? city})`;
};
const ist = (d: Date): string =>
  d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const now = Date.now();
console.info(`Start date: ${start || '(not set: nothing new is released)'}\n`);
console.info(`Live before the release (${LIVE_BEFORE_RELEASE.length}):`);
console.info(`  ${LIVE_BEFORE_RELEASE.map(name).join(', ')}\n`);
for (const b of releaseBatches(start)) {
  const status =
    start === 'all' ? 'live' : !b.at ? 'waiting' : b.at.getTime() <= now ? 'live' : 'due';
  const when = b.at ? ist(b.at) : '-';
  console.info(
    `Batch ${String(b.batch).padStart(2)}  ${when.padEnd(24)} ${status.padEnd(8)} ${b.places.map(name).join(', ')}`,
  );
}
