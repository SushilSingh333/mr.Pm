import type { GeoPage } from '../../geo-pages/types.js';

/**
 * Bike transport from Noida (round 5): sourced local facts (UP-16 registration and the ARTO
 * office in Sector 32, NOC on Parivahan, re-registration within 12 months under section 47
 * of the Motor Vehicles Act, Amity University in Sector 125, JIIT in Sectors 62 and 128,
 * Supertech Capetown, Jaypee Wish Town, Atta Market). No transit times, by rule.
 */
export const noidaBikeTransport: GeoPage = {
  title: 'Bike Transport from Noida | Door to Door | MrMoverPacker',
  metaDescription:
    'Bike transport from Noida, collected from your society basement or kothi gate. UP-16 NOC steps explained, bike wrapped and photographed. One written price.',
  h1: 'Bike transport from Noida, collected from your tower or lane',
  subhead:
    'Bike transport from Noida begins where the bike is parked: a tower basement in Sector 78, a kothi porch in Sector 12 or a let near Amity. We wrap it, photograph it and quote one written price.',
  trust: [
    'Photographed at pickup and drop',
    'Wheeled up basement ramps, never lifted by the bars',
    'Bike number sent to your AOA desk',
    'Transit insurance available',
  ],
  sections: [
    {
      heading: 'What makes bike transport in Noida different?',
      blocks: [
        {
          kind: 'text',
          body: 'Wrapping, ramps and crating follow our [bike transport service](/services/bike-transport). Noida adds basement ramps, AOA gate checks and UP-16 paperwork.',
        },
        {
          kind: 'list',
          items: [
            'Basement pickups. In Sectors 74 to 79, the crew wheels the bike from its parking bay to our vehicle at the gate.',
            "Gate checks. Your AOA security desk gets the bike's number and our crew names before pickup.",
            'Students on the move. Riders at Amity University in Sector 125 or JIIT in Sector 62 can send a bike home on its own.',
            'Kothi lanes. In Sectors 11, 12, 15 and 27 our vehicle stops at your gate and the bike is wrapped there.',
            'UP-16 papers. Two-wheelers in Gautam Buddh Nagar are registered at the ARTO in Sector 32.',
          ],
        },
      ],
    },
    {
      heading: 'Where do you collect bikes in Noida?',
      blocks: [
        {
          kind: 'text',
          body: 'From every sector on the [Noida city page](/packers-and-movers/noida), and from Greater Noida West across the Hindon.',
        },
        {
          kind: 'table',
          columns: ['Area', 'Where bikes park', 'Pickup plan'],
          rows: [
            [
              'Sectors 74 to 79',
              'Society basements, as at Supertech Capetown',
              'Wheeled up the ramp to the gate',
            ],
            [
              '[Sector 128](/packers-and-movers/noida/sector-128) and [Sector 137](/packers-and-movers/noida/sector-137)',
              'Tower parking in Wish Town and Logix Blossom County',
              'Vehicle spot agreed with the township or AOA office',
            ],
            [
              'Sector 125 and [Sector 62](/packers-and-movers/noida/sector-62)',
              'Student and staff lets near Amity and JIIT',
              'The vehicle sized to the load',
            ],
            [
              '[Sector 18](/packers-and-movers/noida/sector-18)',
              'Shop and flat parking off Atta Market',
              'Pickup before the market lanes fill',
            ],
            ['Greater Noida West', 'Newer tower basements', 'Approach road checked first'],
          ],
        },
      ],
    },
    {
      heading: 'What paperwork does a Noida bike need?',
      blocks: [
        {
          kind: 'text',
          body: 'Little for a run within UP, more for a new state. The UP-16 office handles the NOC side.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            ['RC and insurance copies for a UP-16 bike, plus your photo ID', 'You', 'At booking'],
            [
              'NOC from the Sector 32 ARTO, applied for on Parivahan',
              'You',
              'Before re-registering outside Uttar Pradesh',
            ],
            [
              "Lender's NOC, if the bike's RC shows a loan",
              'You, from the bank',
              'With the NOC application',
            ],
            [
              'Authorisation letter, if a flatmate in Sector 125 hands the bike over',
              'You',
              'Before pickup',
            ],
            [
              'Bike number and crew names for the AOA desk, checked on [verify your crew](/verify)',
              'We send them; you check them',
              'The evening before',
            ],
          ],
        },
      ],
    },
    {
      heading: 'Is a move to Delhi or Gurgaon a change of state?',
      blocks: [
        {
          kind: 'text',
          body: 'Yes. Delhi and Haryana register vehicles apart from Uttar Pradesh, even though all three sit in NCR.\n\nKeep a UP-16 bike at a Delhi or Gurgaon address beyond 12 months and it needs re-registering there. That starts with the NOC from the Sector 32 ARTO.',
        },
      ],
    },
    {
      heading: 'How much does bike transport from Noida cost?',
      blocks: [
        {
          kind: 'text',
          body: 'Distance, the bike and the packing set the price, and the quote shows each.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects bike transport from Noida'],
          rows: [
            ['Distance', 'Sector 62 to Greater Noida West is local; Pune is intercity'],
            ['Bike type', 'A scooter from a Sector 125 let takes less space than a 650 cc tourer'],
            ['Packing', 'Standard wrap for a run within NCR; a crate for Noida to Bangalore'],
            ['Pickup', 'A basement ramp in a Sector 78 tower is planned on the survey'],
            ['Insurance', 'Optional [transit insurance](/insurance) on declared value'],
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
  faqHeading: 'Questions about moving a bike from Noida',
  faqs: [
    {
      question: 'How much does bike transport from Noida cost?',
      answer:
        'It depends on the distance, the bike and the packing. Tell us your sector and destination for one written price, with GST shown.',
    },
    {
      question: 'Can you pick my bike up from a society basement?',
      answer:
        'Yes. Once your AOA desk has the bike number, the crew wheels it up the ramp to our vehicle at the gate.',
    },
    {
      question: 'Can you collect from a kothi in Sector 15?',
      answer:
        'Yes. Our vehicle stops at your gate, and the bike is wrapped there before it goes up the loading ramp.',
    },
    {
      question: 'Can a student send a bike home from Amity or JIIT?',
      answer:
        'Yes. We collect from lets near Sector 125 or Sector 62 and deliver to the family address, with photos at both ends.',
    },
    {
      question: 'Where do I get an NOC for my Noida bike?',
      answer:
        'From the ARTO office in Sector 32, opposite NTPC, through the Parivahan portal. You need it only to re-register in another state.',
    },
    {
      question: 'What if my bike arrives with a scratch?',
      answer:
        'We check it against the photos taken at your AOA gate or kothi. Optional [transit insurance](/insurance) covers declared value, and [how claims work](/claims) sets out the steps.',
    },
  ],
  servicesHeading: 'Other moving services in Noida',
  nearbyHeading: 'Bike transport from nearby cities',
  nearbyIntro: 'We collect bikes across Delhi NCR and Meerut and deliver anywhere in India.',
  routes: ['Noida to Bangalore', 'Noida to Pune', 'Noida to Hyderabad', 'Noida to Lucknow'],
  ctaHeading: 'Sending a bike from Noida? Get one written price.',
  ctaText:
    'Tell us the bike, your sector and the destination. We plan the pickup with your society desk and send one fixed quote.',
};
