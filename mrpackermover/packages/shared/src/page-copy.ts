/**
 * The words on the home page and on /services: the built-in text, and how the CMS
 * overrides it.
 *
 * The built-in text is the owner's FINAL briefs (3 Oct 2026). It lives here, once, and
 * is read by both sides: the website falls back to it for any field left blank in the
 * CMS, and the CMS shows it as the placeholder of each blank field - so an editor sees
 * exactly what is live without anything being saved. A filled-in CMS field wins; an
 * emptied one goes back to this.
 *
 * `{count}` in any text is replaced with the number of live cities, so "Pickup in
 * {count} cities" stays true as cities are published and unpublished.
 */

export interface LinkCopy {
  label: string;
  href: string;
}
export interface FaqCopy {
  question: string;
  answer: string;
  link?: LinkCopy;
}

export interface HomePageCopy {
  tagline: string;
  h1: string;
  subhead: string;
  trust: string[];
  promisesHeading: string;
  promises: Array<{ title: string; text: string; link?: LinkCopy }>;
  stepsHeading: string;
  steps: Array<{ title: string; text: string }>;
  compareHeading: string;
  compare: Array<{ label: string; them: string; us: string }>;
  nightHeading: string;
  nightText: string;
  packingHeading: string;
  packing: Array<{ item: string; how: string }>;
  chargesHeading: string;
  chargesIntro: string;
  chargesFactors: Array<{ title: string; text: string }>;
  chargesIncluded: string;
  chargesPromise: string;
  servicesHeading: string;
  citiesHeading: string;
  citiesIntro: string;
  faqHeading: string;
  faqs: FaqCopy[];
  closingHeading: string;
  closingText: string;
}

