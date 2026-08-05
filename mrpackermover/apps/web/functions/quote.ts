import { json, pgClient, verifyTurnstile, type Env } from './_lib.js';

/**
 * POST /quote — capture a lead. Runs on Workers, writes to Postgres via Hyperdrive.
 * Never behind Bot Fight Mode (it breaks legitimate submissions); Turnstile guards
 * it instead. Response is always `private, no-store` and the endpoint is noindex.
 */
interface QuoteBody {
  service?: string;
  pickup?: string;
  drop?: string;
  date?: string;
  size?: string;
  name?: string;
  phone?: string;
  turnstileToken?: string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: QuoteBody;
  try {
    body = (await ctx.request.json()) as QuoteBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const name = (body.name ?? '').trim();
  const phone = (body.phone ?? '').trim();
  if (name.length < 2 || !/^[+0-9 ()-]{8,}$/.test(phone)) {
    return json({ error: 'Name and a valid phone are required' }, 422);
  }

  const ip = ctx.request.headers.get('cf-connecting-ip');
  const ok = await verifyTurnstile(ctx.env, body.turnstileToken, ip);
  if (!ok) return json({ error: 'Verification failed' }, 403);

  const client = pgClient(ctx.env);
  try {
    await client.connect();
    await client.query(
      `INSERT INTO leads (name, phone, service, pickup, drop_location, move_date, move_size, source_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        name,
        phone,
        body.service ?? null,
        body.pickup ?? null,
        body.drop ?? null,
        body.date || null,
        body.size ?? null,
        ip,
      ],
    );
  } catch (error) {
    console.error('quote insert failed', error);
    return json({ error: 'Could not save the request' }, 500);
  } finally {
    ctx.waitUntil(client.end());
  }

  return json({ ok: true });
};

/** Any non-POST method is not allowed here. */
export const onRequest: PagesFunction<Env> = () => json({ error: 'Method not allowed' }, 405);
