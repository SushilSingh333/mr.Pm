import type { GeoPage } from '../../geo-pages/types.js';

/**
 * Car transport from Gurgaon (round 5): the Gurugram registering offices (HR-26, HR-76,
 * HR-55), the Form 28 NOC on Parivahan, Delhi's age limits for diesel and petrol cars,
 * where a carrier can load, and the roads out (NH-48, Dwarka Expressway, KMP Expressway,
 * the Sohna Elevated Corridor to the Delhi-Mumbai Expressway).
 */
export const gurgaonCarTransport: GeoPage = {
  title: 'Car Transport from Gurgaon | Door to Door | MrMoverPacker',
  metaDescription:
    'Car transport from Gurgaon by open or enclosed carrier. Pickup from your tower basement or lane, photo report and RTO advice. One fixed written price.',
  h1: 'Car transport from Gurgaon, from your basement to the new gate',
  subhead:
    'Car transport from Gurgaon starts with two questions: where the carrier stands, and which office registered the car. We fix the pickup spot on the survey and point you to the right RTO step.',
  trust: [
    'Photo condition report at both ends',
    'Open or enclosed carrier',
    'Pickup spot agreed before booking',
    'Tolls inside the fixed quote',
  ],
  sections: [
    {
      heading: 'What makes car transport from Gurgaon different?',
      blocks: [
        {
          kind: 'text',
          body: 'Our [car transport](/services/car-transport) method is the same everywhere. In [Gurugram](/packers-and-movers/gurgaon), towers, Haryana paperwork and fast highways shape the job.',
        },
        {
          kind: 'list',
          items: [
            'Basement pickups. Cars in Golf Course Road and Dwarka Expressway towers come up from basement parking, so the society gate pass names the carrier.',
            'Carrier on the sector road. A full carrier cannot turn into most Old Gurgaon lanes or society roads, so it waits outside the gate.',
            'Haryana registration. Gurugram North registers HR-26 numbers and Pataudi HR-76, while HR-55 is for commercial vehicles.',
            "Delhi age limits. A Gurgaon car bound for a Delhi address must meet the capital's limits: no diesel car over 10 years old, no petrol car over 15.",
            'Fast roads out. NH-48, the KMP Expressway and the Delhi-Mumbai Expressway all start within reach of the city.',
          ],
        },
      ],
    },
    {
      heading: 'Which road does a car carrier take out of Gurgaon?',
      blocks: [
        {
          kind: 'table',
          columns: ['Road', 'Joins near', 'Used for'],
          rows: [
            [
              'NH-48',
              'IFFCO Chowk, Rajiv Chowk, Kherki Daula',
              'Jaipur, Ahmedabad, Pune and Bangalore runs',
            ],
            [
              'Delhi-Mumbai Expressway',
              'Alipur, via the Sohna Elevated Corridor',
              'Runs towards Vadodara and Mumbai',
            ],
            [
              'KMP Expressway',
              'Its NH-48 interchange at Manesar',
              'Northbound runs that skip Delhi, via Kundli',
            ],
            [
              'Dwarka Expressway',
              'Kherki Daula, through Sectors 102 to 113',
              'Deliveries to Dwarka and Mahipalpur in Delhi',
            ],
          ],
        },
      ],
    },
    {
      heading: 'What paperwork does a Gurgaon car need?',
      blocks: [
        {
          kind: 'text',
          body: 'Transport itself needs only copies of the RC, insurance and PUC. The Haryana steps below matter when the car will live in another state.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'Form 28 NOC from the Gurugram office named on your RC, applied on Parivahan',
              'You',
              'Before re-registering in the new state',
            ],
            ['Pending challans on the HR number cleared', 'You', 'Before the NOC application'],
            [
              "Financier's consent on Form 28 for a car on loan",
              'You, with the bank',
              'With the NOC application',
            ],
            [
              'Basement exit and gate pass at your Sohna Road or Golf Course Road society',
              'You; we send the carrier number',
              'The day before',
            ],
            [
              'Carrier spot on the sector road outside the gate',
              'We fix it on the survey',
              'Before booking',
            ],
          ],
        },
      ],
    },
    {
      heading: 'How much does car transport from Gurgaon cost?',
      blocks: [
        {
          kind: 'text',
          body: 'The price follows the route out of Gurugram, the car, the carrier type and the pickup point.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects car transport from Gurgaon'],
          rows: [
            ['Route', 'A run down NH-48 to Bangalore costs more than one to Jaipur'],
            [
              'Car size',
              'An SUV from a Golf Course Road basement takes more carrier space than a hatchback',
            ],
            [
              'Carrier type',
              'Enclosed carriers leave Gurugram less often than open ones, and cost more',
            ],
            ['Pickup point', 'A car in a Sadar Bazaar lane is driven out to meet the carrier'],
            ['Date', 'Month-end weeks fill carriers on NH-48 first'],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line of the written quote. [Transit insurance](/insurance) covers the car up to its declared value.',
        },
      ],
    },
    {
      heading: 'Bringing a car to Gurgaon from another state?',
      blocks: [
        {
          kind: 'text',
          body: 'A car that will stay in Gurugram for good is re-registered with the Haryana office for your new address. That office asks for the NOC from your old RTO, so apply for it before you leave.\n\nOur carrier delivers to your new tower on the gate pass your society issues. In a Dwarka Expressway society, that often means a long internal road to the basement ramp.',
        },
      ],
    },
    {
      heading: 'When is the best time to send a car from Gurgaon?',
      blocks: [
        {
          kind: 'list',
          items: [
            'Monsoon (July to September). Hero Honda Chowk on NH-48 is prone to flooding, so an enclosed carrier is worth asking about for a new car.',
            'Winter fog (December to January). Fog past Kherki Daula slows night carriers, and the dated window allows for it.',
          ],
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
  ],
  faqHeading: 'Car transport from Gurgaon: questions',
  faqs: [
    {
      question: 'How much does car transport from Gurgaon cost?',
      answer:
        'It depends on distance, car size, carrier type and the pickup point. A hatchback bound for Jaipur and an SUV bound for Bangalore are priced apart.',
    },
    {
      question: 'Which RTO is my car registered with?',
      answer:
        'Your RC names it. In Gurugram district, HR-26 is Gurugram North, HR-76 is Pataudi and HR-55 is for commercial vehicles.',
    },
    {
      question: 'Do I need an NOC before the car leaves Haryana?',
      answer:
        'Not for the transport. You need the Form 28 NOC from your Gurugram office when you re-register in the new state, and it can be applied for on Parivahan.',
    },
    {
      question: 'Can I take my old diesel car to a new home in Delhi?',
      answer:
        'Check its age first. Under NGT and Supreme Court orders, Delhi bars diesel cars over 10 years and petrol cars over 15 from its roads.',
    },
    {
      question: 'Can the carrier come inside my society?',
      answer:
        'Usually not. Your car is driven up from the basement to the carrier on the sector road.',
    },
    {
      question: 'Can you move the car with our household goods?',
      answer:
        'Yes. [Home shifting](/packers-and-movers/gurgaon/home-shifting) and the carrier share one quote and one coordinator. Any claim follows [how claims work](/claims).',
    },
  ],
  servicesHeading: 'Other moving services in Gurgaon',
  nearbyHeading: 'Car transport from nearby cities',
  nearbyIntro: 'Moving a car from elsewhere in NCR? We collect from these cities too.',
  routes: ['Gurgaon to Bangalore', 'Gurgaon to Pune', 'Gurgaon to Mumbai', 'Gurgaon to Hyderabad'],
  ctaHeading: 'Sending your car from Gurgaon? Get one written price.',
  ctaText:
    'Tell us the car, your tower or sector and the destination. We agree the pickup spot and send one fixed quote.',
};
