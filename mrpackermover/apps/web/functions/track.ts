import { json, type Env } from './_lib.js';

/**
 * GET /track/result?ref= — shipment tracking lookup (noindex, disallowed in
 * robots, `private, no-store`). Wired to the ops shipments source when it exists;
 * until then it responds with a clear "not found yet" rather than a fake status.
 */
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const ref = new URL(ctx.request.url).searchParams.get('ref')?.trim() ?? '';
  if (!ref) return json({ error: 'A job reference is required' }, 400);

  // Shipment tracking is fed from the ops system (not part of the public manifest).
  // Returning a structured "unknown" keeps the surface honest until it is wired.
  return json(
    {
      ref,
      status: 'unknown',
      message: 'We could not find that reference. Please check it or contact your coordinator.',
    },
    404,
  );
};