export const HOME_COPY: HomePageCopy = {
  tagline: "Your home, handled like it's ours.",
  h1: "Packers and movers in India who won't compromise on a single scratch",
  subhead:
    '15 years in this trade taught me three things. Write the price down. Photograph every item. Send a careful crew.',
  trust: [
    'Fixed written quote',
    'ID-verified crews',
    'Claims data published',
    'Pickup in {count} cities',
  ],
  promisesHeading: 'Fixed price packers and movers, with zero compromise on care',
  promises: [
    {
      title: 'One price, in writing',
      text: 'We survey first and write it down. No extras at the door.',
      link: { href: '/pricing', label: 'How pricing works' },
    },
    {
      title: 'Every item photographed',
      text: 'Your inventory reaches WhatsApp before the truck leaves.',
      link: { href: '/claims', label: 'Our claims data' },
    },
    {
      title: 'Our own verified crew',
      text: 'Trained by us, ID-checked, paid to be careful.',
      link: { href: '/verify', label: 'Verify your crew' },
    },
  ],
  stepsHeading: 'House shifting in 4 simple steps',
  steps: [
    { title: 'Video survey', text: 'Show us your home on WhatsApp. Takes 10 minutes.' },
    { title: 'Fixed quote', text: 'Every charge itemised. You approve it.' },
    {
      title: 'Pack and load',
      text: "Photo inventory and your crew's names before anything moves.",
    },
    { title: 'Deliver and check', text: 'We tick off every item with you.' },
  ],
  compareHeading: 'Verified packers and movers vs a typical local mover',
  compare: [
    {
      label: 'Price',
      them: 'Phone estimate that grows at the door',
      us: 'Fixed written quote after a survey',
    },
    { label: 'Crew', them: 'Labour hired that morning', us: 'Our own trained, ID-verified crew' },
    {
      label: 'Inventory',
      them: 'No list',
      us: 'Every item photographed, shared on WhatsApp',
    },
    {
      label: 'Damage',
      them: '"Normal wear"',
      us: 'Written claims process, settlement data published',
    },
    { label: 'Invoice', them: 'Cash, often no bill', us: 'One GST invoice' },
    {
      label: 'Timing',
      them: 'Daytime only, stuck on society rules',
      us: 'Overnight option for local moves',
    },
  ],
  nightHeading: 'Overnight house shifting: loaded by 8 PM, home by morning',
  nightText:
    'For local moves, we pack in the evening and drive on empty roads. We unload as soon as your new society opens its gate. No lost workday. No fights over truck timings.',
  packingHeading: 'How we pack your fragile items',
  packing: [
    {
      item: 'Glassware and crockery',
      how: 'Paper, then bubble wrap, in double-wall cartons marked FRAGILE',
    },
    { item: 'TV and monitors', how: 'Foam corners and a rigid carton; screens stay upright' },
    {
      item: 'Fridge and washing machine',
      how: 'Defrosted and drained a day before, moved upright',
    },
    {
      item: 'Sofa, beds, glass tops',
      how: 'Dismantled where possible, corners guarded, wrapped and framed',
    },
  ],
  chargesHeading: 'Packers and movers charges: what decides your price',
  chargesIntro:
    'No phone guesses. After a 10-minute video survey you get one fixed, written price, based on:',
  chargesFactors: [
    { title: 'What you own', text: 'the volume of goods' },
    { title: 'Distance', text: 'local and intercity are priced separately' },
    { title: 'Access', text: 'floors, lift, and how far the truck parks' },
    { title: 'Packing', text: 'cartons, bubble wrap and crating' },
  ],
  chargesIncluded:
    'packing, loading, transport, unloading, basic furniture dismantling and refitting, and a GST invoice.',
  chargesPromise: "If it isn't on your written quote, you don't pay for it.",
  servicesHeading: 'Home, office, car and bike shifting services',
  citiesHeading: 'Packers and movers in {count} cities',
  citiesIntro: 'Pickup from {count} North India cities. Delivery anywhere in India.',
  faqHeading: 'Questions about house shifting',
  faqs: [
    {
      question: 'Will the bill match the quote?',
      answer: 'Yes. It only changes if you add items, and you approve it first.',
    },
    {
      question: 'Are my goods insured?',
      answer: 'Basic cover is included. Full transit insurance is an optional line on your quote.',
      link: { href: '/insurance', label: 'Details' },
    },
    {
      question: 'What if something gets damaged?',
      answer: 'Show us at delivery. We settle against the photos taken at pickup.',
      link: { href: '/claims', label: 'How claims work' },
    },
    {
      question: 'Do you dismantle and refit furniture?',
      answer: 'Yes. Standard beds, wardrobes and tables are included.',
    },
    {
      question: 'Why do you shift homes at night?',
      answer:
        "For local moves, it beats society truck timings and daytime traffic, so the shift is done in one night. If your society doesn't allow evening loading, we plan a day move.",
    },
    {
      question: 'Are prices higher at month-end?',
      answer:
        'The first and last few days of the month are the busiest. Your quote shows the difference, so you can pick a cheaper date if you can.',
    },
    {
      question: 'How do I choose the best packers and movers in India?',
      answer:
        "Before you pay, ask for a written itemised quote, the crew's names and IDs, and a GSTIN on the invoice.",
      link: { href: '/fraud-check', label: 'Fraud-check guide' },
    },
  ],
  closingHeading: 'Get a fixed price you can hold us to',
  closingText: 'Send a video on WhatsApp or fill in the form. A real person calls you back.',
};

export interface ServicesPageCopy {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  trust: string[];
  cardsHeading: string;
  chooserHeading: string;
  /** `need` holds service slugs; each becomes a link to that service. */
  chooser: Array<{ situation: string; need: string[] }>;
  chooserNoteLead: string;
  chooserNoteLink: string;
  chooserNoteTail: string;
  standardsHeading: string;
  standardsIntro: string;
  standards: Array<{ lead: string; rest: string; link?: LinkCopy }>;
  combineHeading: string;
  combineText: string;
  combineButton: string;
  faqHeading: string;
  faqs: FaqCopy[];
  closingHeading: string;
  closingText: string;
}

