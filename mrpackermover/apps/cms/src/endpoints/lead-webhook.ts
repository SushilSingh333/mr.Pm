import type { Endpoint, PayloadRequest } from 'payload';
import { addDataAndFileToRequest } from 'payload';
import { timingSafeEqual } from 'node:crypto';
import { json, clientIp } from './_lib.js';

/**
 * Inbound leads from anywhere that is not this website.
 *
 * Facebook Lead Ads -> Zapier -> here. Also Google Ads, a partner site, or anything
 * that can POST JSON. The point is that every lead lands in one pipeline: a salesperson
 * should not have to check a Facebook inbox as well as the CMS, and "which leads did we
 * get this week" should be one number.
 *
 * Guarded by a shared secret from the Integrations global rather than left open like
 * /api/quote. A visitor filling in the website form has no credentials, so that endpoint
 * has to accept anonymous posts; a webhook URL has exactly one caller and would
 * otherwise be a public "create a row in the sales pipeline" button.
 *
 * Send the secret as `x-webhook-secret`. A `?secret=` query parameter also works,
 * because some tools cannot set headers - but it is second best: query strings end up in
 * access logs and browser history in a way headers do not.
 */

/** Case- and separator-insensitive, so full_name / fullName / "Full Name" all match. */
const norm = (k: string): string => k.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Pull the first non-empty value whose key matches one of `names`.
 *
 * Ad platforms do not agree on field names and never will - Facebook sends
 * `full_name` and `phone_number`, Google sends `FULL_NAME`, and whoever built the form
 * may have typed `Phone No.`. Rather than force one shape on the sender, each field
 * accepts the spellings that actually occur.
 */
function pick(flat: Record<string, unknown>, names: string[]): string {
  for (const n of names) {
    const v = flat[norm(n)];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

/**
 * Last resort: the first value whose KEY contains one of these words.
 *
 * Used only after the exact spellings have missed, so it cannot shadow a properly
 * mapped field. Skips anything that looks like an id or a timestamp, which are the keys
 * most likely to contain a word by accident.
 */
function loose(flat: Record<string, unknown>, words: string[]): string {
  for (const [k, v] of Object.entries(flat)) {
    if (/^(id|.*id|created.*|updated.*|.*time|.*date)$/.test(k)) continue;
    if (typeof v !== 'string' || !v.trim()) continue;
    if (words.some((w) => k.includes(w))) return v.trim();
  }
  return '';
}

/**
 * Flatten one level of nesting and normalise the keys.
 *
 * Zapier sometimes sends `{ "data": { ... } }` and Facebook's own format is an array of
 * `{ name, values }` pairs, so the interesting fields are rarely at the top level.
 */
function flatten(body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const absorb = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        absorb(v);
        continue;
      }
      // Facebook's field_data: [{ name: 'email', values: ['a@b.c'] }]
      if (Array.isArray(v)) {
        for (const row of v) {
          const r = row as { name?: unknown; values?: unknown };
          if (r && typeof r.name === 'string' && Array.isArray(r.values)) {
            out[norm(r.name)] = r.values[0];
          }
        }
        continue;
      }
      if (out[norm(k)] === undefined) out[norm(k)] = v;
      // Zapier's Unflatten option names keys `parent__child`. Register the last
      // segment as well, so `customer__phone` still matches a plain `phone`.
      if (k.includes('__')) {
        const leaf = norm(k.split('__').pop() ?? '');
        if (leaf && out[leaf] === undefined) out[leaf] = v;
      }
    }
  };
  absorb(body);
  return out;
}

/** Equal-length, constant-time compare so a wrong secret leaks nothing by timing. */
function secretMatches(given: string, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Read the body whatever shape it arrives in.
 *
 * Payload's own parser handles `application/json` and `multipart/*` and nothing else -
 * but Zapier's Webhooks action defaults its Payload Type to **Form**, which sends
 * `application/x-www-form-urlencoded`. Left unhandled, every lead arrived with an empty
 * body and was rejected for having no phone number, with the Zap reporting success.
 *
 * Getting a dropdown right should not be the difference between receiving leads and
 * silently losing them, so all three are accepted. The body can only be read once, so
 * the urlencoded case is handled here instead of delegating.
 */
async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  const contentType = (req.headers.get('content-type') || '').split(';')[0]?.trim();

  if (contentType === 'application/x-www-form-urlencoded') {
    const text = (await req.text?.()) ?? '';
    const out: Record<string, unknown> = {};
    for (const [k, v] of new URLSearchParams(text)) out[k] = v;
    return out;
  }

  await addDataAndFileToRequest(req);
  const data = req.data ?? {};
  // "Wrap Request In Array" sends [{...}]; take the first entry rather than failing.
  if (Array.isArray(data)) return (data[0] ?? {}) as Record<string, unknown>;
  return data as Record<string, unknown>;
}

