import type { GeoPage } from '../../geo-pages/types.js';

/**
 * Bike transport in Faridabad (round 5), from the owner's Faridabad brief (areas, routes) and
 * sourced facts: registration codes HR-51, HR-29 and HR-87, the registering authority in
 * Sector 12, the Form 28 NOC on Parivahan, GRAP Stage IV truck entry into Delhi.
 * No transit times for bikes.
 */
export const faridabadBikeTransport: GeoPage = {
  title: 'Bike Transport in Faridabad | Door to Door | MrMoverPacker',
  metaDescription:
    'Bike transport in Faridabad, door to door: collected from tower basements or NIT lanes, wrapped and photographed, with NOC steps for HR bikes explained.',
  h1: 'Bike transport in Faridabad, collected from your basement or your lane',
  subhead:
    'Bike transport in Faridabad begins where the bike is parked: a Neharpar basement or a narrow NIT lane. We collect it there, wrap it and hand it back with photos.',
  trust: [
    'Collected from basement or lane',
    'Photographed at pickup and drop',
    'Standard wrap or wooden crate',
    'Transit insurance available',
  ],
  sections: [
    {
      heading: 'What makes bike transport in Faridabad different?',
      blocks: [
        {
          kind: 'text',
          body: 'Most of the difference is at pickup, between a Greater Faridabad basement and an Old Faridabad lane.',
        },
        {
          kind: 'list',
          items: [
            'Basement pickups. Towers in Sectors 75 to 89 mostly park bikes below ground, so the crew wheels yours up the ramp to the gate.',
            'Lane pickups. In NIT 1 to 5 the van stops on the main road, and the bike is pushed out to it.',
            'Local number plates. Two-wheelers here are registered as HR-51, HR-29 or HR-87, by part of the city.',
            'Delhi crossing. A van into Delhi passes Badarpur, where GRAP Stage IV can stop older diesel goods vehicles in winter.',
            'Monsoon pickups. Bata Chowk and the Old Faridabad railway underpass waterlog in heavy rain, so a wet-day route is checked first.',
          ],
        },
      ],
    },
    {
      heading: 'Where is the bike picked up in Faridabad?',
      blocks: [
        {
          kind: 'text',
          body: 'At your door, wherever that is between Ballabgarh and the Badarpur border. The [Faridabad city guide](/packers-and-movers/faridabad) describes each area.',
        },
        {
          kind: 'table',
          columns: ['Area', 'Pickup point', 'What to expect'],
          rows: [
            [
              '[Greater Faridabad](/packers-and-movers/faridabad/greater-faridabad), Sectors 75 to 89',
              'Basement or stilt parking',
              'Wheeled up the ramp to the van',
            ],
            [
              '[NIT](/packers-and-movers/faridabad/nit) 1 to 5 and Old Faridabad',
              'Your lane',
              'Pushed to the van on the main road',
            ],
            ['Sectors 15 to 31', 'Porch or gate', 'Wrapped at the gate'],
            [
              '[Sainik Colony](/packers-and-movers/faridabad/sainik-colony), Sector 49',
              'Lane outside the house',
              'Van parked off Faridabad-Gurgaon Road',
            ],
            [
              '[Ballabgarh](/packers-and-movers/faridabad/ballabgarh) and Sectors 55 to 65',
              'Lane or society parking',
              'Van entry logged at society gates',
            ],
          ],
        },
      ],
    },
    {
      heading: 'Which papers does a Faridabad bike need?',
      blocks: [
        {
          kind: 'text',
          body: 'Sending a bike out of Haryana needs only copies of the RC and insurance, plus your ID. Re-registering it in another state takes the steps below.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'Form 28 NOC from the Sector 12 authority or the Ballabgarh office',
              'You, on Parivahan Vahan',
              'Before re-registering elsewhere',
            ],
            [
              'Loan closure letter, if a lender is named on the HR RC',
              'You, with your lender',
              'Before the NOC',
            ],
            ['Challans on the HR number checked and paid', 'You', 'Before the NOC'],
            [
              'Van entry at your Neharpar society',
              'You apply; we send the van number',
              'Two days before',
            ],
            [
              'A bike brought in from another state: new HR registration',
              'You, at the Sector 12 office',
              'Within 12 months',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'The NOC work at the Sector 12 office stays with you. [Bike transport](/services/bike-transport) covers how the bike itself is packed.',
        },
      ],
    },
    {
      heading: 'How much does bike transport in Faridabad cost?',
      blocks: [
        {
          kind: 'text',
          body: 'Distance, bike type, packing and the pickup point set it, from a Sector 88 basement to an NIT lane.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects bike transport in Faridabad'],
          rows: [
            ['Pickup', 'A Neharpar basement ramp takes longer than a Sector 15 gate'],
            ['Bike type', 'A scooter from Ballabgarh needs less van space than a big tourer'],
            ['Packing', 'A wooden crate suits a long run such as Faridabad to Bangalore'],
            ['Route', 'Delhi via Badarpur or the Skyway; Gurgaon via the Faridabad-Gurgaon road'],
            [
              'Insurance',
              'Optional cover on declared value for a premium bike from Greater Faridabad',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Every line of a written quote is set out on [how pricing works](/pricing).',
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
  ],
  faqHeading: 'Bike transport in Faridabad: questions',
  faqs: [
    {
      question: 'How much does bike transport in Faridabad cost?',
      answer:
        'It depends on distance, the bike, packing and pickup, such as a Sector 86 basement. Your written quote is final, with GST shown.',
    },
    {
      question: 'My bike is in a tower basement. Do I need to bring it up?',
      answer:
        'No. The crew wheels it up the ramp of your Greater Faridabad tower once the society has logged the van.',
    },
    {
      question: 'Can you collect from a narrow lane in NIT?',
      answer:
        'Yes. The van waits on the main road of your NIT block, and the bike is pushed out to it, never lifted by the handlebars.',
    },
    {
      question: 'Do I need an NOC to send my bike out of Haryana?',
      answer:
        'Not for the journey. A Form 28 NOC from your HR office is needed only when you re-register the bike in the new state.',
    },
    {
      question: 'Do you move electric scooters?',
      answer:
        'Yes, from a Sector 89 basement or a Sector 15 porch alike. Tell us the model when you book, since battery handling depends on it.',
    },
    {
      question: 'Can I check who is collecting my bike?',
      answer:
        'Yes. [Verify your crew](/verify) and the van number before you hand over the keys at your Faridabad gate.',
    },
    {
      question: 'Is my bike insured on the way?',
      answer:
        'Every bike travels with basic liability cover, and optional [transit insurance](/insurance) covers declared value. [How claims work](/claims) relies on the photos taken at pickup.',
    },
  ],
  servicesHeading: 'Other moving services in Faridabad',
  nearbyHeading: 'Bike transport from nearby cities',
  nearbyIntro: 'We also collect bikes from the cities around Faridabad.',
  routes: ['Faridabad to Bangalore', 'Faridabad to Pune', 'Faridabad to Jaipur'],
  ctaHeading: 'Sending a bike from Faridabad? Get one written price.',
  ctaText:
    'Tell us the bike, your sector and where it is going. We plan the pickup from your basement or lane and send one fixed quote.',
};
