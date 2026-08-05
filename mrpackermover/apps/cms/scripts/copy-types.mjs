/**
 * After `payload generate:types`, copy the generated types into @mpm/shared so the
 * web app and shared packages can import collection shapes without depending on the
 * CMS app. Keeps the type boundary clean.
 */
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const from = path.resolve(here, '../src/payload-types.ts');
const to = path.resolve(here, '../../../packages/shared/src/payload-types.ts');

await copyFile(from, to);
console.info(`Copied payload-types.ts → ${to}`);
