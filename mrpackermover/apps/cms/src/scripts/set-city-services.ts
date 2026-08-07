/**
 * One-off: default every existing city to offer all (non-corporate) services, so the
 * `servicesOffered` picker is pre-filled and every service gets a city page out of the
 * box. Editors then deselect any a given city doesn't do. Non-destructive — it only sets
 * the new field and keeps each city published. Run: `pnpm --filter @mpm/cms set-city-services`.
 */
import { getPayload } from 'payload';
import config from '../payload.config.js';

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: 'services',
    limit: 200,
    pagination: false,
    overrideAccess: true,
  });
  const serviceIds = services.docs.filter((s) => !s.isCorporate).map((s) => s.id);

  const cities = await payload.find({
    collection: 'locations',
    where: { type: { equals: 'city' } },
    limit: 500,
    pagination: false,
    overrideAccess: true,
  });

  let n = 0;
  for (const city of cities.docs) {
    await payload.update({
      collection: 'locations',
      id: city.id,
      overrideAccess: true,
      data: { servicesOffered: serviceIds, _status: 'published' } as never,
    });
    n++;
  }
  console.info(`Set servicesOffered on ${n} cities → ${serviceIds.length} services each`);
  process.exit(0);
}

main().catch((error) => {
  console.error('set-city-services failed:', error);
  process.exit(1);
});
