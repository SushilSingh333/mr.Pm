import type { PayloadRequest } from 'payload';

/**
 * Shared helpers for the public Node endpoints (`/api/quote`, `/api/search`,
 * `/api/track`). These run inside the Payload/Next server on the origin (a single
 * DigitalOcean droplet) and reach Postgres through Payload's local API — no
 * Hyperdrive, no separate DB pool. Cloudflare hard-caches the static pages but must
 * NOT cache these, so every response is `private, no-store`.
 */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}

/** Read a trimmed string query param from Payload's parsed `req.query`. */
export function queryParam(req: PayloadRequest, key: string): string {
  const v = (req.query as Record<string, unknown> | undefined)?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** Best-effort client IP behind Caddy/Cloudflare (first hop in x-forwarded-for). */
export function clientIp(req: PayloadRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? null;
  return req.headers.get('cf-connecting-ip');
}

/**
 * Verify a Cloudflare Turnstile token server-side (Doc 02 §2 — Turnstile, not Bot
 * Fight Mode). Turnstile is a hosted challenge, so it works regardless of where the
 * origin runs. If no secret is configured (dev), verification is skipped.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured in dev
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
