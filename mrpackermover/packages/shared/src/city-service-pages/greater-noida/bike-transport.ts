import type { GeoPage } from '../../geo-pages/types.js';

/**
 * Bike transport from Greater Noida (round 5): one service in one city. Sourced facts: UP 16
 * plates for Gautam Buddh Nagar, the district transport office in Noida Sector 32, NOC and
 * re-registration under sections 48 and 47 of the Motor Vehicles Act (Forms 28 and 27), the
 * NGT petrol age limit for NCR, Knowledge Park hostels and semester dates (owner's brief),
 * and the roads out (Zero Point, the Sirsa interchange). No transit times, by rule.
 */
export const greaterNoidaBikeTransport: GeoPage = {
  title: 'Bike Transport in Greater Noida | One Price | MrMoverPacker',
  metaDescription:
    'Bike transport from Greater Noida, from Knowledge Park hostels and tower basements to anywhere in India. UP 16 NOC steps explained. One fixed price.',
  h1: 'Bike transport from Greater Noida, collected from hostel or basement',
  subhead:
    'Bike transport from Greater Noida often starts at a Knowledge Park hostel or a tower basement in Greater Noida West. We collect the bike there, pack it on the spot and send one fixed, written price first.',
  trust: [
    'Hostel and basement pickups',
    'Photo condition report',
    'Bike on the same quote as your goods',
    'Transit insurance available',
  ],
  sections: [
    {
      heading: 'What makes bike transport from Greater Noida different?',
      blocks: [
        {
          kind: 'text',
          body: 'Bikes here carry UP 16 plates from Gautam Buddh Nagar district. Pickups come from three kinds of place: campus hostels, high-rise basements and plotted GNIDA sectors.',
        },
        {
          kind: 'list',
          items: [
            'Hostel pickups. Scooters leave Sharda University, Galgotias College and GNIOT hostels at semester end, often with a room of boxes.',
            'Tower basements. In Greater Noida West, the bike is wheeled up the basement ramp to the gate, where the truck waits.',
            'Plotted sectors. In Gamma or Delta, the bike is packed at your gate on the GNIDA service lane.',
            'Same truck. A bike can travel with household goods from Omicron or Gaur City on one quote.',
            'Roads out. Long runs leave by Zero Point on the Yamuna Expressway or the Sirsa interchange on the Eastern Peripheral.',
          ],
        },
        {
          kind: 'text',
          body: 'The [bike transport service](/services/bike-transport) page covers crating and handover, and the [Greater Noida](/packers-and-movers/greater-noida) page covers areas from Alpha to Jaypee Greens.',
        },
      ],
    },
    {
      heading: 'Where is the bike picked up?',
      blocks: [
        {
          kind: 'table',
          columns: ['Area', 'Where the bike waits', 'What we check'],
          rows: [
            ['Knowledge Park I to III', 'Hostel or PG parking', 'Warden gate time'],
            ['Greater Noida West towers', 'Basement parking', 'Ramp and exit pass'],
            ['Gaur City', 'Avenue tower basement', 'Avenue gate entry'],
            ['Alpha, Beta, Gamma, Delta', 'Inside your gate', 'Truck spot on the service lane'],
            ['Bisrakh and Shahberi', 'Lane outside the house', 'Walk to where the truck stands'],
            ['Jaypee Greens', 'Villa porch or tower parking', 'Township gate pass'],
          ],
        },
      ],
    },
    {
      heading: 'What paperwork does a Greater Noida bike need?',
      blocks: [
        {
          kind: 'text',
          body: 'A bike that stays in another state for over 12 months needs a new number there. The NOC for that comes from the Gautam Buddh Nagar transport office in Noida Sector 32.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            ['RC copy showing the UP 16 number', 'You', 'At pickup'],
            [
              'NOC on Form 28 from the Gautam Buddh Nagar office',
              'You, on the Parivahan Vahan portal',
              'Before or soon after the move',
            ],
            [
              'Truck entry at a Sharda University or Galgotias College hostel',
              'You, with the warden',
              'A week before',
            ],
            [
              'Basement exit pass at a Greater Noida West society',
              'You; we send truck details',
              'A day before',
            ],
            [
              'Age check for a petrol bike over 15 years in NCR',
              'You, with the Sector 32 office',
              'Before booking',
            ],
            ['Keys and photos at the Knowledge Park gate', 'You and our crew', 'Pickup day'],
          ],
        },
      ],
    },
    {
      heading: 'How much does bike transport from Greater Noida cost?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on the bike, the route and whether it rides with your goods.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects bike transport from Greater Noida'],
          rows: [
            [
              'Bike type',
              'A scooter from a Galgotias hostel takes less space than a heavy cruiser',
            ],
            ['With goods', 'A bike on the same Omicron or Gaur City home truck is one extra line'],
            [
              'Route',
              'Agra runs use the Yamuna Expressway; Palwal runs use the Eastern Peripheral',
            ],
            ['Date', 'Knowledge Park semester ends in June, July and December fill first'],
            ['Tolls', 'Plazas such as Jewar sit inside the quote'],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line of the written quote.',
        },
      ],
    },
    {
      heading: 'When are bike pickups busiest here?',
      blocks: [
        {
          kind: 'list',
          items: [
            'Semester end (June, July and December). Knowledge Park hostels empty together, so pickup slots near Galgotias College fill first.',
            'Monsoon (July to September). Bikes are wrapped against rain before they leave a Shahberi lane or a Gaur City gate.',
          ],
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
  ],
  faqHeading: 'Sending a bike from Greater Noida: questions',
  faqs: [
    {
      question: 'How much does bike transport from Greater Noida cost?',
      answer:
        'It turns on the bike, the route and whether it travels alone. A scooter from Knowledge Park and a cruiser from Gaur City price differently, and the written quote is final.',
    },
    {
      question: 'Can you collect my scooter from my hostel?',
      answer:
        'Yes, from Sharda University, Galgotias College, GNIOT and other Knowledge Park hostels. You ask the warden for the gate time, and we send truck and crew details.',
    },
    {
      question: 'Do I need an NOC to ride my UP 16 bike in another state?',
      answer:
        'Not for a short stay. If the bike stays over 12 months, you re-register it there with an NOC from the Gautam Buddh Nagar transport office.',
    },
    {
      question: 'Can you take the bike from my tower basement?',
      answer:
        'Yes. In Greater Noida West towers we wheel it up the ramp to the gate, once the society issues an exit pass.',
    },
    {
      question: 'Can the bike go with my household goods?',
      answer:
        'Yes, on one quote with [home shifting in Greater Noida](/packers-and-movers/greater-noida/home-shifting). The bike is packed and loaded with your Omicron or Alpha goods.',
    },
    {
      question: 'Can I check who will collect the bike?',
      answer:
        'Yes. Crew names and the truck number come before pickup; check them on [verify your crew](/verify). Optional [transit insurance](/insurance) covers declared value.',
    },
  ],
  servicesHeading: 'Other moving services in Greater Noida',
  nearbyHeading: 'Bike transport from nearby cities',
  nearbyIntro:
    'Your bike can also be collected from a neighbouring city, on the same written terms.',
  routes: ['Greater Noida to Bangalore', 'Greater Noida to Pune', 'Greater Noida to Lucknow'],
  ctaHeading: 'Sending your bike from Greater Noida? Get one written price.',
  ctaText:
    'Tell us the bike, your hostel or tower and the destination. We fix the pickup point and send one fixed quote.',
};
