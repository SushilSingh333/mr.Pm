/**
 * Put the team on /company/team and make the page live (16-17 Oct 2026, from the owner):
 *
 *   Sachin Chaudhary   Founder            Leadership
 *   Akash Singh        Co-founder         Leadership
 *   Akib Javed         Sales Head         Sales
 *   Sanoj Kumar        Sales Executive    Sales
 *
 * Each person is a `people` record with "Show on the public team page" ticked; after this
 * everything is edited in the CMS (Content -> People), photos included. The founder is
 * matched by job title, so the old "Sachin Kumar" record is renamed rather than left
 * beside the new one. A description already written in the CMS is kept unless --force.
 *
 * It also publishes the "Our team" editorial page if it is a draft (a draft page is
 * hidden from the menus and noindexed).
 *
 * Shows the plan and changes nothing unless `--apply` is given:
 *
 *   pnpm --filter @mpm/cms set-team               # dry run
 *   pnpm --filter @mpm/cms set-team -- --apply    # do it
 *   pnpm --filter @mpm/cms set-team -- --apply --force   # also overwrite descriptions
 *
 * Then rebuild the site (deploy.sh) for the page to change.
 */
import fs from 'node:fs';

// tsx does not load apps/cms/.env the way Next does, and the Payload config reads the
// environment when it is imported - so load the file first, then import (the same as
// build-manifest.ts). Real environment variables always win.
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

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const { isFounderRole } = await import('@mpm/shared');

interface Member {
  name: string;
  role: string;
  teamGroup: 'leadership' | 'sales';
  teamOrder: number;
  bio: string;
}

const TEAM: Member[] = [
  {
    name: 'Sachin Chaudhary',
    role: 'Founder',
    teamGroup: 'leadership',
    teamOrder: 1,
    bio: 'Started MrMoverPacker after 15 years in the moving trade. Sets how every move is quoted, packed and handed over, and answers for it.',
  },
  {
    name: 'Akash Singh',
    role: 'Co-founder',
    teamGroup: 'leadership',
    teamOrder: 2,
    bio: 'Co-founded MrMoverPacker with Sachin. Looks after how the company runs day to day, so every move goes out the way it was promised.',
  },
  {
    name: 'Akib Javed',
    role: 'Sales Head',
    teamGroup: 'sales',
    teamOrder: 1,
    bio: 'Leads the sales team. Makes sure every enquiry gets a call back, a clear plan and a fixed, written quote.',
  },
  {
    name: 'Sanoj Kumar',
    role: 'Sales Executive',
    teamGroup: 'sales',
    teamOrder: 2,
    bio: 'Often your first call. Listens to what you are moving and when, then turns it into a fixed, written quote.',
  },
];

type PersonDoc = {
  id: string | number;
  name?: string;
  role?: string;
  bio?: string | null;
  showOnTeam?: boolean;
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const force = args.includes('--force');
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'people',
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const people = docs as unknown as PersonDoc[];
  const used = new Set<string>();
  const key = (s?: string) => (s ?? '').trim().toLowerCase();

  for (const m of TEAM) {
    // Same name first; for the founder, whoever holds the "Founder" title.
    const match =
      people.find((p) => !used.has(String(p.id)) && key(p.name) === key(m.name)) ??
      (isFounderRole(m.role)
        ? people.find((p) => !used.has(String(p.id)) && isFounderRole(p.role))
        : undefined);
    const data: Record<string, unknown> = {
      name: m.name,
      role: m.role,
      showOnTeam: true,
      teamGroup: m.teamGroup,
      teamOrder: m.teamOrder,
    };
    if (!match || force || !match.bio?.trim()) data.bio = m.bio;

    if (match) {
      used.add(String(match.id));
      const renamed = key(match.name) !== key(m.name) ? ` (was "${match.name}")` : '';
      console.log(`update  ${m.name} - ${m.role}${renamed}${data.bio ? '' : ', description kept'}`);
      if (apply) {
        await payload.update({
          collection: 'people',
          id: match.id,
          data: data as never,
          overrideAccess: true,
        });
      }
    } else {
      console.log(`create  ${m.name} - ${m.role}`);
      if (apply)
        await payload.create({ collection: 'people', data: data as never, overrideAccess: true });
    }
  }

  // The "Our team" editorial page: publish it if it is a draft.
  const pages = await payload.find({
    collection: 'pages',
    where: { key: { equals: 'team' } },
    draft: true,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const page = pages.docs[0] as
    { id: string | number; _status?: string; title?: string } | undefined;
  if (!page) {
    console.log(
      'page    no "Our team" editorial page in the CMS: /company/team is live with its built-in copy',
    );
  } else if (page._status === 'published') {
    console.log('page    "Our team" is already published');
  } else {
    console.log('publish "Our team" page (was a draft)');
    if (apply) {
      await payload.update({
        collection: 'pages',
        id: page.id,
        data: { _status: 'published' } as never,
        overrideAccess: true,
      });
    }
  }

  console.log(
    apply
      ? '\nDone. Rebuild the site to publish it.'
      : '\nDry run: nothing changed. Add -- --apply to do it.',
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
