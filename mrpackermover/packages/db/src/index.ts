import pg from 'pg';
import { getDatabaseUrl } from './env.js';

/**
 * Node/build-time Postgres pool for the raw SQL the build pipeline runs
 * (internal-link materialization, manifest gate query). Payload manages its own
 * pool internally via its Postgres adapter; this pool is for `scripts/*` and the
 * CMS's `lib/internal-links.ts`.
 *
 * Standard `pg` over the wire protocol → portable across Neon / Supabase / RDS /
 * self-hosted. No provider-specific driver.
 */
let pool: pg.Pool | null = null;

export function getPool(connectionString: string = getDatabaseUrl()): pg.Pool {
  if (pool) return pool;
  // Managed Postgres (Neon et al.) require TLS and present a properly-issued
  // certificate, so we keep verification ON. Only an explicit `sslmode=disable`
  // (local plaintext dev) turns TLS off. Never disable cert verification.
  const tlsDisabled = /sslmode=disable/.test(connectionString);
  pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: tlsDisabled ? false : { rejectUnauthorized: true },
  });
  return pool;
}

/** Run a query with typed rows. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<T>(text, params as unknown[]);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export { getDatabaseUrl, getEnv } from './env.js';
