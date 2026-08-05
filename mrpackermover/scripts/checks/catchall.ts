import fs from 'node:fs';
import path from 'node:path';
import { ROOT, fail, type CheckResult } from './load.js';

/**
 * No catch-all routes (ADR-0003, Doc 02 §15). A `[...slug].astro` with a DB lookup
 * reintroduces the infinite URL space that is the incumbent's fatal flaw. This
 * grep-gate (mirrored by an ESLint rule) fails the build if one ever appears.
 */
export function checkCatchAll(): CheckResult {
  const pagesDir = path.join(ROOT, 'apps/web/src/pages');
  const messages: string[] = [];

  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\[\.\.\..*\]/.test(entry.name)) {
        messages.push(`Catch-all route file: ${path.relative(ROOT, full)}`);
      }
    }
  };
  walk(pagesDir);
  return fail('no-catchall-routes', messages);
}
