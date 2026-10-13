import type { GeoPage } from '../../geo-pages/types.js';

/** Bike transport from Meerut, round 5: written from the owner's Meerut brief and sourced facts (two-wheeler ban on the Delhi-Meerut Expressway, RTO Meerut UP-15 and NOC on Parivahan Vahan, CCS, Subharti, Shobhit and IIMT universities, Cantonment entry, NH 58 Kanwar closures). No transit times. */
export const meerutBikeTransport: GeoPage = {
  title: 'Bike Transport from Meerut | Door to Door | MrMoverPacker',
  metaDescription:
    'Bike transport from Meerut, collected from your lane, hostel or Cantt gate, wrapped and carried by truck anywhere in India. One fixed, written price.',
  h1: 'Bike transport from Meerut, collected from your gate',
  subhead:
    'Bike transport from Meerut begins at your door: a lane near Budhana Gate, a hostel near CCS University or a Cantt quarter. We wrap the bike, load it on ramps and send one price in writing.',
  trust: [
    'Pickup from lanes, hostels and Cantt gates',
    'UP-15 NOC steps explained',
    'Photos at pickup and drop',
    'Fixed written price',
  ],
  sections: [
    {
      heading: 'What makes bike transport from Meerut different?',
      blocks: [
        {
          kind: 'text',
          body: 'Students at the universities, Cantonment postings and families bound for Delhi all send bikes out of Meerut.',
        },
        {
          kind: 'list',
          items: [
            'Expressway ban. Two-wheelers are barred from the Delhi-Meerut Expressway, the fast road to Delhi. Our truck carries the bike along it to Ghaziabad, Noida or Delhi.',
            'Student bikes. Subharti University on the NH 58 bypass draws many students from other states, and CCS University, Shobhit University at Modipuram and IIMT University in Ganga Nagar send bikes home at term end too.',
            'Lane pickups. Where a lane near Abu Lane or Begum Bridge is too tight for the truck, the crew wheels the bike to the main road.',
            'Cantonment postings. A bike leaving Mall Road or Lalkurti needs the truck number and crew names at the Cantt gate first.',
            'Kanwar Yatra weeks. Trucks come off NH 58 and the expressway in stages, so July and August pickups are dated around the closures.',
          ],
        },
        {
          kind: 'text',
          body: 'Wrapping, crates and the delivery check are on the [bike transport](/services/bike-transport) page. Areas from Modipuram to Partapur are listed on the [Meerut city page](/packers-and-movers/meerut).',
        },
      ],
    },
    {
      heading: 'Where do we collect bikes in Meerut?',
      blocks: [
        {
          kind: 'table',
          columns: ['Area', 'Pickup point', 'What to expect'],
          rows: [
            [
              'Old city: Budhana Gate, Abu Lane, Sadar Bazaar',
              'Your door, then wheeled to the main road',
              'Early pickup before the shops open',
            ],
            [
              'CCS University Road and [Ganga Nagar](/packers-and-movers/meerut/ganga-nagar) near IIMT',
              'Hostel gate or rented room',
              'Hostel timing agreed before the crew comes',
            ],
            [
              'NH 58 bypass and [Modipuram](/packers-and-movers/meerut/modipuram)',
              'Near the Subharti and Shobhit campuses',
              'Truck stands in a side road, never on NH 58',
            ],
            [
              '[Meerut Cantt](/packers-and-movers/meerut/meerut-cantt)',
              'Quarters and bazaar houses',
              'Entry details sent ahead',
            ],
            [
              'Shastri Nagar, Pallavpuram, Jagriti Vihar',
              'Your gate on the sector road',
              'Bike wrapped at the gate before loading',
            ],
          ],
        },
      ],
    },
    {
      heading: 'What should you arrange before sending a bike from Meerut?',
      blocks: [
        {
          kind: 'text',
          body: 'Most rows are papers for RTO Meerut; the rest depend on your gate.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            ['Copies of the UP-15 RC, insurance and your ID', 'You', 'When the crew arrives'],
            [
              'NOC from RTO Meerut, Sector 12, Shastri Nagar, if the bike leaves Uttar Pradesh for good',
              'You, on the Parivahan Vahan portal',
              'Before re-registering in the new state',
            ],
            ['Pending challans on the UP-15 number cleared', 'You', 'Before the NOC application'],
            [
              'Truck and crew details for a Meerut Cantt gate',
              'We share them',
              '2 to 3 days before',
            ],
            [
              'Pickup time at a hostel near CCS University',
              'You, with the hostel',
              'The day before',
            ],
            ['Tank ridden low before a long run to Bangalore or Pune', 'You', 'Before pickup'],
          ],
        },
      ],
    },
    {
      heading: 'How much does bike transport from Meerut cost?',
      blocks: [
        {
          kind: 'text',
          body: 'A scooter going to Ghaziabad and a 650 cc tourer going to Bangalore are priced differently. Distance, the bike and the packing set the figure.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects bike transport from Meerut'],
          rows: [
            [
              'Distance',
              'Ghaziabad and Noida are short truck runs; Bangalore or Pune is city to city',
            ],
            [
              'Bike type',
              'A scooter from a Ganga Nagar hostel takes less space than a tourer from Pallavpuram',
            ],
            ['Packing', 'Standard wrap for a Delhi drop; a wooden crate for a long run to Lucknow'],
            [
              'Pickup point',
              'A bike wheeled out of a lane near Budhana Gate is planned on the survey',
            ],
            ['Season', 'Kanwar Yatra closures on NH 58 and wedding season make trucks scarce'],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line, and optional [transit insurance](/insurance) covers declared value.',
        },
      ],
    },
    {
      heading: 'What the price covers',
      blocks: [{ kind: 'scope' }],
    },
  ],
  faqHeading: 'Bike transport from Meerut: questions',
  faqs: [
    {
      question: 'Can I just ride my bike to Delhi?',
      answer:
        'Not on the Delhi-Meerut Expressway, which bars two-wheelers. Our truck carries it along that road to Delhi instead.',
    },
    {
      question: 'Do you collect from hostels near CCS University?',
      answer:
        'Yes, from the hostel gate or your rented room. Agree the time with your CCS University hostel first, and we send the crew names.',
    },
    {
      question: 'Do I need an NOC to keep my UP-15 bike in another state?',
      answer:
        'Yes, if it will stay there for good. RTO Meerut issues the NOC, and the bike is re-registered in the new state within 12 months.',
    },
    {
      question: 'How much does bike transport from Meerut cost?',
      answer:
        'Distance, bike type and packing decide it. The written quote after you share these details is final.',
    },
    {
      question: 'Can you pick up a bike from Meerut Cantt?',
      answer:
        'Yes. The truck number and crew names go to the Cantt gate two to three days ahead. You can [verify your crew](/verify) before handing over the keys.',
    },
    {
      question: 'Can the bike go with my household goods?',
      answer:
        'Yes. Add it to a home move from Shastri Nagar or anywhere in Meerut, and it travels in the same truck. Any damage is checked against the pickup photos under [how claims work](/claims).',
    },
  ],
  servicesHeading: 'Other moving services in Meerut',
  nearbyHeading: 'Bike transport from nearby cities',
  nearbyIntro: 'We also collect bikes across Delhi NCR and deliver them anywhere in India.',
  routes: ['Meerut to Delhi', 'Meerut to Noida', 'Meerut to Dehradun', 'Meerut to Bangalore'],
  ctaHeading: 'Sending a bike from Meerut? Get one written price.',
  ctaText:
    'Tell us the bike, your pickup point and the destination. We plan the collection and send one fixed quote.',
};
