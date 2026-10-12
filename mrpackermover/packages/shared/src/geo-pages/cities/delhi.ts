import type { GeoPage } from '../types.js';

/** Delhi city page, from the owner's brief "Delhi City Page: FINAL" (9 October 2026), round 4: evergreen (no years), varied place pairs; expanded with sourced local detail (DDA sub-cities, Chandni Chowk zone, DND Flyway, NH 48, Minto Bridge, CAQM entry rule). */
export const delhi: GeoPage = {
  title: 'Packers and Movers in Delhi | Fixed Price | MrMoverPacker',
  metaDescription:
    'Packers and movers in Delhi with one fixed, written price. Gate passes, lift slots and truck timings planned for you. ID-verified crews, overnight moves.',
  h1: 'Packers and movers in Delhi with one fixed, written price',
  subhead:
    'Packers and movers in Delhi plan gate passes, lift slots and truck timings as much as packing. We fix all three before the day, then deliver across NCR or India for one written price.',
  trust: [
    'Gate pass and lift slot arranged',
    'Overnight local moves: loaded by 8 PM',
    'ID-verified crew',
    'Fixed written quote',
  ],
  sections: [
    {
      heading: 'What makes shifting in Delhi different?',
      blocks: [
        {
          kind: 'text',
          body: 'Access decides a move here: truck hours, the gate, and stairs that can take an almirah, in a Vasant Kunj DDA flat or a Malviya Nagar builder floor.',
        },
        {
          kind: 'list',
          items: [
            'Truck timings. Delhi Traffic Police set daytime no-entry windows for goods vehicles on many roads. Small tempos and larger trucks follow different rules. We size the truck and loading hour to your route over the Ring Road or Outer Ring Road.',
            'Cleaner trucks. A CAQM order limits goods vehicles registered outside Delhi to cleaner engines, so the truck we send must meet it.',
            'Society rules. Group housing societies in Dwarka and Patparganj usually want a gate pass, a booked lift slot and set loading hours. Many Dwarka societies also ask for a no-dues slip before goods leave.',
            'Builder floors. Much of South and West Delhi is builder floors with small lifts or none, as in Greater Kailash. Sofas and almirahs often come down by stairs, with extra hands.',
            'Lanes and parking. In market areas like Karol Bagh, around Ajmal Khan Road, the truck may stop at the main road. Carry beyond 50 metres is on the quote.',
          ],
        },
        {
          kind: 'text',
          body: 'So we survey first, and a Karol Bagh carry or Greater Kailash stairs go on the quote, not the bill.',
        },
      ],
    },
    {
      heading: 'How do homes differ across Delhi?',
      blocks: [
        {
          kind: 'text',
          body: 'The Delhi Development Authority (DDA) built much of the city, including Rohini in the north-west and Mayur Vihar across the Yamuna. Lajpat Nagar, settled by Partition refugees in the 1950s, is now mostly multi-storey.',
        },
        {
          kind: 'table',
          columns: ['Zone', 'Homes', 'What to expect'],
          rows: [
            [
              'South: Saket, Greater Kailash, Hauz Khas, Malviya Nagar, Kalkaji, [Lajpat Nagar](/packers-and-movers/delhi/lajpat-nagar)',
              'Builder floors; DDA flats in Vasant Kunj',
              'Small or no lifts, tight lanes, strict RWA gate timings',
            ],
            [
              'West: [Dwarka](/packers-and-movers/delhi/dwarka), [Janakpuri](/packers-and-movers/delhi/janakpuri), Uttam Nagar, Punjabi Bagh, Delhi Cantt',
              'Dwarka group housing; DDA blocks in Janakpuri',
              'Lift booking and no-dues slips in Dwarka; Cantt needs entry permission',
            ],
            [
              'North-West: [Rohini](/packers-and-movers/delhi/rohini), Pitampura, Model Town, Mukherjee Nagar, Civil Lines',
              'DDA flats and independent houses',
              'Student and PG moves in Mukherjee Nagar',
            ],
            [
              'East: Laxmi Nagar, Mayur Vihar, Patparganj, Preet Vihar, Shahdara',
              'Society flats in Patparganj and Mayur Vihar',
              'Dense markets, narrow lanes in Laxmi Nagar',
            ],
            [
              "Central: Karol Bagh, Rajinder Nagar, Connaught Place, Lutyens' Delhi",
              'Homes over shops; government bungalows',
              'High-security areas need vehicle details in advance',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Old Delhi galis, like Dariba Kalan and Kinari Bazaar off Chandni Chowk, cannot take a truck. The main road from the Red Fort to Fatehpuri Masjid is closed to motor vehicles from 9 AM to 9 PM.\n\nSo the truck stops outside the zone, and goods go by hand, priced on the survey.',
        },
      ],
    },
    {
      heading: 'Do I need a gate pass or NOC to shift house in Delhi?',
      blocks: [
        {
          kind: 'text',
          body: 'In most societies, yes, whether a Dwarka sector tower or an IP Extension society in Patparganj. Your coordinator checks your society or RWA rules and books the rest with you.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'Gate pass from a Dwarka society or Pitampura RWA',
              'You apply; we give vehicle and crew details',
              '2 to 3 days before',
            ],
            ['No-dues slip, which many Dwarka societies ask for', 'You', 'Before moving day'],
            [
              'Lift booking and padding in a Dwarka or Patparganj tower',
              'You or us; padding by our crew',
              '2 to 3 days before',
            ],
            [
              'Loading hours, say a Rohini pickup and Noida drop',
              'We confirm with both societies',
              'Before dispatch',
            ],
            [
              "Vehicle entry for Delhi Cantt or Lutyens' Delhi",
              'We share vehicle and crew details',
              'As your area requires',
            ],
            [
              'Landlord handover in Mukherjee Nagar or Laxmi Nagar',
              'You, after we clear the flat',
              'Moving day',
            ],
          ],
        },
      ],
    },
    {
      heading: 'How much do packers and movers charge in Delhi?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on volume, distance and access at each end, such as a narrow Shahdara lane. Our packers and movers in Delhi send one fixed, written price after a video survey, GST shown. The estimator above gives a first figure for any pickup, from Narela to Badarpur.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects a Delhi move'],
          rows: [
            ['Home size', 'A 1 RK in Mukherjee Nagar and a 4 BHK in Vasant Kunj differ widely'],
            ['Distance', 'Within Delhi, to NCR over the DND Flyway or NH 48, or intercity'],
            [
              'Floors and lift',
              'A third-floor Malviya Nagar builder floor with no lift needs more crew time',
            ],
            [
              'Carry distance',
              'Old Delhi and Laxmi Nagar lanes where the truck stops at the main road',
            ],
            [
              'Date',
              'Month-end and weekends fill lift slots fastest in Patparganj and Mayur Vihar societies',
            ],
            ['Packing level', 'Basic or Standard; crates for fragile items on Old Delhi carries'],
            ['Transit insurance', 'Optional, on declared value, worth it for a haul to Bangalore'],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line of the written quote, and nothing outside it is added on the day.',
        },
      ],
    },
    {
      heading: 'What changes when a Delhi move crosses into NCR?',
      blocks: [
        {
          kind: 'text',
          body: 'Delhi borders Uttar Pradesh to the east and Haryana elsewhere, so most NCR moves cross a state line.',
        },
        {
          kind: 'list',
          items: [
            'Noida. The DND Flyway links Maharani Bagh and Nizamuddin to Noida Sector 15A. It is toll-free, so no toll is added to a Noida run.',
            'Gurgaon. The NH 48 expressway starts at Dhaula Kuan, runs past the airport and ends on the edge of Gurgaon.',
            'Ghaziabad and Meerut. The Delhi Meerut Expressway runs from Nizamuddin Bridge through Ghaziabad to Partapur, near Meerut.',
          ],
        },
        {
          kind: 'text',
          body: 'Our packers and movers in Delhi usually run moves to [Noida](/packers-and-movers/noida), [Gurgaon](/packers-and-movers/gurgaon) or [Ghaziabad](/packers-and-movers/ghaziabad) overnight. Car transport or office shifting from Nehru Place or Okhla sits with all our [moving services](/services).',
        },
      ],
    },
    {
      heading: 'When is the best time to shift house in Delhi?',
      blocks: [
        {
          kind: 'text',
          body: 'Packers and movers in Delhi plan around the May heat and the rains that flood the Minto Bridge underpass. Pick a mid-month weekday, and go overnight for local moves.',
        },
        {
          kind: 'list',
          items: [
            'Overnight local moves. We load by 8 PM, travel after the evening rush on the Ring Road, and unload when your new society opens. You lose no working day, even moving from Janakpuri to Shahdara.',
            'Summer (April to June). May is the hottest month; Safdarjung and Palam have both logged highs above 45°C. Electronics, candles, medicines and cosmetics suffer in a closed truck, so carry the most sensitive ones.',
            'Monsoon (July to September). The bowl-shaped road under Minto Bridge, near Connaught Place, floods in heavy rain, so we route around it. Mattresses, sofas and wooden furniture get waterproof wrapping.',
            'Winter fog (December to January). Dense fog disrupts flights at IGI Airport and trains out of Delhi, and slows night trucks too. Delivery windows on runs to Patna or Dehradun allow for it.',
            'Month-end. The last and first few days of the month are busiest for lift slots in Dwarka group housing. A flexible date usually gets a better price.',
          ],
        },
      ],
    },
  ],
  faqHeading: 'Packers and movers in Delhi: questions',
  faqs: [
    {
      question: 'How much do packers and movers charge in Delhi?',
      answer:
        'It depends on home size, distance, floors, lift and date, so a Rohini DDA flat and a Greater Kailash builder floor differ. The estimator gives an instant figure; the survey quote is final.',
    },
    {
      question: 'Do I need a gate pass to shift house in Delhi?',
      answer:
        'In most Dwarka and Patparganj societies, and in many RWA colonies such as Lajpat Nagar, yes. Your coordinator confirms what your society needs and the loading hours at both ends.',
    },
    {
      question: 'Can a truck enter my area during the day?',
      answer:
        'Delhi Traffic Police keep daytime no-entry windows for goods vehicles on many roads. So we size the truck to suit and often cross the Ring Road at night.',
    },
    {
      question: 'How long does a local shift in Delhi take?',
      answer:
        'Usually one day, say from Janakpuri to Dwarka. On an overnight move we load by 8 PM and unload in Saket the next morning.',
    },
    {
      question: 'Do you shift builder floors with no lift?',
      answer:
        'Yes, they are common in Lajpat Nagar and Malviya Nagar. Extra hands bring heavy items down the stairs, priced on the quote from day one.',
    },
    {
      question: 'Can you move me from Delhi to Noida, Gurgaon or Ghaziabad?',
      answer:
        'Yes, door to door, usually overnight, over the DND Flyway, NH 48 or the Delhi Meerut Expressway. Our packers and movers in Delhi carry the papers to enter Uttar Pradesh or Haryana.',
    },
    {
      question: 'Do you move into Delhi Cantt or government housing?',
      answer:
        "Yes, including the Cantonment Board area and Lutyens' Delhi. We share vehicle and crew details in advance, and you can [verify your crew](/verify).",
    },
    {
      question: 'Is my move insured?',
      answer:
        'Every move has basic liability cover, Old Delhi hand carries too. Full cover is optional [transit insurance](/insurance); see [how claims work](/claims).',
    },
  ],
  servicesHeading: 'Moving services in Delhi',
  nearbyHeading: 'Moving from Delhi to NCR or another city?',
  nearbyIntro: 'We deliver anywhere in India. Within NCR, most moves are done overnight.',
  routes: [
    'Delhi to Bangalore',
    'Delhi to Mumbai',
    'Delhi to Pune',
    'Delhi to Hyderabad',
    'Delhi to Chennai',
    'Delhi to Dehradun',
    'Delhi to Patna',
  ],
  ctaHeading: 'Moving in or out of Delhi? Get one written price.',
  ctaText:
    "Tell us your pickup, drop and date. We check your society's rules, plan the truck timing, and send one fixed quote. A real person calls you back.",
};
