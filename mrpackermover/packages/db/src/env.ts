import { z } from 'zod';

/**
 * Validated environment. Reading env anywhere else in the codebase is a smell —
 * import from here so a missing/invalid value fails loudly and early, and so the
 * database connection string has exactly one entry point (portability boundary).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid Postgres connection string'),
  PAYLOAD_SECRET: z.string().min(24, 'PAYLOAD_SECRET must be at least 24 chars').optional(),
  PUBLIC_SITE_URL: z.string().url().default('http://localhost:4321'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(source: Record<string, string | undefined> = process.env): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/**
 * The single database connection string (DATABASE_URL). This is the one portability
 * boundary — migrating providers (Neon → DigitalOcean → managed) is only ever a
 * change to this value; no driver or feature code changes.
 */
export function getDatabaseUrl(source?: Record<string, string | undefined>): string {
  return getEnv(source).DATABASE_URL;
}
