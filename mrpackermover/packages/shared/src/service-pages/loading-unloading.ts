import type { ServicePage } from './types.js';

/** Loading and unloading page, from the owner's brief "LoadingUnloading_FINAL" (8 October 2026). */
export const loadingUnloading: ServicePage = {
  title: 'Labour for Shifting | Loading and Unloading | MrMoverPacker',
  metaDescription:
    'Hire trained, ID-verified labour for shifting in Delhi NCR and Meerut. Loading, stacking, tying and unloading for your own truck. One fixed price.',
  h1: 'Labour for shifting: trained loading and unloading crew at one fixed price',
  subhead:
    'You have the truck. We bring the hands that know how to use it. Our own trained, ID-verified crew loads, stacks, ties down and unloads your goods, for one price agreed in writing.',
  trust: [
    'ID-verified crew, not chowk labour',
    'Fixed written price',
    'Ropes and tie-downs brought by us',
    'Written claims process',
  ],
  quoteMode: 'labour',
  quoteNote:
    'Tell us what you are moving and the floors at each end. A coordinator sends one fixed, written price.',
  sections: [
    {
      heading: 'When do you need only loading and unloading labour?',
      blocks: [
        {
          kind: 'text',
          body: 'When the vehicle is sorted but the lifting is not. Common cases:',
        },
        {
          kind: 'table',
          columns: ['Your situation', 'What we do'],
          rows: [
            [
              'You have booked your own truck or tempo',
              'Load it at one end, unload it at the other',
            ],
            [
              'You have packed everything yourself',
              'Carry, stack and secure the boxes and furniture',
            ],
            [
              'Moving within the same building or society',
              'Carry goods from one flat to another, no vehicle needed',
            ],
            ['A big delivery and nobody to carry it in', 'Unload and place it in the right room'],
            [
              'A part load where the last stretch is yours',
              'Unload the truck and carry goods to your door',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'If you also need packing, transport or reassembly, [home shifting](/services/home-shifting) covers the whole job on one quote.',
        },
      ],
    },
    {
      heading: 'What does a loading and unloading crew do?',
      blocks: [
        {
          kind: 'text',
          body: 'They move your goods from the room to the truck and back, without damage. Specifically:',
        },
        {
          kind: 'list',
          items: [
            'Carry goods down stairs and through lifts, with the heavy pieces handled by two or more people.',
            'Protect lift walls and door frames from scrapes on the way out.',
            'Load the truck in the right order: heavy items first against the cabin, cartons above, fragile items on top.',
            'Tie down every layer with our own ropes and straps so nothing shifts on the road.',
            'Unload at the new address and place furniture and cartons in the rooms you choose.',
          ],
        },
        {
          kind: 'text',
          body: 'What the crew does not do: packing, transport, dismantling or reassembling furniture, or any electrical, plumbing or carpentry work. Need packing? See our [packing and unpacking services](/services/packing-unpacking).',
        },
      ],
    },
    {
      heading: 'How should a truck be loaded so nothing breaks?',
      blocks: [
        {
          kind: 'text',
          body: 'Heavy and flat at the bottom, light and fragile on top, everything tied. Most damage in a self-arranged move comes from a badly stacked truck, not from the road.',
        },
        {
          kind: 'table',
          columns: ['Order', 'What goes in', 'Why'],
          rows: [
            [
              '1',
              'Fridge, washing machine, almirah, against the cabin wall',
              'Heaviest weight closest to the axle, upright',
            ],
            [
              '2',
              'Beds, sofa, dining table, standing on their edges',
              'Uses the height, stops sliding',
            ],
            [
              '3',
              'Heavy cartons (books, kitchen) as a flat layer',
              'Builds a stable floor for the next layer',
            ],
            ['4', 'Light cartons, chairs, mattresses', 'Fills gaps so nothing can move'],
            [
              '5',
              'Fragile cartons, TV, mirrors, at the top and back',
              'Nothing heavy above them, last out at the other end',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Each layer is roped or strapped before the next one goes in.',
        },
      ],
    },
    {
      heading: 'Trained crew vs daily-wage labour: what is the difference?',
      blocks: [
        {
          kind: 'table',
          columns: ['', 'Daily-wage labour', 'MrMoverPacker crew'],
          rows: [
            [
              'Who turns up',
              'Whoever is free that morning',
              'Named crew, ID-verified, details shared in advance',
            ],
            ['Training', 'None', 'Trained by us in lifting, stacking and tying'],
            ['Ropes and straps', 'Often none', 'Brought by us'],
            [
              'Price',
              'Bargained on the spot, often raised mid-job',
              'Fixed, in writing, before the day',
            ],
            ['If something breaks', 'Nobody is responsible', 'Written claims process'],
          ],
        },
        {
          kind: 'text',
          body: '[Verify your crew](/verify). [How claims work](/claims).',
        },
      ],
    },
    {
      heading: 'How much does labour for shifting cost?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on how much you are moving and how hard it is to carry. You get one fixed, written price before the day, with GST shown.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it changes the price'],
          rows: [
            ['Load size', 'A 1 RK needs fewer hands and less time than a 3 BHK'],
            ['Floors and lift', 'Stairs without a working lift take more time and people'],
            [
              'Carry distance',
              'A long walk from where the truck can legally stop to your door adds time',
            ],
            ['Heavy items', 'Almirahs, fridges and sofas may need an extra person'],
            ['Loading only, or both ends', 'One end costs less than loading and unloading'],
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
      heading: 'How to get ready for the loading crew',
      blocks: [
        {
          kind: 'list',
          items: [
            'Book the society lift and confirm loading hours with your RWA at both ends.',
            'Seal and label every carton with its room.',
            'Empty, defrost and dry the fridge; drain the washing machine.',
            'Dismantle beds and large furniture, or book [home shifting](/services/home-shifting) and we do it.',
            'Keep cash, jewellery, documents and medicines with you.',
            'Make sure the truck is at the gate when the crew arrives, so the crew can start on time.',
          ],
        },
      ],
    },
  ],
  faqHeading: 'Questions about loading and unloading labour',
  faqs: [
    {
      question: 'How much does labour for shifting cost?',
      answer:
        'It depends on load size, floors, lift access, carry distance and heavy items. Fill in the form above and we send one fixed, written price; your written quote is final.',
    },
    {
      question: 'How many labourers do I need?',
      answer:
        'You do not have to guess. We set the crew size from your load, floors and heavy items, and it is fixed in the quote.',
    },
    {
      question: 'Does the crew bring ropes and straps?',
      answer: 'Yes. Ropes and tie-downs are included, so your load is secured layer by layer.',
    },
    {
      question: 'Will they dismantle and reassemble furniture?',
      answer:
        'No. This service is carrying, loading and unloading only. For dismantling and reassembly, book [home shifting](/services/home-shifting).',
    },
    {
      question: 'Can I book only loading or only unloading?',
      answer: 'Yes. Book one end or both; the quote shows which.',
    },
    {
      question: 'What if something gets damaged while being carried?',
      answer:
        'Tell the crew lead on the spot. Handling damage by our crew is covered by our written claims process. See [how claims work](/claims).',
    },
    {
      question: 'Can you move goods within the same building or society?',
      answer: 'Yes. Flat to flat, floor to floor, no vehicle needed.',
    },
  ],
  citiesHeading: 'Loading and unloading labour in Delhi NCR and Meerut',
  citiesIntro: 'Our crews work in {count} cities.',
  ctaHeading: 'You have the truck. Book the hands.',
  ctaText:
    'Tell us what you are moving and the floors at each end. You get one written price, and a real person calls you back.',
  related: [
    { label: 'Packing and unpacking', href: '/services/packing-unpacking' },
    { label: 'Home shifting', href: '/services/home-shifting' },
    { label: 'All services', href: '/services' },
  ],
  serviceType: 'Loading and unloading labour',
};
