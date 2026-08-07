import type { Endpoint } from 'payload';
import { addDataAndFileToRequest } from 'payload';
import { json, clientIp, verifyTurnstile } from './_lib.js';

/**
 * POST /api/apply — capture a job application from the careers page into the
 * `job-applications` collection. Turnstile-guarded; response is `private, no-store`.
 */
interface ApplyBody {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  message?: string;
  resumeUrl?: string;
  turnstileToken?: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const applyEndpoint: Endpoint = {
  path: '/apply',
  method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req);
    const body = (req.data ?? {}) as ApplyBody;

    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    if (name.length < 2 || !EMAIL.test(email)) {
      return json({ error: 'A name and a valid email are required' }, 422);
    }

    const ip = clientIp(req);
    const ok = await verifyTurnstile(body.turnstileToken, ip);
    if (!ok) return json({ error: 'Verification failed' }, 403);

    try {
      await req.payload.create({
        collection: 'job-applications',
        data: {
          name,
          email,
          phone: body.phone ?? undefined,
          position: body.position ?? undefined,
          message: body.message ?? undefined,
          resumeUrl: body.resumeUrl ?? undefined,
          sourceIp: ip ?? undefined,
        } as never,
      });
    } catch (error) {
      req.payload.logger.error({ err: error }, 'apply: application create failed');
      return json({ error: 'Could not submit the application' }, 500);
    }

    return json({ ok: true });
  },
};
