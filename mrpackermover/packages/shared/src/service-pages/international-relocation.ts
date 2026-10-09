import type { ServicePage } from './types.js';

/** International relocation page, from the owner's brief "InternationalRelocation_FINAL" (8 October 2026). */
export const internationalRelocation: ServicePage = {
  title: 'International Packers and Movers from India | MrMoverPacker',
  metaDescription:
    'International packers and movers from Delhi NCR. Export packing, sea or air freight, customs paperwork and one fixed written quote, door to door.',
  h1: 'International packers and movers, door to door with one fixed price',
  subhead:
    'Moving abroad is mostly paperwork and planning, with a lot of packing in between. We pack your home in Delhi NCR to export standard, book sea or air freight, prepare the documents with you, and coordinate clearance at both ends, for one written price.',
  trust: [
    'Export-grade packing and crating',
    'Customs documents prepared with you',
    'Marine transit insurance option',
    'One written, itemised quote',
  ],
  quoteMode: 'international',
  quoteNote:
    'Tell us where you are going and roughly when. A coordinator sends one fixed, written price.',
  sections: [
    {
      heading: 'How does an international move work?',
      blocks: [
        {
          kind: 'text',
          body: 'In seven steps, over several weeks. Most of the time goes on paperwork and vessel schedules, not packing, so start early.',
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Survey and quote',
              body: 'A video or home survey of what is going. You get one written, itemised price.',
            },
            {
              title: 'Plan the shipment',
              body: 'Sea, air or both, and the container size, matched to your moving date.',
            },
            {
              title: 'Documents',
              body: "We prepare the valued inventory and export papers with you and check the destination's rules.",
            },
            {
              title: 'Export packing',
              body: 'Heavier materials, moisture barriers, and crates for fragile items, all labelled to match the inventory.',
            },
            {
              title: 'Export clearance and departure',
              body: 'Customs clearance in India, then the container or air shipment leaves.',
            },
            {
              title: 'Destination clearance',
              body: 'Customs at the destination, coordinated with you.',
            },
            {
              title: 'Delivery',
              body: 'Your goods are delivered to your new home abroad.',
            },
          ],
        },
        {
          kind: 'text',
          body: 'Plan backwards from your settling-in date, not forwards from your departure.',
        },
      ],
    },
    {
      heading: 'Sea freight or air freight: which should you choose?',
      blocks: [
        {
          kind: 'text',
          body: 'Sea for furniture and most household goods; air only for what you need in the first weeks. Many families send a small air shipment first and the sea shipment after.',
        },
        {
          kind: 'table',
          columns: ['', 'Sea freight', 'Air freight'],
          rows: [
            [
              'Best for',
              'Furniture, appliances, most of a home',
              "Clothes, laptop, documents, a child's essentials",
            ],
            [
              'Priced by',
              'Volume (cubic metres)',
              'Weight (actual or volumetric, whichever is higher)',
            ],
            ['Cost', 'Much lower per item moved', 'Much higher, so ship as little as possible'],
            ['Speed', 'Weeks', 'Days to a couple of weeks'],
          ],
        },
        {
          kind: 'text',
          body: 'How much space will you need? As a rough guide, a 20 ft container suits a 1 to 2 BHK and a 40 ft container a 3 to 4 BHK. Smaller loads may suit a shared container, where you pay only for the space you use. The survey confirms what fits your move.',
        },
      ],
    },
    {
      heading: 'How is export packing different from local packing?',
      blocks: [
        {
          kind: 'text',
          body: 'It is built for weeks at sea, humidity and several rounds of port handling, not one truck ride.',
        },
        {
          kind: 'table',
          columns: ['', 'Local move', 'Export move'],
          rows: [
            [
              'Material',
              'Cartons, paper, bubble',
              'Heavier cartons, extra layers, moisture barriers',
            ],
            ['Fragile items', 'Bubble and foam', 'Wooden crates for glass, art and valuables'],
            [
              'Wood used',
              'Any',
              'Heat-treated and stamped to the international ISPM 15 standard, as most countries require',
            ],
            ['Labelling', 'Room names', 'Numbered to match the valued inventory, item by item'],
          ],
        },
      ],
    },
    {
      heading: 'What documents do you need to move household goods abroad?',
      blocks: [
        {
          kind: 'text',
          body: "The usual set is your passport, visa or residence permit, a valued inventory, proof of your new address, and the destination country's customs forms. The exact list depends on where you are going, and we check it with you before packing.",
        },
        {
          kind: 'list',
          items: [
            'Passport copy, with the visa or residence permit for your destination',
            'Valued inventory: every carton and item, with its value, matching the numbers on the cartons',
            'Proof of address at the destination (lease, employer letter or similar)',
            'Destination customs forms, which differ by country',
          ],
        },
        {
          kind: 'text',
          body: 'Most shipments that get stuck at customs are stuck on paperwork, usually because the inventory and the declaration do not match. We prepare both together so they do.',
        },
      ],
    },
    {
      heading: 'How much does it cost to ship household goods abroad?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends mainly on volume, destination and mode. You get one fixed, written quote for everything we handle, with destination duties shown separately.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it changes the price'],
          rows: [
            ['Volume', 'More cubic metres, bigger container, higher freight'],
            ['Destination', 'Distance, port and destination handling charges differ by country'],
            ['Sea or air', 'Air costs far more for the same goods'],
            ['Crating', 'Wooden crates for fragile and valuable items add cost'],
            ['Insurance', 'Optional marine transit insurance, priced on your declared value'],
          ],
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
    {
      heading: 'How long does an international move take?',
      blocks: [
        {
          kind: 'text',
          body: 'By sea, usually 3 to 12 weeks door to door depending on the destination. By air, usually 1 to 2 weeks. Vessel schedules and customs at both ends decide the exact dates.',
        },
        {
          kind: 'table',
          columns: ['Destination', 'By sea, door to door', 'By air, door to door'],
          rows: [
            ['UAE and the Gulf', '3 to 5 weeks', 'About 1 week'],
            ['UK and Europe', '6 to 10 weeks', '1 to 2 weeks'],
            ['USA and Canada', '8 to 12 weeks', '1 to 2 weeks'],
            ['Australia and New Zealand', '7 to 11 weeks', '1 to 2 weeks'],
            ['Singapore and South-East Asia', '3 to 6 weeks', 'About 1 week'],
          ],
        },
        {
          kind: 'text',
          body: 'These are typical ranges. Your quote gives dates for your route.',
        },
      ],
    },
    {
      heading: 'What cannot be shipped when moving abroad?',
      blocks: [
        {
          kind: 'text',
          body: 'Every country has its own prohibited and restricted lists, and we check yours before packing. As a general rule:',
        },
        {
          kind: 'table',
          columns: ['Category', 'Examples', 'What to do'],
          rows: [
            [
              'Carry with you',
              'Passports, cash, jewellery, medicines, laptops with work data',
              'Hand luggage, never the container',
            ],
            [
              'Usually not allowed',
              'Gas cylinders, aerosols, paints, fuel, loose batteries, firearms',
              'Sell, give away or dispose of before packing',
            ],
            [
              'Often restricted',
              'Alcohol, plants, seeds, soil, food items, some electronics',
              "Check the destination's rules; we advise item by item",
            ],
            [
              'Needs extra care',
              'Wooden furniture and handicrafts',
              'Must be clean and free of pests; Australia and New Zealand are especially strict',
            ],
          ],
        },
      ],
    },
  ],
  faqHeading: 'International relocation questions',
  faqs: [
    {
      question: 'How much does international relocation cost?',
      answer:
        'It depends on volume, destination, sea or air, and crating. You get one written, itemised quote after a survey; destination duties are shown separately.',
    },
    {
      question: 'How long does an international move take?',
      answer:
        'Usually 3 to 12 weeks by sea and 1 to 2 weeks by air, door to door, depending on the destination.',
    },
    {
      question: 'When should I start planning?',
      answer:
        'At least 6 to 8 weeks before you want your goods to arrive, and earlier for long sea routes like North America or Australia.',
    },
    {
      question: 'Who pays customs duty at the destination?',
      answer:
        "You do, to the destination country. Many countries allow used personal effects in duty-free or at a reduced rate when you are taking up residence; your destination's rules decide.",
    },
    {
      question: 'Can I send some things by air and the rest by sea?',
      answer:
        'Yes. Most families send a small air shipment for the first weeks and the rest by sea.',
    },
    {
      question: 'Is my shipment insured?',
      answer:
        'Optional marine transit insurance covers your goods up to their declared value. We recommend it for sea shipments. See [transit insurance](/insurance).',
    },
    {
      question: 'What happens if something is damaged?',
      answer:
        'Report it at delivery against the numbered inventory. It is handled under our written claims process and your insurance cover. See [how claims work](/claims).',
    },
  ],
  citiesHeading: 'International relocation from Delhi NCR and Meerut',
  citiesIntro: 'We pack and collect from {count} cities.',
  ctaHeading: 'Moving abroad? Start with one written price.',
  ctaText:
    'Tell us where you are going and roughly when. We will plan the shipment, list the documents you need, and give you one fixed quote. A real person calls you back.',
  related: [
    { label: 'Packing and unpacking', href: '/services/packing-unpacking' },
    { label: 'Home shifting', href: '/services/home-shifting' },
    { label: 'All services', href: '/services' },
  ],
  serviceType: 'International relocation',
};
