import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseManifest, type Manifest } from '@mpm/shared';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const WEB_DATA = path.join(ROOT, 'apps/web/src/data');
export const WEB_DIST = path.join(ROOT, 'apps/web/dist');

/** Load the manifest that CI checks against (generated if present, else the sample). */
export function loadManifest(): Manifest {
  const generated = path.join(WEB_DATA, 'manifest.json');
  const sample = path.join(WEB_DATA, 'manifest.sample.json');
  const file = fs.existsSync(generated) ? generated : sample;
  return parseManifest(JSON.parse(fs.readFileSync(file, 'utf8')));
}

/** Recursively list built HTML files if the site has been built. */
export function listDistHtml(): string[] {
  if (!fs.existsSync(WEB_DIST)) return [];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) out.push(full);
    }
  };
  walk(WEB_DIST);
  return out;
}

export interface CheckResult {
  name: string;
  ok: boolean;
  messages: string[];
}

export function pass(name: string): CheckResult {
  return { name, ok: true, messages: [] };
}
export function fail(name: string, messages: string[]): CheckResult {
  return { name, ok: messages.length === 0, messages };
}
