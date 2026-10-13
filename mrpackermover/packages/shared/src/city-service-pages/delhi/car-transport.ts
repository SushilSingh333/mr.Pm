import type { GeoPage } from '../../geo-pages/types.js';

/** Car transport from Delhi (round 5): Delhi zonal registration codes, the faceless NOC, the NGT and Supreme Court age rule, CAQM carrier rule, loading points and the highways out. */
export const delhiCarTransport: GeoPage = {
  title: 'Car Transport from Delhi | Door to Door | MrMoverPacker',
  metaDescription:
    'Car transport from Delhi on an open or enclosed carrier. NOC, age rules and loading point checked first, then one fixed, written price for your route.',
  h1: 'Car transport from Delhi, with the NOC and loading point planned',
  subhead:
    'Car transport from Delhi starts with the Transport Department NOC, the NGT age rule and where a carrier may stand. We check all three against your DL registration, then send one written price.',
  trust: [
    'Photo condition report at pickup',
    'Loading point agreed before you book',
    'Driven 0 km on the way',
    'Transit insurance available',
  ],
  sections: [
    {
      heading: 'What makes car transport from Delhi different?',
      blocks: [
        {
          kind: 'text',
          body: 'Our [car transport](/services/car-transport) crews load the same way everywhere. A car leaving [Delhi](/packers-and-movers/delhi) also meets NGT, CAQM and Delhi Traffic Police rules.',
        },
        {
          kind: 'list',
          items: [
            'Age rule. Following NGT orders upheld by the Supreme Court, diesel cars over 10 years and petrol cars over 15 years may not ply in Delhi NCR.',
            'Impounding risk. Under Transport Department guidelines, an overage car parked on a public road can be impounded, so it leaves on a carrier.',
            'Faceless NOC. The Transport Department lists the NOC among its online services, with Aadhaar login and online fees.',
            'Carrier hours. Goods vehicles face daytime no-entry hours from Delhi Traffic Police on many roads, so a carrier often loads after dark.',
            'Cleaner carriers. Under a CAQM direction, a goods vehicle registered outside the city must be BS-VI diesel, CNG, LNG or electric to enter.',
          ],
        },
      ],
    },
    {
      heading: 'Which Delhi office registered your car?',
      blocks: [
        {
          kind: 'text',
          body: 'The DL code on your number plate names the zonal office that registered the car. The NOC itself is applied for online.',
        },
        {
          kind: 'table',
          columns: ['Code', 'Zonal office'],
          rows: [
            ['DL-1', 'Mall Road, Vishwavidyalaya'],
            ['DL-2', 'Indraprastha Depot'],
            ['DL-3', 'DDA Market, Sheikh Sarai'],
            ['DL-4', 'Janakpuri'],
            ['DL-5', 'Loni Road, Shahdara'],
            ['DL-6', 'ISBT Sarai Kale Khan'],
            ['DL-7', 'Mayur Vihar'],
            ['DL-8', 'Wazirpur'],
            ['DL-9', 'Sector 10, Dwarka'],
            ['DL-10', 'Raja Garden'],
            ['DL-11', 'Rohini'],
            ['DL-12', 'Vasant Vihar'],
            ['DL-13', 'Surajmal Vihar'],
          ],
        },
      ],
    },
    {
      heading: 'What paperwork does a car leaving Delhi need?',
      blocks: [
        {
          kind: 'text',
          body: 'Mostly yours, with the Transport Department and later the RTO at your new home.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'NOC on Form 28 from the Transport Department',
              'You, online at its website',
              'Before you re-register',
            ],
            [
              'Age check for a diesel car past 10 years or petrol past 15',
              'You, with the Transport Department',
              'Before booking',
            ],
            [
              'Loading point the carrier can reach, such as a Dwarka sector road',
              'We agree it with you',
              'Before booking',
            ],
            ['Copies of the RC, insurance and PUC', 'You', 'At pickup'],
            [
              'Gate pass for the car, if your IP Extension or Dwarka society asks for one',
              'You, with our crew details',
              'The day before pickup',
            ],
            [
              'New registration under Section 47, on Form 27 with the NOC',
              'You, at the RTO in your new state',
              'Within 12 months there',
            ],
          ],
        },
      ],
    },
    {
      heading: 'How much does car transport from Delhi cost?',
      blocks: [
        {
          kind: 'text',
          body: 'The route, the carrier type and the loading point decide it, whether the car leaves from Rohini or Vasant Kunj.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects car transport from Delhi'],
          rows: [
            ['Route', 'Busy NH 48 runs towards Mumbai, Pune and Bangalore fill carriers both ways'],
            [
              'Carrier',
              'Enclosed costs more than open, and keeps monsoon rain off on NH 44 or NH 48',
            ],
            [
              'Loading point',
              'A gate on a wide Dwarka sector road is simpler than a Lajpat Nagar lane',
            ],
            ['Car size', 'An SUV takes more deck space than a hatchback, from any DL zone'],
            [
              'Insurance',
              'Optional [transit insurance](/insurance) on declared value; [how claims work](/claims) explains the rest',
            ],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line of the written quote.',
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
    {
      heading: 'Which highway does the carrier take out of Delhi?',
      blocks: [
        {
          kind: 'list',
          items: [
            'South and west. NH 48 starts at Dhaula Kuan and runs past Gurgaon to Jaipur, Ahmedabad, Mumbai, Pune, Bangalore and Chennai.',
            'Central India and Hyderabad. NH 44 runs south via Mathura and Agra to Gwalior, Nagpur and Hyderabad.',
            'Punjab and the north. NH 44 also runs north through Sonipat, Panipat and Ambala.',
            'Ghaziabad and Meerut. From Nizamuddin Bridge, the Delhi Meerut Expressway heads east.',
          ],
        },
      ],
    },
  ],
  faqHeading: 'Car transport from Delhi: questions',
  faqs: [
    {
      question: 'How much does car transport from Delhi cost?',
      answer:
        'It depends on the route, the car, the carrier and whether a carrier can reach your Saket or Pitampura gate. A video survey of that gate then fixes the price in writing.',
    },
    {
      question: 'My diesel car is over 10 years old. Can you still move it?',
      answer:
        'Yes, on a carrier, since NGT orders keep it off Delhi NCR roads. Take the NOC first, and check the current rule with the Transport Department, as the Supreme Court has the matter before it.',
    },
    {
      question: 'Do I have to visit the RTO for the NOC?',
      answer:
        'Usually not. The Transport Department offers it as a faceless service on its website. The document comes by speed post or as a download link.',
    },
    {
      question: 'Can the carrier come to my society gate?',
      answer:
        'On a wide road in Dwarka or Rohini, often. In tight colonies such as Lajpat Nagar we agree the nearest point it can reach before you book.',
    },
    {
      question: 'When must I re-register the car in my new state?',
      answer:
        'Once it has been kept there for over 12 months, under Section 47 of the Motor Vehicles Act. You apply at the new RTO on Form 27 with the Delhi NOC.',
    },
    {
      question: 'Can I check who will collect the car?',
      answer:
        'Yes. Crew and vehicle details are sent before pickup, so the guard at your Mayur Vihar or Janakpuri gate has them, and you can [verify your crew](/verify).',
    },
  ],
  servicesHeading: 'Other moving services in Delhi',
  nearbyHeading: 'Car transport from nearby cities',
  nearbyIntro: 'We also collect cars across NCR and deliver anywhere in India.',
  routes: ['Delhi to Bangalore', 'Delhi to Mumbai', 'Delhi to Pune', 'Delhi to Chennai'],
  ctaHeading: 'Sending your car out of Delhi? Get one written price.',
  ctaText:
    'Tell us the car, its age, your gate and the destination. We confirm the loading point and send one fixed quote.',
};
