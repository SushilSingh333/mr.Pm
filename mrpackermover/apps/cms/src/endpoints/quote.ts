import type { Endpoint } from 'payload';
import { addDataAndFileToRequest } from 'payload';
import { json, clientIp, verifyTurnstile } from './_lib.js';

/**
 * POST /api/quote — capture a lead. Runs in the Payload/Next server on the origin
 * and writes to the `leads` collection via the local API, so the row appears in the
 * CMS with all defaults applied (status = "new") and validation enforced. Turnstile
 * guards it; the response is always `private, no-store`.
 *
 * The form body is read leniently (the booking bar and the /get-quote form use
 * slightly different field names) and mapped onto the Leads fields.
 */
interface QuoteBody {
  service?: string;
  pickup?: string;
  from?: string;
  drop?: string;
  dropLocation?: string;
  to?: string;
  date?: string;
  moveDate?: string;
  size?: string;
  moveSize?: string;
  name?: string;
  phone?: string;
  /** 'price-check' when it comes from the booking-bar "Check Price" (no name). */
  source?: string;
  turnstileToken?: string;
}

export const quoteEndpoint: Endpoint = {
  path: '/quote',
  method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req);
    const body = (req.data ?? {}) as QuoteBody;

    // A price check comes from the booking bar (phone but no name); the full quote
    // form always has a name. Both land in Leads, distinguished by `source`.
    const source = body.source === 'price-check' ? 'price-check' : 'quote-form';
    const phone = (body.phone ?? '').trim();
    const name = (body.name ?? '').trim() || (source === 'price-check' ? 'Price check' : '');
    const phoneOk = /^[+0-9 ()-]{8,}$/.test(phone);
    if (!phoneOk || (source === 'quote-form' && name.length < 2)) {
      return json({ error: 'A name and a valid phone are required' }, 422);
    }

    const ip = clientIp(req);
    const ok = await verifyTurnstile(body.turnstileToken, ip);
    if (!ok) return json({ error: 'Verification failed' }, 403);

    try {
      await req.payload.create({
        collection: 'leads',
        // `as never`: the generated Leads types make create() a strict overload union;
        // the codebase casts these the same way in seed.ts / manifest.ts.
        data: {
          name,
          phone,
          source,
          service: body.service ?? undefined,
          pickup: body.pickup ?? body.from ?? undefined,
          dropLocation: body.drop ?? body.dropLocation ?? body.to ?? undefined,
          moveDate: body.date || body.moveDate || undefined,
          moveSize: body.size ?? body.moveSize ?? undefined,
          sourceIp: ip ?? undefined,
          sourcePage: req.headers.get('referer') ?? undefined,
        } as never,
      });
    } catch (error) {
      req.payload.logger.error({ err: error }, 'quote: lead create failed');
      return json({ error: 'Could not save the request' }, 500);
    }

    return json({ ok: true });
  },
};
