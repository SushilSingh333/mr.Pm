import type { ServicePage } from './types.js';

/** Home shifting page, from the owner's brief "Home_Shifting_Page" (5 October 2026). */
export const homeShifting: ServicePage = {
  title: 'Home Shifting Services | Fixed Written Price | MrMoverPacker',
  metaDescription:
    'Home shifting services on a fixed, itemised quote after a video survey. Own ID-verified crews, pickup from {count} cities. See every line before you book.',
  h1: 'Home Shifting Services with One Fixed, Written Price',
  subhead:
    'We survey your home on video, then put one itemised price in writing. Our own ID-verified crews pack, move and reassemble. Pickup from {count} North India cities, delivery anywhere in India.',
  trust: [
    'One written, itemised quote',
    'Basic liability cover on every move',
    'Crew and vehicle you can check',
    'Median claim time published',
  ],
  quoteMode: 'home',
  quoteNote:
    'A coordinator calls you back and sends one fixed, written price after a short video survey. We use your number only for your quote and never sell your data.',
  sections: [
    {
      heading: '',
      blocks: [
        {
          kind: 'text',
          body: 'MrMoverPacker does home shifting on one fixed price, set after a video survey. The number on the written quote is what you pay, and anything that could change it is listed first.\n\nOur [instant price check](/get-quote) gives you a working figure. To lock the price, [book a free video survey](/get-quote).',
        },
      ],
    },
    {
      heading: 'What home shifting services actually cover',
      blocks: [
        {
          kind: 'text',
          body: 'Our house shifting services cover packing, carrying and reassembly. Most of the cost sits in carrying: vehicle, floor rise and long carry. So two flats with the same contents can get very different quotes.\n\nWe never fix a price over the phone, because a number set without seeing your goods gets revised on moving day.',
        },
        {
          kind: 'table',
          columns: ['Job', 'What drives the cost'],
          rows: [
            ['Packing', 'Volume of goods, packing level, items that need crates'],
            [
              'Carrying',
              'Floors and lifts at both ends, truck-to-door distance, truck size, distance between homes',
            ],
            ['Reassembly', 'Number of pieces we dismantled'],
          ],
        },
        {
          kind: 'text',
          body: 'For other moves, see [all our moving services](/services), including [moving an office instead](/services/office-shifting) and [moving abroad](/services/international-relocation).',
        },
      ],
    },
    {
      heading: 'How your house shifting runs, from survey to reassembly',
      blocks: [
        {
          kind: 'steps',
          items: [
            {
              title: 'Survey',
              body: '[Book a free video survey](/get-quote) of about 10 minutes, send a WhatsApp video, or ask for a visit. Show every room, the almirahs, the loft and the stairs at both ends.',
            },
            {
              title: 'Written price',
              body: 'What we see, from kitchen cartons to truck parking, becomes a line on your quote, with its validity period printed. A token advance books your slot, and the balance is due on completion.',
            },
            {
              title: 'Packing day',
              body: 'We usually pack the day before, fragile items first, every carton labelled by room. Moving day is then loading only.',
            },
            {
              title: 'Inventory sign-off',
              body: 'Every item is photographed and listed. You and the crew lead sign the list, and a copy reaches you on WhatsApp before the truck leaves.',
            },
            {
              title: 'The road',
              body: 'Your goods travel alone on a separate vehicle. Intercity moves get a dated delivery window on your quote.',
            },
            {
              title: 'Delivery and reassembly',
              body: 'We unload into the labelled rooms, rebuild your furniture and tick off the inventory with you before you sign.',
            },
          ],
        },
        {
          kind: 'text',
          body: 'Before the move, work through [the 8-week home shifting checklist](/blog/home-shifting-checklist-8-weeks). [Packing fragile items so they survive](/blog/packing-fragile-items-that-survive) covers glass, frames and screens.',
        },
      ],
    },
    {
      heading: 'What a household shifting quotation should list',
      blocks: [
        {
          kind: 'text',
          body: 'Every line below can appear on our quote. If a line is not on yours, you do not pay it on moving day.',
        },
        {
          kind: 'table',
          columns: ['Line on the quote', 'When it appears'],
          rows: [
            ['Packing materials: cartons, wrap, foam, crates', 'Every quote'],
            ['Packing labour', 'Every quote with packing'],
            [
              'Dismantling and reassembly of beds, wardrobes, tables, modular units',
              'When the survey finds them',
            ],
            ['Loading and unloading', 'Every quote'],
            ['A separate vehicle, sized at the survey', 'Every quote'],
            ['Move coordinator, who runs your move', 'Every quote, included'],
            ['Floor rise, for stairs without a lift', 'Only when there are stairs'],
            ['Long carry', 'Only when the truck parks over 50 metres from your door'],
            ['Special crating for a piano, artwork or large appliances', 'Only for listed items'],
            ['Fixed-time or express delivery', 'Only if you ask for it'],
            ['Short-term storage', 'Only if you need it'],
            ['Tolls and permits', 'Intercity moves'],
            ['Basic liability cover', 'Every quote, included'],
            ['Transit insurance up to your declared value', 'Only if you choose it'],
            ['GST', 'Every quote, with a GST invoice'],
          ],
        },
        {
          kind: 'text',
          body: 'Items added after the survey are priced with you before we do that work. Before comparing quotes, read [what a fair moving quote includes](/blog/what-a-fair-moving-quote-includes).',
        },
      ],
    },
    {
      heading: 'What moves your home shifting charges',
      blocks: [
        {
          kind: 'text',
          body: 'Our [instant price check](/get-quote) is built from our rate card, using these inputs.',
        },
        {
          kind: 'table',
          columns: ['Input', 'Why it changes the price'],
          rows: [
            [
              'Truck size: 10, 12, 14, 15, 16, 17 or 19 ft',
              'A bigger truck costs more to run. The survey confirms the size.',
            ],
            [
              'Packing level: Basic (cartons and wrap) or Standard (3-layer wrap and crates)',
              'More material and crew time per item',
            ],
            [
              'Floor at pickup and drop, ground to 5th and above',
              'Each floor without a lift adds carrying time',
            ],
            ['Lift at each end', 'A lift cuts most of the floor-rise cost'],
            [
              'Pickup and drop locations',
              'Distance sets fuel, driver time and tolls. Local and intercity are priced separately.',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Dates matter too. The first and last few days of the month are busiest, and your quote shows the difference.\n\nThe full method is on [how our fixed pricing works](/pricing).',
        },
      ],
    },
    {
      heading: "When the house shifting charges calculator is enough, and when it isn't",
      blocks: [
        {
          kind: 'table',
          columns: ['', 'Instant price check', 'Survey quote'],
          rows: [
            [
              'Sees',
              'The truck, packing, floor and lift you enter',
              'Every room and large piece, access at both ends',
            ],
            [
              'Misses',
              'Wardrobes that will not come apart, crating, truck parking distance, society truck timings',
              'Only what you do not show us',
            ],
            ['Accuracy', 'About ±12%, a guide only', 'Fixed, the price you pay'],
            ['Use it for', 'A budget', 'Booking'],
          ],
        },
        {
          kind: 'text',
          body: 'If any of those blind spots apply to your home, book a survey before relying on the estimate.',
        },
      ],
    },
    {
      heading: "What our household shifting services include, and what they don't",
      blocks: [
        {
          kind: 'table',
          columns: ['Task', 'Who does it'],
          rows: [
            ['Packing every room, including the kitchen and almirahs', 'Our crew'],
            ['Dismantling and refitting standard beds, wardrobes and tables', 'Our crew'],
            ['Defrosting and draining the fridge and washing machine the day before', 'You'],
            ['Geyser removal or fitting, drilling, electrical and carpentry work', 'A specialist'],
            ['Appliance servicing', 'A third party, charged extra'],
            ['Unpacking cartons', 'Our crew, when you add it to your quote'],
            ['Society gate pass and lift slot', 'Your move coordinator'],
          ],
        },
        {
          kind: 'text',
          body: 'The survey settles which jobs need a specialist and cost extra.\n\nFor part of the job only, book [packing and unpacking on its own](/services/packing-unpacking), or [a crew for loading and unloading only](/services/loading-unloading). Vehicles go separately: see [moving your car with the household](/services/car-transport) and [sending your bike separately](/services/bike-transport).',
        },
      ],
    },
    {
      heading: 'Overnight home relocation for societies with truck curfews',
      blocks: [
        {
          kind: 'text',
          body: 'Local moves can run overnight: loaded by 8 PM, driven on empty roads, unloaded once your new society opens its gate. It suits societies that stop trucks or lifts by day, and you keep your working day.',
        },
        {
          kind: 'text',
          body: 'Your move coordinator arranges both permissions: an evening gate pass at the old society and a morning lift and truck slot at the new one.\n\nIf evening loading is not allowed, we plan a day move. Local truck timings are on each city page.',
        },
      ],
    },
    {
      heading: 'Cover, photos and claims on every house shifting job',
      blocks: [
        {
          kind: 'text',
          body: 'Every move carries basic liability cover. [Optional transit insurance](/insurance) covers up to your declared value, with the cover and its exclusions on your certificate. Ask for the certificate before loading day.\n\nRaising a claim is free, and it is assessed against the signed photo inventory:',
        },
        {
          kind: 'list',
          items: [
            'Report damage with photos within the claims window on your invoice, ideally at handover.',
            'We respond first within 24 hours, checking your report against the pickup photos.',
            'We agree repair, replacement or reimbursement, based on your declared value and any transit insurance.',
          ],
        },
        {
          kind: 'text',
          body: 'From our first quarterly report we publish [our median claim settlement time](/claims), updated each reporting period.',
        },
      ],
    },
    {
      heading: 'Home shifting crews you can verify before they load',
      blocks: [
        {
          kind: 'text',
          body: "Our own trained crews handle your goods, never daily-wage labour. Every crew member and vehicle is ID-verified, and your coordinator sends their names and the vehicle number in advance. [Check your crew's ID](/verify) and the number plate at your door before loading.",
        },
      ],
    },
  ],
  faqHeading: 'Home shifting questions people ask before booking',
  faqs: [
    {
      question: 'Is GST charged on home shifting?',
      answer:
        'Yes, as its own line on your quote, with a GST invoice for every move. Our GST details are on [our licences and GST page](/company/licences).',
    },
    {
      question: 'Will you pack everything in the house?',
      answer:
        'Yes, except what you keep with you: documents, jewellery, cash, medicines, keys and chargers. We do not carry hazardous or flammable materials, firearms, illegal items or perishables; the survey confirms the full list. For packing only, book our [packing and unpacking service](/services/packing-unpacking).',
    },
    {
      question: 'Will the crew remove and refit my AC?',
      answer:
        'A technician removes and refits a split AC, charged at actual cost as its own quote line. Gas charging and new piping are specialist jobs, flagged at the survey.',
    },
    {
      question: 'Will I be charged octroi or entry tax?',
      answer:
        'No. Octroi was abolished when GST came in on 1 July 2017, so it should not appear on any moving quote. If you see it, use our [checks to run before you pay any mover](/fraud-check).',
    },
    {
      question: 'Can I pack myself and book only the crew?',
      answer:
        'Yes. [Book loading and unloading only](/services/loading-unloading) and our trained crew loads your vehicle. Items you pack without our inspection are not covered the same way.',
    },
    {
      question: 'Are my goods insured during the move?',
      answer:
        'Partly. Every move carries basic liability cover. Full cover up to your declared value is [optional transit insurance](/insurance), priced as one quote line.',
    },
  ],
  citiesHeading: 'Home shifting from {count} North India cities',
  citiesIntro: 'We pick up from {count} cities and deliver anywhere in India.',
  ctaHeading: 'Get one fixed price for your home shifting',
  ctaText:
    'Send us a video on WhatsApp or book a video survey, and you get an itemised, written price. That price is what you pay.',
  related: [
    { label: 'Packing and unpacking services', href: '/services/packing-unpacking' },
    { label: 'Car transport services', href: '/services/car-transport' },
    { label: 'Office shifting services', href: '/services/office-shifting' },
  ],
  serviceType: 'Home shifting',
};
