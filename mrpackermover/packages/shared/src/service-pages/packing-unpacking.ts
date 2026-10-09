import type { ServicePage } from './types.js';

/** Packing and unpacking page, from the owner's brief "PackingUnpacking_FINAL" (8 October 2026). */
export const packingUnpacking: ServicePage = {
  title: 'House Packing and Unpacking Services | MrMoverPacker',
  metaDescription:
    'House packing and unpacking services in Delhi NCR and Meerut. Room-by-room packing, labelled cartons, unpacking and debris removal. One fixed price.',
  h1: 'House packing and unpacking services, done room by room at one fixed price',
  subhead:
    'Most breakage is decided at the packing table, long before the truck moves. Our trained crew packs every room with the right material for each item, labels every carton, and unpacks it all at your new home.',
  trust: [
    'Trained, ID-verified packers',
    'Every carton labelled by room',
    'Fragile items photographed once packed',
    'Debris cleared after unpacking',
  ],
  quoteMode: 'packing',
  quoteNote:
    'Tell us your home size and packing date. A coordinator sends one fixed, written price.',
  sections: [
    {
      heading: 'When should you book packing and unpacking on its own?',
      blocks: [
        {
          kind: 'text',
          body: 'When the transport is sorted and the packing is the part you dread.',
        },
        {
          kind: 'table',
          columns: ['Your situation', 'What we do'],
          rows: [
            [
              'You have your own truck, tempo or a company transport',
              'Pack everything before loading day so it is ready to go',
            ],
            [
              'Your employer pays for transport but not packing',
              'Pack and label, then unpack at the other end',
            ],
            [
              'You are short on time before a move',
              'Hand the packing to a trained crew and keep your weekends',
            ],
            [
              'Renovating or putting things into storage',
              'Pack and label so they come back out in order',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Need the truck and loading too? [Home shifting](/services/home-shifting) covers everything on one quote.',
        },
      ],
    },
    {
      heading: 'How do professional packers pack a house?',
      blocks: [
        {
          kind: 'text',
          body: 'Item by item, with the material matched to what can break. Here is what goes on what.',
        },
        {
          kind: 'table',
          columns: ['Room or item', 'How we pack it'],
          rows: [
            [
              'Crockery and glassware',
              'Each piece wrapped in paper, then bubble, standing in cell-partition cartons',
            ],
            ['Kitchen utensils and jars', 'Grouped, lids taped, packed in double-wall cartons'],
            [
              'TV, monitor, laptop',
              'Original box if you have it; otherwise foam corners, bubble and a rigid carton, screen upright',
            ],
            [
              'Fridge, washing machine',
              'Defrosted or drained in advance, doors and drum secured, stretch-wrapped',
            ],
            ['Sofa, bed, dining table', 'Corners guarded, wrapped in bubble and stretch film'],
            [
              'Mirrors, glass tops, framed art',
              'Corner protectors and a wooden or corrugated frame',
            ],
            ['Clothes', 'Wardrobe cartons so they travel on hangers'],
            ['Books and documents', 'Small cartons, so no box is too heavy to lift safely'],
            [
              'Puja items, idols, keepsakes',
              'Wrapped separately, packed in a marked carton you can open first',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Every carton is labelled with its room and contents, and fragile cartons are photographed once packed. Read more on [how to pack fragile items](/blog/packing-fragile-items-that-survive).',
        },
      ],
    },
    {
      heading: 'What packing material do professional movers use?',
      blocks: [
        {
          kind: 'text',
          body: 'Layers, not just boxes. Each layer does one job.',
        },
        {
          kind: 'table',
          columns: ['Material', 'What it does', 'Used on'],
          rows: [
            [
              'Packing paper',
              'First layer, stops scratches and ink marks',
              'Crockery, glass, steel, polished wood',
            ],
            ['Bubble wrap', 'Absorbs knocks', 'Fragile items, electronics, furniture corners'],
            ['Foam sheets and corners', 'Protects screens and edges', 'TVs, monitors, glass tops'],
            [
              'Stretch film',
              'Holds wrapping in place, keeps dust out',
              'Sofas, mattresses, appliances',
            ],
            [
              'Double-wall cartons',
              'Stronger sides that do not crush when stacked',
              'Kitchen, books, heavy items',
            ],
            [
              'Cell-partition cartons',
              'A separate slot for each glass or cup',
              'Glassware and crockery',
            ],
            ['Wardrobe cartons', 'Clothes travel on hangers', 'Hanging clothes'],
            [
              'Wooden crating',
              'Rigid frame for the most fragile pieces',
              'Mirrors, glass, art, on request',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Basic packing uses cartons and wrap. Standard adds 3-layer wrapping and crates for fragile pieces. All material is included in the quote.',
        },
      ],
    },
    {
      heading: 'Do packers also unpack at the new home?',
      blocks: [
        {
          kind: 'text',
          body: 'Yes, if you book unpacking. The crew opens each carton in the room on its label, places items where you want them, and takes away all the packing debris before leaving. You are not left living out of boxes or with a flat full of bubble wrap.',
        },
      ],
    },
    {
      heading: 'How much do packing and unpacking services cost?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on how much you own and how much of it is fragile. You get one fixed, written price, with GST and all material included.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it changes the price'],
          rows: [
            ['Home size', 'More rooms, more cartons, more hours'],
            ['Packing level', 'Standard costs more than Basic'],
            ['Fragile items', 'A full crockery cabinet or glass art needs more material and time'],
            ['Appliances', 'Each fridge, washing machine or TV adds packing'],
            ['Unpacking', 'Packing only costs less than packing and unpacking'],
          ],
        },
        {
          kind: 'text',
          body: 'Fill in the form above and we send your fixed, written price. See [how pricing works](/pricing).',
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
    {
      heading: 'How to get ready for professional packers',
      blocks: [
        {
          kind: 'list',
          items: [
            'Set aside what you will carry yourself: cash, jewellery, documents, medicines, chargers.',
            'Give away or throw out what you will not use. Less to pack means a lower price.',
            'Defrost the fridge and drain the washing machine a day before.',
            'Tell us about anything precious or unusual, like glass art or a piano.',
            'Book the society lift if packed cartons need to come down the same day.',
          ],
        },
      ],
    },
  ],
  faqHeading: 'Questions about packing and unpacking services',
  faqs: [
    {
      question: 'How much do packing services cost?',
      answer:
        'It depends on home size, packing level, fragile items, appliances and whether you add unpacking. Fill in the form above and we send one fixed, written price; your written quote is final.',
    },
    {
      question: 'How long does packing take?',
      answer: 'We usually pack the day before loading. Your quote states the time your home needs.',
    },
    {
      question: 'Do you bring the boxes and packing material?',
      answer:
        'Yes. Cartons, paper, bubble wrap, foam, stretch film and tape are all included in the price.',
    },
    {
      question: 'Can I pack some things myself?',
      answer:
        'Yes, and it lowers the quote. Damage inside cartons you packed yourself is not covered, so leave the fragile items to us.',
    },
    {
      question: 'What if something packed by you breaks?',
      answer:
        'Tell us at unpacking. Damage caused by our crew is handled through our written claims process. See [how claims work](/claims).',
    },
    {
      question: 'Do you take away the packing waste?',
      answer:
        'Yes. When you book unpacking, the crew clears all cartons, wrap and debris before leaving.',
    },
    {
      question: 'Can you pack for storage or renovation?',
      answer: 'Yes. Everything is labelled by room and contents so it comes back out in order.',
    },
  ],
  citiesHeading: 'Packing and unpacking services in Delhi NCR and Meerut',
  citiesIntro: 'Our packing crews work in {count} cities.',
  ctaHeading: 'Hand over the packing. Keep your weekends.',
  ctaText:
    'Tell us your home size and moving date. You get one written price, and a real person calls you back.',
  related: [
    { label: 'Loading and unloading', href: '/services/loading-unloading' },
    { label: 'Home shifting', href: '/services/home-shifting' },
    { label: 'All services', href: '/services' },
  ],
  serviceType: 'House packing and unpacking',
};
