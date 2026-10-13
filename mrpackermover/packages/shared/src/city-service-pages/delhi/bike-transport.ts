import type { GeoPage } from '../../geo-pages/types.js';

/** Bike transport from Delhi (round 5): the faceless NOC, the 15-year petrol rule and impounding guidelines, CAQM vehicle rule, pickup from society parking, DDA blocks and Old Delhi lanes. No transit times. */
export const delhiBikeTransport: GeoPage = {
  title: 'Bike Transport from Delhi | Door to Door | MrMoverPacker',
  metaDescription:
    'Bike transport from Delhi, collected from your society parking, DDA block or lane. NOC and age rules checked first, then one fixed, written price.',
  h1: 'Bike transport from Delhi, picked up from your tower, block or lane',
  subhead:
    'Bike transport from Delhi depends on its papers and where it stands, from a Dwarka basement to a Chandni Chowk gali. We check your DL registration, the NGT age rule and the pickup spot, then send one written price.',
  trust: [
    'Photographed at pickup and drop',
    'Loaded on ramps, never lifted by the handlebars',
    'Pickup spot agreed before you book',
    'Transit insurance available',
  ],
  sections: [
    {
      heading: 'What makes bike transport from Delhi different?',
      blocks: [
        {
          kind: 'text',
          body: 'Our [bike transport](/services/bike-transport) crews wrap a bike the same way in Rohini or Saket. A bike leaving [Delhi](/packers-and-movers/delhi) also meets Transport Department, NGT and CAQM rules.',
        },
        {
          kind: 'list',
          items: [
            'Age rule. Under NGT orders upheld by the Supreme Court, petrol two-wheelers over 15 years old may not ply in Delhi NCR.',
            'Impounding risk. Transport Department guidelines let enforcement teams impound an overage two-wheeler found on a public road.',
            'Faceless NOC. Owners apply on the Transport Department website, log in with Aadhaar and pay online.',
            'Cleaner trucks. A CAQM direction admits goods vehicles from outside the city only if BS-VI, CNG, LNG or electric.',
            'Truck hours. Delhi Traffic Police keep goods vehicles off many roads at set hours, so pickup is timed to your road.',
          ],
        },
      ],
    },
    {
      heading: 'Where in Delhi is your bike collected from?',
      blocks: [
        {
          kind: 'text',
          body: 'A bike can be wheeled down Laxmi Nagar or Karol Bagh lanes that no truck can enter. The pickup spot follows the building.',
        },
        {
          kind: 'table',
          columns: ['Where it stands', 'Typical areas', 'How pickup works'],
          rows: [
            [
              'Society basement or stilt parking',
              '[Dwarka](/packers-and-movers/delhi/dwarka) sectors, IP Extension, Mayur Vihar',
              'Wheeled up to the gate',
            ],
            [
              'Ground floor of a DDA block',
              'Rohini, Janakpuri, Vasant Kunj',
              'Truck waits on the inner road',
            ],
            [
              'Builder floor stilt',
              'Greater Kailash, Lajpat Nagar, Malviya Nagar',
              'Loaded from the colony road',
            ],
            [
              'PG or hostel stand',
              'Mukherjee Nagar, near Batra Cinema',
              'Collected clear of coaching lanes',
            ],
            [
              'Market lanes',
              'Chandni Chowk galis, Laxmi Nagar, Karol Bagh',
              'Wheeled to the nearest open road',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Motor vehicles may not use the main Chandni Chowk road, between the Red Fort and Fatehpuri Masjid, from 9 AM to 9 PM. So pickups from Old Delhi galis run outside those hours.',
        },
      ],
    },
    {
      heading: 'What paperwork does a bike leaving Delhi need?',
      blocks: [
        {
          kind: 'text',
          body: 'Mostly yours, with the Transport Department here and the RTO at your new home.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'Bike NOC on Form 28 via the Transport Department website',
              'You',
              'Before re-registering',
            ],
            [
              'Age check for a petrol bike past 15 years',
              'You, with the Transport Department',
              'Before booking',
            ],
            ['Pickup spot, such as a Rohini block road', 'We agree it with you', 'Before booking'],
            ['Copies of the RC and insurance, and your ID', 'You', 'At pickup'],
            [
              'Crew details for an IP Extension society guard',
              'We send them; you can [verify your crew](/verify)',
              'The day before',
            ],
            [
              'Form 27 and the NOC at the new RTO, under Section 47',
              'You',
              'After 12 months in the new state',
            ],
          ],
        },
      ],
    },
    {
      heading: 'How much does bike transport from Delhi cost?',
      blocks: [
        {
          kind: 'text',
          body: 'The bike, the packing and the route decide it, whether it leaves a Saket builder floor or a Pitampura block.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects bike transport from Delhi'],
          rows: [
            ['Bike', 'A scooter from a Mukherjee Nagar PG takes less space than a 650 cc tourer'],
            [
              'Packing',
              'Standard wrap suits a short NCR hop; a wooden crate suits a long run down NH 48',
            ],
            [
              'Pickup spot',
              'A Chandni Chowk gali means a hand push to the truck, priced on the quote',
            ],
            ['Route', 'Within NCR over the DND Flyway, or out on NH 44 or NH 48 to another state'],
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
  ],
  faqHeading: 'Bike transport from Delhi: questions',
  faqs: [
    {
      question: 'How much does bike transport from Delhi cost?',
      answer:
        'It depends on the bike, the packing, the route and how near a truck gets to your Lajpat Nagar gate. A video survey then fixes the price in writing.',
    },
    {
      question: 'My petrol bike is over 15 years old. Can you move it?',
      answer:
        'Yes, inside a truck, since NGT orders keep it off Delhi NCR roads. Get the NOC, and confirm the current rule with the Transport Department while the Supreme Court hears the matter.',
    },
    {
      question: 'Do I have to visit the RTO for the NOC?',
      answer:
        'Usually not. The Transport Department offers it as a faceless online service, sent by speed post or download link.',
    },
    {
      question: 'My bike is parked in an Old Delhi lane. Can you collect it?',
      answer:
        'Yes. Our crew wheels it out of the gali to the truck, parked outside the Chandni Chowk zone.',
    },
    {
      question: 'Does my society guard need anything?',
      answer:
        'Most Dwarka and IP Extension societies want crew names and the vehicle number, which we send a day ahead.',
    },
    {
      question: 'When must I re-register the bike in my new state?',
      answer:
        'When it has stayed there beyond 12 months, as Section 47 of the Motor Vehicles Act sets out. Hand the Delhi NOC to the new RTO with Form 27.',
    },
  ],
  servicesHeading: 'Other moving services in Delhi',
  nearbyHeading: 'Bike transport from nearby cities',
  nearbyIntro: 'We also collect bikes across NCR and deliver anywhere in India.',
  routes: ['Delhi to Bangalore', 'Delhi to Pune', 'Delhi to Hyderabad', 'Delhi to Dehradun'],
  ctaHeading: 'Sending your bike out of Delhi? Get one written price.',
  ctaText:
    'Tell us the bike, its age, where it is parked and where it is going. We confirm the pickup spot and send one fixed quote.',
};
