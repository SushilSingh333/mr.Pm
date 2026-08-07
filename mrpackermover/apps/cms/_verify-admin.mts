import { getPayload } from 'payload';
import config from './src/payload.config.js';
const payload = await getPayload({ config });
try {
  await payload.delete({ collection: 'users', where: { email: { equals: 'temp-verify@mpm.local' } }, overrideAccess: true } as never);
} catch {}
await payload.create({ collection: 'users', data: { email: 'temp-verify@mpm.local', password: 'Verify!2026x', role: 'admin' }, overrideAccess: true } as never);
console.log('temp admin ready');
process.exit(0);
