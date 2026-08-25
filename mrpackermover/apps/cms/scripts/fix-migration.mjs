/**
 * Post-processes whatever `payload migrate:create` just emitted, because the generator
 * produces two things that break this project:
 *
 *  1. A *value* import for `MigrateUpArgs` / `MigrateDownArgs`. Those are types only —
 *     on Payload 3.87 the emitted `import { MigrateUpArgs, ... }` fails at runtime with
 *     "does not provide an export named 'MigrateUpArgs'". They must be `import type`,
 *     with `sql` kept as a separate value import.
 *
 *  2. A regenerated `migrations/index.ts` whose order can place the committed
 *     `0001_postgis` migration *before* the generated base schema. 0001_postgis runs
 *     `ALTER TABLE locations`, so it must come after the table exists or `pnpm migrate`
 *     dies on a fresh database.
 *
 * Runs automatically via the `migrate:create` package script.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../migrations');

/** The migration that must never run first (it ALTERs tables the base schema creates). */
const POSTGIS = '0001_postgis';

/**
 * Split a combined import of types + `sql` into a `import type` line and a value line.
 * Only touches the specific shape Payload emits; anything already correct is left alone.
 */
function fixImports(source) {
  const importRe =
    /^import\s*\{([^}]*)\}\s*from\s*(['"])(@payloadcms\/db-postgres)\2;?[ \t]*$/gm;

  return source.replace(importRe, (whole, names, quote, moduleName) => {
    const specifiers = names
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Already an `import type` line, or nothing we recognise — leave it untouched.
    if (specifiers.length === 0) return whole;

    const typeNames = specifiers.filter((s) => /^Migrate(Up|Down)Args$/.test(s));
    const valueNames = specifiers.filter((s) => !/^Migrate(Up|Down)Args$/.test(s));

    if (typeNames.length === 0) return whole;

    const lines = [`import type { ${typeNames.join(', ')} } from ${quote}${moduleName}${quote};`];
    if (valueNames.length > 0) {
      lines.push(`import { ${valueNames.join(', ')} } from ${quote}${moduleName}${quote};`);
    }
    return lines.join('\n');
  });
}

/**
 * Confirm `0001_postgis` is not ordered before the base-schema migration in index.ts.
 * Payload runs migrations in the order this array lists them.
 */
async function checkOrder(files) {
  if (!files.includes('index.ts')) return null;

  const indexPath = path.join(migrationsDir, 'index.ts');
  const source = await readFile(indexPath, 'utf8');

  // The `migrations` array lists entries as `{ up, down, name: '...' }`.
  const names = [...source.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  if (names.length < 2) return null;

  const postgisAt = names.findIndex((n) => n.includes(POSTGIS));
  if (postgisAt === -1) return null;

  // Anything that is not 0001_postgis is a generated schema migration.
  const firstOtherAt = names.findIndex((n) => !n.includes(POSTGIS));
  if (firstOtherAt === -1) return null;

  if (postgisAt < firstOtherAt) {
    return (
      `migrations/index.ts orders "${names[postgisAt]}" BEFORE "${names[firstOtherAt]}".\n` +
      `  ${POSTGIS} runs ALTER TABLE locations, so it must come after the base schema.\n` +
      `  Reorder the array in migrations/index.ts so ${POSTGIS} is last, then re-run migrate.\n` +
      `  Current order: ${names.join(' → ')}`
    );
  }
  return null;
}

const files = await readdir(migrationsDir);
const migrationFiles = files.filter((f) => f.endsWith('.ts') && f !== 'index.ts');

let patched = 0;
for (const file of migrationFiles) {
  const full = path.join(migrationsDir, file);
  const before = await readFile(full, 'utf8');
  const after = fixImports(before);
  if (after !== before) {
    await writeFile(full, after, 'utf8');
    console.info(`fix-migration: rewrote type imports in ${file}`);
    patched += 1;
  }
}

if (patched === 0) {
  console.info('fix-migration: imports already correct, nothing to rewrite.');
}

const orderProblem = await checkOrder(files);
if (orderProblem) {
  console.error(`\nfix-migration: MIGRATION ORDER PROBLEM\n  ${orderProblem}\n`);
  process.exit(1);
}
console.info('fix-migration: migration order OK.');