export const leadWebhookEndpoint: Endpoint = {
  path: '/lead-webhook',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const body = await readBody(req);

    const settings = await req.payload.findGlobal({ slug: 'integrations', overrideAccess: true });
    const expected =
      typeof settings.leadWebhookSecret === 'string' ? settings.leadWebhookSecret : '';

    /**
     * Record why a request was turned away, so the Integrations screen can show it.
     *
     * `updateGlobal`, not `update` - the latter is the collection API and silently did
     * nothing here, which is why the counter and the last-error line stayed empty
     * through a whole test run.
     *
     * `quiet` skips the write for requests that arrived with no secret at all. Those are
     * drive-by scanners rather than someone mid-setup, and there is no reason to let an
     * unauthenticated caller make us write to the database on demand.
     */
    const reject = async (message: string, status: number, quiet = false): Promise<Response> => {
      if (!quiet) {
        await req.payload
          .updateGlobal({
            slug: 'integrations',
            data: { leadWebhookLastError: `${new Date().toISOString()} — ${message}` },
            overrideAccess: true,
            req,
          })
          .catch(() => {
            /* diagnostics must never turn a rejection into a 500 */
          });
      }
      return json({ error: message }, status);
    };

    if (settings.leadWebhookEnabled === false) {
      return reject('The webhook is switched off in Integrations.', 403);
    }

    const given =
      req.headers.get('x-webhook-secret') ??
      (typeof req.query?.secret === 'string' ? req.query.secret : '');
    if (!secretMatches(given, expected)) {
      // Deliberately vague to the caller, specific in the log: a legitimate integrator
      // reads the reason on the Integrations screen, an attacker learns nothing here.
      return reject('Rejected: the secret did not match.', 401, !given);
    }

    const flat = flatten(body);
    // "Phone No." normalises to `phoneno`, which none of the original spellings caught -
    // a real Zapier test failed on exactly that. Ad form builders let people type the
    // question themselves, so the list has to cover how a person writes it, not how an
    // API would name it.
    const phone = pick(flat, [
      'phone',
      'phone_number',
      'phonenumber',
      'phone_no',
      'phoneno',
      'mobile',
      'mobile_number',
      'mobileno',
      'contact',
      'contact_number',
      'contactno',
      'whatsapp',
      'number',
    ]);
    if (!/^[+0-9 ()-]{8,}$/.test(phone)) {
      return reject('Rejected: no usable phone number in the payload.', 422);
    }

    const first = pick(flat, ['first_name', 'firstname', 'fname']);
    const last = pick(flat, ['last_name', 'lastname', 'lname']);
    const name =
      pick(flat, ['full_name', 'fullname', 'name', 'customer_name', 'lead_name']) ||
      [first, last].filter(Boolean).join(' ') ||
      'Facebook lead';

    const externalId = pick(flat, [
      'leadgen_id',
      'lead_id',
      'id',
      'external_id',
      'zap_id',
      'request_id',
    ]);

    // Ad platforms re-deliver, and Zapier retries a failed step. The same lead arriving
    // twice means two people ringing one customer, so a repeat is accepted quietly
    // rather than treated as an error - the sender has done nothing wrong.
    if (externalId) {
      const seen = await req.payload.find({
        collection: 'leads',
        where: { externalId: { equals: externalId } } as never,
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      });
      if (seen.totalDocs > 0) {
        return json({ ok: true, duplicate: true, id: seen.docs[0]?.id });
      }
    }

    const sourceRaw = pick(flat, ['source', 'platform', 'channel']).toLowerCase();
    const source =
      sourceRaw.includes('facebook') || sourceRaw.includes('instagram') || flat.leadgenid
        ? 'facebook-ad'
        : 'webhook';

    try {
      const lead = await req.payload.create({
        collection: 'leads',
        data: {
          name,
          phone,
          source,
          email: pick(flat, ['email', 'email_address', 'emailaddress']) || undefined,
          service:
            pick(flat, ['service', 'service_type', 'moving_type', 'requirement']) ||
            // Lead forms ask questions, not field names - a real Facebook form sent
            // "what_are_you_moving?". Fall back to any key that reads like the question,
            // rather than dropping an answer the customer took the trouble to give.
            loose(flat, ['moving', 'shifting', 'service']) ||
            undefined,
          pickup:
            pick(flat, ['pickup', 'from', 'from_city', 'origin', 'current_city']) || undefined,
          dropLocation:
            pick(flat, ['drop', 'to', 'to_city', 'destination', 'shifting_to']) || undefined,
          moveSize: pick(flat, ['size', 'move_size', 'house_size', 'bhk']) || undefined,
          customerNote: pick(flat, ['message', 'notes', 'comments', 'remarks']) || undefined,
          sourceDetail:
            [
              pick(flat, ['campaign_name', 'campaign', 'ad_name', 'adset_name']),
              pick(flat, ['form_name', 'form']),
            ]
              .filter(Boolean)
              .join(' · ') || undefined,
          externalId: externalId || undefined,
          // Kept verbatim so a mapping that silently stopped working can be diagnosed
          // from the lead itself rather than from Zapier's history.
          rawPayload: body,
          sourceIp: clientIp(req) ?? undefined,
        } as never,
        overrideAccess: true,
        req,
      });

      await req.payload
        .updateGlobal({
          slug: 'integrations',
          data: {
            leadWebhookLastAt: new Date().toISOString(),
            leadWebhookCount: Number(settings.leadWebhookCount ?? 0) + 1,
            leadWebhookLastError: null,
          },
          overrideAccess: true,
          req,
        })
        .catch(() => {
          /* the lead is saved; the counter is a convenience */
        });

      return json({ ok: true, id: lead.id });
    } catch (error) {
      req.payload.logger.error({ err: error }, 'lead-webhook: create failed');
      return reject('The lead could not be saved.', 500);
    }
  },
};
