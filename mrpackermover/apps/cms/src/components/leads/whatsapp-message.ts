'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@payloadcms/ui';
import { personCase } from '../dashboard/lead-status.js';
import {
  DEFAULT_TEMPLATES,
  type MessageKind,
  type MessageVars,
  kindForStage,
  renderTemplate,
} from '../../lib/message-templates.js';

/**
 * Builds the WhatsApp opener for a lead, in the browser.
 *
 * The three places that need it are all client components - a list cell, a dashboard row
 * and a field on the lead - so the wording cannot be handed down from the server the way
 * a page prop would be. It is fetched once instead, and shared.
 *
 * FETCHED ONCE PER TAB, not once per row. A leads list is ten rows, each with a WhatsApp
 * button; ten components each calling `fetch` on mount is ten identical requests for one
 * global. The promise is cached at module scope, so the first row to ask starts the
 * request and the other nine await the same one.
 */

interface Settings {
  templates: Record<MessageKind, string>;
  brand: string;
  site: string;
}

/** The fallback, used until the fetch lands and for good if it never does. */
const FALLBACK: Settings = {
  templates: DEFAULT_TEMPLATES,
  brand: 'MrMoverPacker',
  site: 'mrmoverpacker.com',
};

let cached: Promise<Settings> | null = null;

async function loadSettings(): Promise<Settings> {
  if (cached) return cached;
  cached = (async () => {
    try {
      // Two globals: the wording lives on one, the company name on the other. Requested
      // together rather than in sequence - they do not depend on each other, and a
      // salesperson should not wait two round trips to tap a button.
      const [messagesRes, orgRes] = await Promise.all([
        fetch('/api/globals/sales-messages?depth=0', { credentials: 'include' }),
        fetch('/api/globals/org-profile?depth=0', { credentials: 'include' }),
      ]);
      const messages = messagesRes.ok ? await messagesRes.json() : {};
      const org = orgRes.ok ? await orgRes.json() : {};
      const pick = (v: unknown, fallback: string): string =>
        typeof v === 'string' && v.trim() ? v : fallback;
      return {
        templates: {
          firstContact: pick(messages.firstContact, DEFAULT_TEMPLATES.firstContact),
          quoteFollowUp: pick(messages.quoteFollowUp, DEFAULT_TEMPLATES.quoteFollowUp),
          booked: pick(messages.booked, DEFAULT_TEMPLATES.booked),
        },
        brand: pick(org.brandName, FALLBACK.brand),
        site: pick(messages.siteUrl, FALLBACK.site),
      };
    } catch {
      // Offline, or a global that has never been saved. The built-in wording is a
      // perfectly good message; refusing to open WhatsApp over it would not be.
      return FALLBACK;
    }
  })();
  return cached;
}

/** What the button needs to know about the lead it belongs to. */
export interface LeadContext {
  name?: string | null;
  service?: string | null;
  moveSize?: string | null;
  pickup?: string | null;
  dropLocation?: string | null;
  status?: string | null;
}

/** "Ballia, Uttar Pradesh, India" is a Places string; the customer's city is the part
 *  worth putting in a message to them. */
const cityOf = (place?: string | null): string => (place ?? '').split(',')[0]?.trim() ?? '';

/**
 * The opener for this lead, ready to hang off a `wa.me` link.
 *
 * Returns an empty string until the settings arrive, and the callers treat that as "no
 * prefill" - so the button is a working WhatsApp link from the first paint and gains its
 * message a moment later, rather than being dead or missing while a fetch is in flight.
 */
export function useWhatsappMessage(lead?: LeadContext | null): string {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let alive = true;
    void loadSettings().then((s) => {
      if (alive) setSettings(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!settings || !lead) return '';

  /**
   * Cased the same way the board cases them, and for the same reason twice over: the
   * dashboard greets somebody as "Hello, Sushil" while their own message introduced them
   * as "I'm *sushil*", and a customer who typed their name in capitals got it SHOUTED
   * back at them in the first line of the first message we ever send.
   */
  const agent = personCase((user as { name?: string } | null)?.name?.trim() ?? '');
  const vars: MessageVars = {
    name: personCase(lead.name ?? ''),
    service: lead.service ?? '',
    size: lead.moveSize ?? '',
    from: cityOf(lead.pickup),
    to: cityOf(lead.dropLocation),
    agent,
    brand: settings.brand,
    site: settings.site,
  };

  return renderTemplate(settings.templates[kindForStage(lead.status ?? undefined)], vars);
}
