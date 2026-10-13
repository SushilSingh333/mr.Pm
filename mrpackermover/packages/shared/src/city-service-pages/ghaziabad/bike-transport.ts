import type { GeoPage } from '../../geo-pages/types.js';

/**
 * Bike transport from Ghaziabad (round 5): one service in one city. Facts: Ghaziabad RTO
 * (UP-14); NOC on Form 28 with financier consent (Parivahan, Motor Vehicles Act s.48);
 * address change within the state (s.49); two-wheelers barred from the Delhi-Meerut
 * Expressway lanes; NCR age limit for petrol vehicles, enforced in Ghaziabad; tower
 * basements and plotted-colony lanes (city and locality pages). No transit times.
 */
export const ghaziabadBikeTransport: GeoPage = {
  title: 'Bike Transport from Ghaziabad | Door to Door | MrMoverPacker',
  metaDescription:
    'Bike transport from Ghaziabad, picked up from your tower basement or colony lane. UP-14 NOC steps and NCR age rules explained, for one fixed price.',
  h1: 'Bike transport from Ghaziabad, from your basement or lane to your new door',
  subhead:
    'Bike transport from Ghaziabad begins at a tower basement in Indirapuram or a narrow lane in Kavi Nagar. We plan how the bike reaches the truck, and tell you which UP-14 papers to sort before it leaves.',
  trust: [
    'Photographed at pickup and drop',
    'Loaded on ramps, strapped upright',
    'Standard wrap or wooden crate',
    'One fixed, written price',
  ],
  sections: [
    {
      heading: 'What makes bike transport from Ghaziabad different?',
      blocks: [
        {
          kind: 'text',
          body: 'Bikes here mostly sit in Trans-Hindon society basements or outside plotted houses in the old city, and each needs a different pickup. Our [bike transport service](/services/bike-transport) covers the wrapping and loading.',
        },
        {
          kind: 'list',
          items: [
            'UP-14 papers. Bikes registered here carry UP-14 numbers from the Ghaziabad RTO. Leaving Uttar Pradesh for good starts with an NOC from that office.',
            'Not on the expressway. Two-wheelers are barred from the Delhi-Meerut Expressway lanes. Inside our truck, a bike bound for Meerut can still use that road.',
            'Basement pickups. In Indirapuram, Vaishali and Raj Nagar Extension towers, the crew wheels the bike up the ramp to the truck at the gate.',
            'Lane pickups. In Kavi Nagar, Govindpuram or Shalimar Garden, the crew walks the bike out to the truck on the main road.',
            'Old petrol bikes. Under NGT directions for the Delhi NCR, petrol vehicles over 15 years old may not run on Ghaziabad roads, bikes included. Such a bike rides in the truck from your gate.',
          ],
        },
      ],
    },
    {
      heading: 'How is a bike collected across Ghaziabad?',
      blocks: [
        {
          kind: 'text',
          body: 'The pickup depends on where the bike is parked, and the [Ghaziabad city page](/packers-and-movers/ghaziabad) covers each area from Kaushambi to Crossings Republik.',
        },
        {
          kind: 'table',
          columns: ['Area', 'Where the bike waits', 'How it reaches the truck'],
          rows: [
            [
              '[Vaishali](/packers-and-movers/ghaziabad/vaishali), Vasundhara, Kaushambi',
              'Society basement or stilt parking',
              'Wheeled up the ramp to the gate',
            ],
            [
              '[Raj Nagar Extension](/packers-and-movers/ghaziabad/raj-nagar-extension), Siddharth Vihar',
              'New tower basements',
              'To the tower gate; the truck stays off the elevated road',
            ],
            [
              '[Crossings Republik](/packers-and-movers/ghaziabad/crossings-republik)',
              'Township society parking',
              'Loaded at the society gate on the township road',
            ],
            [
              '[Govindpuram](/packers-and-movers/ghaziabad/govindpuram), Kavi Nagar, Raj Nagar',
              'Inside the house gate',
              'Walked to the truck where the lane is narrow',
            ],
            [
              '[Shalimar Garden](/packers-and-movers/ghaziabad/shalimar-garden), Pratap Vihar',
              'Lanes off Loni Road and GT Road',
              'Walked out to the nearest wide road',
            ],
          ],
        },
      ],
    },
    {
      heading: 'What should a Ghaziabad bike owner sort out first?',
      blocks: [
        {
          kind: 'text',
          body: 'The RTO steps are yours, and we point you to the right office. A society or lane pickup is ours to plan.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'NOC on Form 28 from the Ghaziabad RTO, for a state outside UP',
              'You',
              'Before re-registering there',
            ],
            [
              'Lender consent on the form, if the bike is on a loan',
              'You, with the lender',
              'Before the NOC',
            ],
            [
              'New address on the RC, for Noida, Greater Noida or Meerut',
              'You, with the RTO',
              'Within 30 days',
            ],
            [
              'Guard desk at your Indirapuram or Vasundhara society told',
              'You',
              'A day before pickup',
            ],
            [
              'Pickup point in a Kavi Nagar or Shalimar Garden lane',
              'Us, on the survey',
              'Before the day',
            ],
          ],
        },
      ],
    },
    {
      heading: 'How much does bike transport from Ghaziabad cost?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on the route, the bike, the packing and the pickup point in Ghaziabad.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects bike transport from Ghaziabad'],
          rows: [
            ['Route', 'A short hop to Noida or Delhi, or a long run to Bangalore'],
            [
              'Bike',
              'A scooter from a Vaishali basement takes less truck space than a heavy tourer',
            ],
            ['Packing', 'Standard wrap for a run to Meerut, a wooden crate for a long route'],
            ['Pickup', 'A Vasundhara tower gate is quicker than a walk out of a Govindpuram lane'],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line of the written quote. Optional [transit insurance](/insurance) covers the declared value.',
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
  ],
  faqHeading: 'Sending a bike from Ghaziabad: your questions',
  faqs: [
    {
      question: 'How much does bike transport from Ghaziabad cost?',
      answer:
        'It depends on the route, the bike, wrap or crate, and where it is collected. A scooter from a Raj Nagar Extension basement going to Lucknow gets one written price, with GST shown.',
    },
    {
      question: 'Can you collect the bike from my society basement?',
      answer:
        'Yes. The crew wheels it up the ramp of your Indirapuram or Raj Nagar Extension tower and loads it at the gate.',
    },
    {
      question: 'Do I need an NOC if I move to Noida?',
      answer:
        'No, because Noida and Ghaziabad are both in Uttar Pradesh. Keep the UP-14 number and update the address on the RC.',
    },
    {
      question: 'Is railway parcel from Ghaziabad Junction cheaper?',
      answer:
        'Railway parcel can look cheaper on paper. You ride to Ghaziabad Junction, queue at the parcel office and collect at the other station, while we collect from your gate.',
    },
    {
      question: 'My scooter is over 15 years old. Can it still go?',
      answer:
        'It travels in the truck, never on Ghaziabad roads. Check the NOC with the Ghaziabad RTO first, since the new state decides on re-registering an old vehicle.',
    },
    {
      question: 'Can I check who is collecting my bike?',
      answer:
        'Yes. Before the crew reaches your Vaishali or Kavi Nagar address, [verify your crew](/verify) and the vehicle number.',
    },
  ],
  servicesHeading: 'Other moving services in Ghaziabad',
  nearbyHeading: 'Bike transport from nearby cities',
  nearbyIntro:
    'We also collect bikes from Delhi, Noida, Greater Noida and Meerut, and deliver anywhere in India.',
  routes: [
    'Ghaziabad to Bangalore',
    'Ghaziabad to Lucknow',
    'Ghaziabad to Dehradun',
    'Ghaziabad to Delhi',
  ],
  ctaHeading: 'Sending a bike from Ghaziabad? Get one written price.',
  ctaText:
    'Tell us the bike, where it is parked and where it is going. We plan the pickup and send one fixed quote.',
};
