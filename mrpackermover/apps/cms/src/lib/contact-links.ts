/**
 * Turn whatever is stored in a lead's phone field into links that actually work.
 *
 * Leads arrive from four places and none of them agree on formatting: the website form
 * takes free text, the price-check bar takes ten digits, Facebook sends `+91 98765
 * 43210`, and a coordinator typing one in by hand adds spaces and brackets. Stored as
 * typed, which is right - it is the customer's number, not ours to rewrite - so the
 * tidying happens here at the point of use.
 *
 * `tel:` is forgiving and takes almost anything. `wa.me` is not: it wants digits only,
 * no `+`, and the country code present. A ten-digit Indian mobile handed to it
 * unchanged opens a chat with nobody.
 *
 * No imports, so both the list cell and the detail-view field can use it.
 */

/** Every lead so far is Indian; used only when a number has no country code of its own. */
const DEFAULT_CC = '91';

export interface ContactLinks {
  /** Ready for href, or null when the number is too mangled to dial. */
  tel: string | null;
  /** Ready for href, or null when no plausible mobile could be recovered. */
  whatsapp: string | null;
  /** The digits WhatsApp will use, for showing in a tooltip. */
  e164: string | null;
}

export function contactLinks(raw: unknown): ContactLinks {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return { tel: null, whatsapp: null, e164: null };

  const digits = text.replace(/\D/g, '');
  // Under 10 digits is a landline fragment or a typo - dialable, but not a mobile, and
  // WhatsApp would just fail. Over 15 breaks E.164 and is junk like 88888888888888.
  if (digits.length < 10 || digits.length > 15) {
    // Dialable but not a mobile: a landline fragment, or junk like 88888888888888.
    // Built first and then tested - a template literal is always truthy, so `|| null`
    // after one never fires and an empty number would render as a bare `tel:` link.
    const dialable = text.replace(/[^\d+]/g, '');
    return { tel: dialable ? `tel:${dialable}` : null, whatsapp: null, e164: null };
  }

  let e164: string;
  if (text.startsWith('+')) {
    e164 = digits;
  } else if (digits.length === 10) {
    e164 = DEFAULT_CC + digits;
  } else if (digits.length === 12 && digits.startsWith(DEFAULT_CC)) {
    e164 = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // A trunk prefix: 0 98765 43210 dials nationally but is not an international number.
    e164 = DEFAULT_CC + digits.slice(1);
  } else {
    // Some other country, or a length we cannot reason about. Dial it, but do not guess
    // at a WhatsApp number - a wrong guess messages a stranger.
    return { tel: `tel:+${digits}`, whatsapp: null, e164: null };
  }

  return {
    tel: `tel:+${e164}`,
    whatsapp: `https://wa.me/${e164}`,
    e164,
  };
}