export const SERVICES_PAGE_COPY: ServicesPageCopy = {
  metaTitle: 'Packers and Movers Services in India | MrMoverPacker',
  metaDescription:
    'Home and office shifting, car and bike transport, packing and international moves. One fixed, written quote for every MrMoverPacker service.',
  h1: 'Packers and movers services, each with one fixed written price',
  intro:
    'A single room or a full office, a scooter or a car, Lucknow or London. Every move is planned by the same team, done by our own crews, and priced in writing before anything is packed.',
  trust: [
    'Own trained crews',
    'Photo inventory on every job',
    'GST invoice',
    'Claims data published',
  ],
  cardsHeading: 'Our relocation services',
  chooserHeading: 'Not sure which shifting service fits? Start here.',
  chooser: [
    { situation: 'Moving a 2 BHK across the city', need: ['home-shifting'] },
    {
      situation: 'Moving to another city with your car',
      need: ['home-shifting', 'car-transport'],
    },
    { situation: 'Relocating a 40-desk office', need: ['office-shifting'] },
    { situation: 'Hiring your own tempo, short of hands', need: ['loading-unloading'] },
    { situation: 'Short on time, not on transport', need: ['packing-unpacking'] },
    { situation: 'Sending only a bike to a new city', need: ['bike-transport'] },
    { situation: 'Moving to Dubai, Singapore or the UK', need: ['international-relocation'] },
  ],
  chooserNoteLead: 'Still unsure?',
  chooserNoteLink: 'Send a video of what you are moving on WhatsApp',
  chooserNoteTail: 'and we will tell you which service, or mix of services, makes sense.',
  standardsHeading: 'What every MrMoverPacker service includes',
  standardsIntro: 'Whether we move one bike or a whole office, five things never change:',
  standards: [
    {
      lead: 'A written, itemised quote',
      rest: 'after a video or in-person survey.',
      link: { href: '/pricing', label: 'How pricing works' },
    },
    {
      lead: 'Our own trained crew,',
      rest: 'ID-verified and named before the job.',
      link: { href: '/verify', label: 'Verify your crew' },
    },
    { lead: 'A photo inventory', rest: 'shared on WhatsApp before anything leaves.' },
    {
      lead: 'Basic liability cover,',
      rest: 'with optional transit insurance shown as one line.',
      link: { href: '/insurance', label: 'Insurance details' },
    },
    { lead: 'One GST invoice', rest: 'that matches the quote you approved.' },
  ],
  combineHeading: 'Moving more than one thing? One quote covers it all.',
  combineText:
    'Most moves are a mix: a household, a car, maybe a bike, sometimes a few weeks of storage in between. We put everything on one quote, one coordinator and one invoice, so you are not managing three vendors on the same day.',
  combineButton: 'Get one quote for everything',
  faqHeading: 'Questions about our moving services',
  faqs: [
    {
      question: 'Can I book only packing, or only labour?',
      answer:
        'Yes. Packing and unpacking, and loading and unloading, are booked on their own. You arrange the vehicle.',
    },
    {
      question: 'Do you store goods between moves?',
      answer:
        'Yes, short-term storage between pickup and delivery. It is quoted as a separate line before you agree.',
    },
    {
      question: 'Is my car or bike insured in transit?',
      answer:
        'Basic liability cover comes with every move. Full transit insurance up to the declared value is optional and shown on the quote.',
    },
    {
      question: 'How early should I book?',
      answer:
        'A week ahead is comfortable. For the first and last few days of the month, book earlier, as those dates fill first.',
    },
    {
      question: 'Which cities do you serve?',
      answer: 'We pick up from {count} cities across North India and deliver anywhere in India.',
      link: { href: '/#cities', label: 'See all cities' },
    },
  ],
  closingHeading: 'Tell us what is moving. Get one fixed price for all of it.',
  closingText: 'Send a short video on WhatsApp or fill in the form. A real person calls you back.',
};

/** CMS overrides: any field may be missing or blank. */
export type CopyOverrides<T> = { [K in keyof T]?: T[K] | null };

/**
 * The built-in copy with every filled-in CMS field laid over it. A blank text or an
 * empty list counts as "not set", so clearing a field in the CMS restores the default.
 */
export function withOverrides<T extends object>(
  defaults: T,
  overrides?: CopyOverrides<T> | null,
): T {
  const out = { ...defaults };
  if (!overrides) return out;
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    const v = overrides[key];
    if (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : v != null) {
      out[key] = v as T[keyof T];
    }
  }
  return out;
}

/** Fill `{count}` with the number of live cities. */
export const withCount = (text: string, count: number): string =>
  text.replaceAll('{count}', String(count));
