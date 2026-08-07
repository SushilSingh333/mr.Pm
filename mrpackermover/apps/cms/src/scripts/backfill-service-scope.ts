/**
 * One-off: fill in `inclusions`/`exclusions` on existing services from SERVICE_SCOPE,
 * so every city × service page shows a real "what's included / what costs extra" block
 * instead of the built-in fallback. Non-destructive — skips a service that already has
 * inclusions set (so it never overwrites edits made in the CMS). Keeps each published.
 * Run: `pnpm --filter @mpm/cms backfill-service-scope`.
 */
import { getPayload } from 'payload';
import config from '../payload.config.js';
import { SERVICE_SCOPE } from '../data/service-scope.js';

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: 'services',
    limit: 200,
    pagination: false,
    overrideAccess: true,
  });

  let n = 0;
  for (const svc of services.docs) {
    const scope = SERVICE_SCOPE[svc.slug];
    if (!scope) continue;
    if ((svc.inclusions?.length ?? 0) > 0) continue; // don't clobber CMS edits
    await payload.update({
      collection: 'services',
      id: svc.id,
      overrideAccess: true,
      data: {
        inclusions: scope.inclusions.map((item) => ({ item })),
        exclusions: scope.exclusions.map((item) => ({ item })),
        _status: 'published',
      } as never,
    });
    n++;
  }
  console.info(`Backfilled inclusions/exclusions on ${n} services`);
  process.exit(0);
}

main().catch((error) => {
  console.error('backfill-service-scope failed:', error);
  process.exit(1);
});
