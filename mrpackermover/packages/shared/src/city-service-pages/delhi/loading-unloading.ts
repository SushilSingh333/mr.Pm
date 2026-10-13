import type { GeoPage } from '../../geo-pages/types.js';

/** Loading and unloading in Delhi, round 5: from sourced local facts (Delhi Transport notification on goods-vehicle hours around Karol Bagh, Sadar Bazar, Lajpat Nagar and Dwarka Sector 10 market and on Rohtak Road and Agra Canal Road; Karol Bagh market loading ban; CAQM rule for non-Delhi goods vehicles; Chandni Chowk vehicle hours; Khari Baoli and Sadar Bazar wholesale; DSIIDC industrial areas; builder floors, Rohini walk-ups, Kalkaji Extension blocks, Dwarka societies). */
export const delhiLoadingUnloading: GeoPage = {
  title: 'Loading and Unloading in Delhi | Fixed Price | MrMoverPacker',
  metaDescription:
    'Loading and unloading in Delhi by an ID-verified crew for your own truck. Builder-floor stairs, society lifts, market no-entry hours planned. Fixed price.',
  h1: 'Loading and unloading in Delhi, timed to your truck and your stairs',
  subhead:
    'Loading and unloading in Delhi depends on when a goods vehicle may stand at your gate. Our crew plans around market no-entry hours, Rohini stairs and Kalkaji Extension lifts.',
  trust: [
    'ID-verified crew, not chowk labour',
    'Fixed written price',
    'Ropes and tie-downs brought by us',
    'Lift walls padded before the carry',
  ],
  sections: [
    {
      heading: 'What makes loading and unloading in Delhi different?',
      blocks: [
        {
          kind: 'text',
          body: 'Market hours, Rohini stairs and Dwarka gate passes shape the job more than the load.',
        },
        {
          kind: 'list',
          items: [
            'Market hours. Delhi notifies no-entry hours for goods vehicles on the roads around Karol Bagh, Sadar Bazar and Lajpat Nagar. Crews in Kamla Nagar or Gandhi Nagar, under the same notice, work mornings or evenings.',
            'Stairs. Builder floors in Malviya Nagar and Greater Kailash often have a small lift or none. Almirahs come down a Hauz Khas or Kalkaji stair by hand, two people to each.',
            'Tall blocks. The DDA blocks in Kalkaji Extension rise to 14 storeys. The crew pads the lift and plans a stair carry in case it is down.',
            'Society gates. Many Dwarka societies want a gate pass naming the crew and the vehicle. A rented truck without one waits outside on the sector road.',
            'Hand carries. Motor vehicles cannot use the Chandni Chowk main road from 9 AM to 9 PM. Goods from Kinari Bazaar or Dariba Kalan go to the truck on foot.',
          ],
        },
        {
          kind: 'text',
          body: 'Our [labour-only service](/services/loading-unloading) is the same in Noida or Gurgaon, and [movers in Delhi](/packers-and-movers/delhi) can add packing and a truck.',
        },
      ],
    },
    {
      heading: 'Where do Delhi crews load and unload?',
      blocks: [
        {
          kind: 'table',
          columns: ['Place', 'What is there', 'What the crew plans for'],
          rows: [
            [
              'South and West builder floors',
              'Lajpat Nagar, Malviya Nagar, Greater Kailash',
              'Stair carries; furniture turned on landings',
            ],
            [
              'DDA walk-ups',
              '[Rohini](/packers-and-movers/delhi/rohini) Sectors 6 to 14, Mayur Vihar pockets',
              'Crew size set by the floor number',
            ],
            [
              'Group housing',
              '[Dwarka](/packers-and-movers/delhi/dwarka) sectors, IP Extension in Patparganj',
              'Gate pass, service lift slot, set loading hours',
            ],
            [
              'Wholesale lanes',
              'Khari Baoli spice market, Sadar Bazar',
              'Long carries to a truck on an open road',
            ],
            [
              'Industrial areas and godowns',
              'Okhla, Wazirpur, Bawana, Narela, Patparganj Industrial Area',
              'Stock, racks and machines, often on a weekend shift',
            ],
            [
              'Furniture markets',
              'Kirti Nagar, Panchkuian Road',
              'A new sofa or bed carried up and placed in the room',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Khari Baoli sits by Fatehpuri Masjid at the western end of Chandni Chowk.',
        },
      ],
    },
    {
      heading: 'When can a hired truck stand at your gate?',
      blocks: [
        {
          kind: 'text',
          body: 'Rules differ by road, so a Rohtak Road pickup and a Karol Bagh one get different slots.',
        },
        {
          kind: 'list',
          items: [
            'Karol Bagh market. The Transport Department bars loading, unloading and commercial parking on its market roads during trading hours.',
            'Rohtak Road and Agra Canal Road. Goods vehicles are kept off Rohtak Road from Tikri to Peeragarhi at rush hours. Agra Canal Road from Kalindi Kunj to the Faridabad border has the same kind of limit, and three-wheeled tempos are exempt on both.',
            'Trucks from outside. Under a CAQM order, a goods vehicle registered outside Delhi must be BS-VI diesel, CNG, LNG or electric to enter. Check this before you book a Noida or Gurgaon truck.',
          ],
        },
      ],
    },
    {
      heading: 'What should be ready before the crew arrives?',
      blocks: [
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'Gate pass at a Dwarka or IP Extension society',
              'You apply; we share crew names and IDs',
              '2 to 3 days before',
            ],
            ['Lift slot in a Kalkaji Extension block', 'You or us', 'Before the day'],
            [
              'Truck timing outside Lajpat Nagar or Sadar Bazar markets',
              'You, with your truck owner; we confirm the crew slot',
              'When you book the truck',
            ],
            [
              'Building permission for an Okhla or Wazirpur unit',
              'You',
              'Before the weekend shift',
            ],
            ['Ropes and straps', 'Our crew', 'Loading day'],
          ],
        },
        {
          kind: 'text',
          body: 'When the crew reaches your gate in Pitampura or Saket, [verify your crew](/verify) against the details we send.',
        },
      ],
    },
    {
      heading: 'How much does loading and unloading in Delhi cost?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on the load, the floors and the carry at each end, from a Laxmi Nagar walk-up to a Vasant Kunj flat.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects loading and unloading in Delhi'],
          rows: [
            ['Load size', 'A Mukherjee Nagar PG room needs fewer hands than a Vasant Kunj 4 BHK'],
            [
              'Floors and lift',
              'A third floor in a Rohini walk-up takes more crew time than a Dwarka tower with a lift',
            ],
            [
              'Carry distance',
              'More than 50 metres from the truck, as in Chandni Chowk lanes, adds time',
            ],
            ['Timing', 'Karol Bagh market loading falls outside trading hours'],
            ['One end or both', 'Loading in Janakpuri only costs less than loading and unloading'],
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
  faqHeading: 'Questions about loading crews in Delhi',
  faqs: [
    {
      question: 'How much does loading and unloading in Delhi cost?',
      answer:
        'It depends on load size, floors, lift and carry distance, so a Rohini walk-up and a Dwarka tower differ.',
    },
    {
      question: 'My truck can only reach Lajpat Nagar after 8 PM. Can the crew load then?',
      answer:
        'Yes, if your RWA allows evening loading. Goods vehicles are kept off the roads around Lajpat Nagar market for much of the day, so an evening slot often suits.',
    },
    {
      question: 'Can the crew carry down from a fourth floor with no lift?',
      answer:
        'Yes. It is common in Malviya Nagar builder floors and Rohini walk-ups, and the stair carry is priced on the quote.',
    },
    {
      question: 'Do you load stock from a shop or godown?',
      answer: 'Yes, from Sadar Bazar shops to Okhla units, usually outside trading hours.',
    },
    {
      question: 'My truck is from Noida. Can it enter Delhi?',
      answer:
        'Only if it is BS-VI diesel, CNG, LNG or electric, under the CAQM rule for goods vehicles from outside Delhi.',
    },
    {
      question: 'What if something is damaged during the carry?',
      answer:
        'Tell the crew lead on the spot, at your Saket or Shahdara door. Handling damage by our crew goes through [how claims work](/claims).',
    },
  ],
  servicesHeading: 'Other moving services in Delhi',
  nearbyHeading: 'Loading and unloading in nearby cities',
  nearbyIntro: 'Our crews also load and unload across NCR and in Meerut.',
  routes: [],
  ctaHeading: 'Truck booked in Delhi? Book the hands.',
  ctaText:
    'Tell us the floors at each end and when your truck arrives. We check the road hours and the lift, then send one fixed quote. A real person calls you back.',
};
