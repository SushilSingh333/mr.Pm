/**
 * The WhatsApp opener a salesperson sends, built from the lead in front of them.
 *
 * Tapping WhatsApp used to open an empty chat, which puts the whole message on whoever
 * is holding the phone - so the first line a customer gets depends on who happened to
 * pick the lead up and how their morning is going. A prepared opener makes it the same
 * message every time, with the customer's own details in it, and still leaves the
 * salesperson free to edit before sending: `wa.me?text=` fills the input box, it does
 * not send anything.
 *
 * WhatsApp's own markup is used for emphasis - *bold* between asterisks - because the
 * customer reads this in WhatsApp, not in a browser.
 *
 * No imports. Both a client cell and a server global read this, and a module with
 * dependencies could not be shared by both.
 */

/** Everything a template may refer to. Anything missing simply does not appear. */
export interface MessageVars {
  /** The customer, as they would write their own name. */
  name?: string;
  /** "Home Shifting", "Bike Transport" - whatever they asked for. */
  service?: string;
  /** "14 ft", when a truck size has been worked out. */
  size?: string;
  /** Pickup city. */
  from?: string;
  /** Drop city. */
  to?: string;
  /** The salesperson sending it. */
  agent?: string;
  /** The company, from the org profile. */
  brand?: string;
  /** The website, shown as the sign-off. */
  site?: string;
}

/**
 * Which opener to send.
 *
 * A first message and a "still thinking about that quote?" message are different
 * messages, and which one applies is something the board already knows from the stage -
 * so the salesperson is never picking from a list.
 */
export type MessageKind = 'firstContact' | 'quoteFollowUp' | 'booked';

/**
 * The openers as they ship.
 *
 * Deliberately plain. Every clause is one a coordinator would actually say out loud, and
 * there is no "Dear valued customer" anywhere in it - the fastest way to be ignored on
 * WhatsApp is to read like a broadcast. These are defaults: the Sales messages screen
 * overrides any of them without a deploy.
 */
export const DEFAULT_TEMPLATES: Record<MessageKind, string> = {
  firstContact: [
    'Hello *{name},*',
    '',
    'Thank you for contacting us about your *{service}*.',
    'Your move: *{from}* to *{to}*',
    'Let me know when you are free and I will take you through the details and the price.',
    '',
    "I'm *{agent}* from *{brand}*.",
    '',
    '*{site}*',
  ].join('\n'),

  quoteFollowUp: [
    'Hello *{name},*',
    '',
    'Following up on the quote we sent you for your *{service}*.',
    'Your move: *{from}* to *{to}*',
    'Happy to go through anything in it, or to look at the date again if that helps.',
    '',
    "I'm *{agent}* from *{brand}*.",
    '',
    '*{site}*',
  ].join('\n'),

  booked: [
    'Hello *{name},*',
    '',
    'Your *{service}* is confirmed with us.',
    'Your move: *{from}* to *{to}*',
    'Our team will reach you on the day. Anything you need before then, just reply here.',
    '',
    "I'm *{agent}* from *{brand}*.",
    '',
    '*{site}*',
  ].join('\n'),
};

/** Every placeholder a template may use, for the help text on the settings screen. */
export const MERGE_FIELDS: Array<{ token: string; meaning: string }> = [
  { token: '{name}', meaning: "the customer's name" },
  { token: '{service}', meaning: 'what they asked for, e.g. Home Shifting' },
  { token: '{size}', meaning: 'truck size, e.g. 14 ft' },
  { token: '{from}', meaning: 'pickup city' },
  { token: '{to}', meaning: 'drop city' },
  { token: '{agent}', meaning: 'you - whoever is sending it' },
  { token: '{brand}', meaning: 'the company name' },
  { token: '{site}', meaning: 'the website' },
];

/**
 * Fill a template in, and drop whatever could not be filled.
 *
 * The rule is per LINE, not per token, and that is the whole trick. Half the leads that
 * arrive from a price-check bar have no drop city, so a template that says "from *{from}*
 * to *{to}*" would otherwise send "from ** to **" to a real customer. Removing just the
 * token leaves the sentence broken around the hole; removing the line the token sits on
 * leaves a message that reads as though that sentence was never written.
 *
 * The consequence, and the one rule for anybody editing a template: NEVER WRAP A
 * SENTENCE ACROSS TWO LINES. The first draft of the opener did exactly that, for the
 * sake of readable source, and a lead with no drop city then produced a message whose
 * surviving half read "through the details and the price." on its own - a fragment with
 * nothing in front of it. One line, one complete thought; a fact you cannot afford to
 * lose gets a line to itself.
 */
export function renderTemplate(template: string, vars: MessageVars): string {
  const lines = template.split('\n');
  const kept: string[] = [];

  for (const line of lines) {
    let dropped = false;
    const filled = line.replace(/\{(\w+)\}/g, (_match, key: string) => {
      const value = (vars as Record<string, string | undefined>)[key];
      const text = typeof value === 'string' ? value.trim() : '';
      if (!text) dropped = true;
      return text;
    });
    if (!dropped) kept.push(filled);
  }

  // Dropping a line can leave two blank lines where there was one paragraph break, and
  // WhatsApp renders every one of them. Runs are collapsed back to a single break, and
  // the ends are trimmed so a missing first or last line does not leave the message
  // opening on empty space.
  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The stage decides the opener.
 *
 * Nobody chooses from a menu: by the time someone taps WhatsApp, the lead already says
 * whether it has been quoted or booked, and asking again would be asking a question the
 * screen can answer. An unknown stage falls back to the first-contact message, which is
 * the one that is never wrong to send.
 */
export function kindForStage(status?: string): MessageKind {
  if (status === 'scheduled' || status === 'won') return 'booked';
  if (status === 'quoted' || status === 'negotiating') return 'quoteFollowUp';
  return 'firstContact';
}
