/**
 * Set the registered business details (Settings → Organisation profile) that the footer,
 * the contact and licences pages, the terms and the Organization schema all read. The
 * same as editing them in the admin, in one checked command: the GSTIN is validated (all 15
 * characters and the check character) before anything is saved.
 *
 * Shows what it would change, and saves only with --apply:
 *
 *   npx tsx src/scripts/set-org-profile.ts --gstin 09ACIFM6261F1Z1 \
 *     --legal-name "<name exactly as on the GST certificate>" --trade-name "<trade name>" \
 *     --office "<principal place of business, as on the certificate>" \
 *     --cin "" --sla "First response within 24 hours." --apply
 *
 * A flag left out keeps its current value. `--cin ""` clears the CIN (a partnership firm
 * or proprietorship has none). Afterwards, rebuild the site (bash deploy/deploy.sh), or
 * wait for the publish hook to do it.
 */
import fs from 'node:fs';
import { isValidGstin } from '@mpm/seo/jsonld';

const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
for (const rawLine of envFile.split('\n')) {
  const line = rawLine.trim();
  const eq = line.indexOf('=');
  if (!line || line.startsWith('#') || eq < 1) continue;
  const key = line.slice(0, eq).trim();
  if (!/^[A-Z0-9_]+$/.test(key) || process.env[key] !== undefined) continue;
  process.env[key] = line
    .slice(eq + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : (args[i + 1] ?? '');
};
const apply = args.includes('--apply');

const wanted: Record<string, string | undefined> = {
  gstin: flag('gstin')?.trim().toUpperCase(),
  legalName: flag('legal-name')?.trim(),
  tradeName: flag('trade-name')?.trim(),
  registeredOffice: flag('office')?.trim(),
  cin: flag('cin')?.trim(),
  complaintSla: flag('sla')?.trim(),
};
if (wanted.gstin !== undefined && !isValidGstin(wanted.gstin)) {
  console.error(
    `✗ "${wanted.gstin}" is not a valid GSTIN (format or check character). Nothing saved.`,
  );
  process.exit(1);
}

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const payload = await getPayload({ config });
const current = (await payload.findGlobal({
  slug: 'org-profile' as never,
  overrideAccess: true,
})) as Record<string, unknown>;

const data: Record<string, string> = {};
for (const [field, value] of Object.entries(wanted)) {
  if (value === undefined) continue;
  const was = (current[field] as string | undefined) ?? '';
  console.info(`${field.padEnd(17)} ${JSON.stringify(was)}  →  ${JSON.stringify(value)}`);
  if (value !== was) data[field] = value;
}
if (!Object.keys(data).length) {
  console.info('\nNothing to change.');
  process.exit(0);
}
if (!apply) {
  console.info('\nDRY RUN. Add --apply to save.');
  process.exit(0);
}
await payload.updateGlobal({
  slug: 'org-profile' as never,
  data: data as never,
  overrideAccess: true,
});
console.info(
  `\nSaved ${Object.keys(data).length} field(s). Rebuild the site: bash deploy/deploy.sh`,
);
process.exit(0);
