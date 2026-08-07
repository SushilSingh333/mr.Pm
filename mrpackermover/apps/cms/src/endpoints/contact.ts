import type { Endpoint } from 'payload';
import { addDataAndFileToRequest } from 'payload';
import { json, clientIp, verifyTurnstile } from './_lib.js';

/**
 * POST /api/contact — capture a contact-form message into the `contact-messages`
 * collection. Turnstile-guarded; response is `private, no-store`.
 */
interface ContactBody {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  turnstileToken?: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const contactEndpoint: Endpoint = {
  path: '/contact',
  method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req);
    const body = (req.data ?? {}) as ContactBody;

    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const message = (body.message ?? '').trim();
    if (name.length < 2 || !EMAIL.test(email) || message.length < 2) {
      return json({ error: 'A name, a valid email, and a message are required' }, 422);
    }

    const ip = clientIp(req);
    const ok = await verifyTurnstile(body.turnstileToken, ip);
    if (!ok) return json({ error: 'Verification failed' }, 403);

    try {
      await req.payload.create({
        collection: 'contact-messages',
        data: {
          name,
          email,
          message,
          phone: body.phone ?? undefined,
          subject: body.subject ?? undefined,
          sourceIp: ip ?? undefined,
          sourcePage: req.headers.get('referer') ?? undefined,
        } as never,
      });
    } catch (error) {
      req.payload.logger.error({ err: error }, 'contact: message create failed');
      return json({ error: 'Could not send the message' }, 500);
    }

    return json({ ok: true });
  },
};
