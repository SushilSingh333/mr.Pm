/**
 * Shared helpers for Cloudflare Pages Functions (the /quote, /search, /track edge
 * endpoints). These run on Workers and reach Postgres through Hyperdrive, which
 * accepts any Postgres connection string — so the database stays portable even at
 * the edge (repoint Hyperdrive, nothing here changes).
 */
import { Client } from 'pg';

export interface Env {
  /** Hyperdrive binding fronting the portable Postgres connection string. */
  HYPERDRIVE: { connectionString: string };
  TURNSTILE_SECRET_KEY?: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}

/** Open a short-lived Postgres client over Hyperdrive; caller closes via waitUntil. */
export function pgClient(env: Env): Client {
  return new Client({ connectionString: env.HYPERDRIVE.connectionString });
}

/** Verify a Cloudflare Turnstile token server-side (Doc 02 §2 — Turnstile, not Bot Fight Mode). */
export async function verifyTurnstile(
  env: Env,
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true; // not configured in dev
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
