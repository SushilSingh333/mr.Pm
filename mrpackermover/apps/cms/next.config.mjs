import { withPayload } from '@payloadcms/next/withPayload';

/**
 * The admin keeps India time, whatever clock the machine it runs on keeps.
 *
 * The droplet runs in UTC and every person using the admin is in IST, 5h30 apart. Every
 * date the server renders was therefore in the wrong zone: tooltips said 8:30 AM for a
 * 2:00 PM lead, "Today" rolled over at 5:30 in the morning, and - the one that mattered -
 * the schedule decides "today", "tomorrow" and the two-day notice in CALENDAR DAYS, so a
 * move booked for 2 AM on the 26th was counted as the 25th and flagged a day early.
 *
 * Set here, before anything runs, because this file is loaded by the same process that
 * serves the admin - so it takes effect on the next deploy with no step on the server.
 * Node applies a TZ assigned at runtime to every Date made after it. `??=` leaves a zone
 * set by the environment alone. Stored timestamps are unaffected: Postgres keeps them in
 * UTC with their offset, and only how they are read out as days and hours changes.
 */
process.env.TZ ??= 'Asia/Kolkata';

/**
 * `next dev` and `next build` both wrote to `.next`, so running a build (directly, or
 * via `turbo run build` / `pnpm check`) while the dev server was up overwrote the
 * chunks dev was serving. Dev then threw MODULE_NOT_FOUND out of
 * `.next/server/pages/_document.js` and every admin route and API route 500'd until
 * `.next` was deleted and the server restarted.
 *
 * Giving dev its own directory removes the collision. Production is untouched: `next
 * build` and `next start` both still use `.next`, so nothing about the droplet deploy
 * changes.
 */
/**
 * The same collision happens between TWO dev servers, which the note above does not
 * cover: a second `next dev` on another port shares `.next-dev` with the first, the two
 * compilers overwrite each other's chunks, and the running one starts throwing
 * `Cannot find module './vendor-chunks/...'` and ENOENT on `_not-found/page.js` until the
 * directory is deleted. Set NEXT_DIST_DIR to give a second server its own output:
 *
 *     NEXT_DIST_DIR=.next-alt npx next dev -p 3111
 *
 * Unset, nothing changes: dev keeps `.next-dev` and the droplet keeps `.next`.
 *
 * One catch, so nobody has to rediscover it: Next rewrites `next-env.d.ts` and the
 * `include` array in `tsconfig.json` to point at whatever dist directory it is using, and
 * it does not put them back. After a run with NEXT_DIST_DIR set, revert both:
 *
 *     git checkout -- next-env.d.ts tsconfig.json
 */
const distDir =
  process.env.NEXT_DIST_DIR ?? (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir,
  // Payload runs inside Next's App Router. The public site is a separate Astro
  // app; this Next app serves ONLY the admin panel + the Local/REST API.
  // Workspace packages ship as TypeScript source, so Next must transpile them.
  transpilePackages: ['@mpm/shared', '@mpm/seo', '@mpm/db', '@mpm/ui-tokens'],
  // Skip ESLint during `next build` — type checking still runs, but lint rules (e.g. the
  // no-explicit-any in the admin field components and the ban-ts-comment on the verbatim
  // PDF port) should not fail a production build. Tracked here so it isn't hand-applied on
  // the droplet each deploy.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    reactCompiler: false,
  },
  // The Payload scaffold (`app/(payload)/**`) and our workspace packages author imports
  // with explicit `.js` extensions (ESM style, `moduleResolution: bundler`). Next's
  // webpack does not map `.js` → `.ts` by default, so `payload.config.js` and
  // `importMap.js` fail to resolve and the whole admin 500s. Teach webpack the mapping.
  // Order matters: prefer a real `.js` when it exists (the Payload-generated
  // `importMap.js`, which registers custom admin components), then fall back to the
  // `.ts` source (`payload.config.ts`, which has no `.js` sibling).
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ...(webpackConfig.resolve.extensionAlias ?? {}),
      '.js': ['.js', '.jsx', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
    };
    return webpackConfig;
  },
};

export default withPayload(nextConfig);
