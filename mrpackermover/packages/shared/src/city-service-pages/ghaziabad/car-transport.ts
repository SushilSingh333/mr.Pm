import type { GeoPage } from '../../geo-pages/types.js';

/**
 * Car transport from Ghaziabad (round 5): one service in one city. Facts: Ghaziabad RTO
 * (UP-14, Bulandshahr Road Industrial Area); NOC on Form 28 with financier consent (Motor
 * Vehicles Act s.48, Parivahan); re-registration within 12 months (s.47); address change
 * within 30 days inside the state (s.49); NGT age limits for Delhi NCR, enforced in
 * Ghaziabad; Hindon Elevated Road for light vehicles; Delhi-Meerut and Eastern Peripheral
 * Expressways; Kanwar Yatra truck closure (city page).
 */
export const ghaziabadCarTransport: GeoPage = {
  title: 'Car Transport from Ghaziabad | Door to Door | MrMoverPacker',
  metaDescription:
    'Car transport from Ghaziabad on an open or enclosed carrier. UP-14 NOC steps, NCR age rules and the carrier loading point explained. One fixed price.',
  h1: 'Car transport from Ghaziabad, from your society gate to anywhere in India',
  subhead:
    'Car transport from Ghaziabad starts with two checks: where a carrier can load near your society, and whether your UP-14 car needs an NOC for its new state. We sort out the first and tell you where to start on the second.',
  trust: [
    'Photo condition report at both ends',
    'Open or enclosed carrier',
    'Loading point agreed at survey',
    'Tolls included in the fixed quote',
  ],
  sections: [
    {
      heading: 'What makes car transport from Ghaziabad different?',
      blocks: [
        {
          kind: 'text',
          body: 'Ghaziabad sits on the Delhi border but inside Uttar Pradesh, and that shapes the paperwork. Our [car transport service](/services/car-transport) explains the carrier itself.',
        },
        {
          kind: 'list',
          items: [
            'UP-14 registration. Ghaziabad cars are registered at the Ghaziabad RTO, code UP-14, in the Bulandshahr Road Industrial Area. That office issues the NOC a car needs to leave the state for good.',
            'Same state, no NOC. Noida, Greater Noida and Meerut are in Uttar Pradesh too. A car moving there keeps its UP number, and only the address on the RC changes.',
            'NCR age limits. Under NGT directions for the Delhi NCR, diesel cars over 10 years and petrol cars over 15 may not run here. Transport and police teams seize such cars in Ghaziabad, so an older car leaves on the carrier.',
            'Carrier access. A full carrier cannot use the Hindon Elevated Road and rarely fits inside a society. The handover point is fixed on the survey.',
            'Roads out. Carriers take the Delhi-Meerut Expressway or the Eastern Peripheral Expressway, which links Dasna with Kundli and Palwal.',
          ],
        },
      ],
    },
    {
      heading: 'Where does the carrier load in Ghaziabad?',
      blocks: [
        {
          kind: 'text',
          body: 'The car is brought from your parking to the nearest point where the carrier can safely stand. The [Ghaziabad city page](/packers-and-movers/ghaziabad) describes each area.',
        },
        {
          kind: 'table',
          columns: ['Area', 'Handover point', 'What to know'],
          rows: [
            [
              '[Indirapuram](/packers-and-movers/ghaziabad/indirapuram), Vaishali, Vasundhara',
              'Society gate or the nearest main road',
              'Gate pass with crew names sent ahead',
            ],
            [
              '[Raj Nagar Extension](/packers-and-movers/ghaziabad/raj-nagar-extension)',
              'Tower gate on the main road',
              'Carrier comes by NH 58, never the elevated road',
            ],
            [
              'Crossings Republik, Siddharth Vihar',
              'Township road near NH 9',
              'Easy run onto the Delhi-Meerut Expressway',
            ],
            [
              'Raj Nagar, Kavi Nagar, Govindpuram',
              'Nearest road the carrier can reach',
              'Agreed on the survey, before you book',
            ],
          ],
        },
      ],
    },
    {
      heading: 'What paperwork does a car leaving Ghaziabad need?',
      blocks: [
        {
          kind: 'text',
          body: 'RTO work is yours, not part of our service, but this is the usual order for a UP-14 car.',
        },
        {
          kind: 'table',
          columns: ['What', 'Who arranges it', 'When'],
          rows: [
            [
              'NOC on Form 28 from the Ghaziabad RTO, for a move out of UP',
              'You, on Parivahan or at the RTO',
              'Before re-registering elsewhere',
            ],
            [
              "Financier's consent on Form 28, if the car is on a loan",
              'You, with your bank',
              'Before the NOC application',
            ],
            ['Pending UP challans cleared', 'You', 'Before the NOC is issued'],
            [
              'Address change on the RC, for Noida or Meerut',
              'You, with the RTO',
              'Within 30 days of moving',
            ],
            [
              'Re-registration in Delhi, Haryana or another state',
              'You, at the new RTO',
              'Within 12 months',
            ],
            [
              'Carrier handover point near your Ghaziabad home',
              'Us, on the survey',
              'Before booking',
            ],
          ],
        },
      ],
    },
    {
      heading: 'How much does car transport from Ghaziabad cost?',
      blocks: [
        {
          kind: 'text',
          body: 'It depends on the route, the car, the carrier type and where the car is handed over in Ghaziabad.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it affects car transport from Ghaziabad'],
          rows: [
            [
              'Route',
              'Meerut runs use the Delhi-Meerut Expressway; southbound carriers go round by Palwal',
            ],
            ['Handover', 'A Raj Nagar Extension tower gate is simpler than a Kavi Nagar lane'],
            [
              'Carrier',
              'Enclosed for a new car leaving a Crossings Republik basement, open for most others',
            ],
            [
              'Season',
              'Kanwar Yatra weeks in July and August push trucks off the Delhi-Meerut Expressway',
            ],
          ],
        },
        {
          kind: 'text',
          body: '[How pricing works](/pricing) explains each line of the written quote. Full cover is optional [transit insurance](/insurance) on declared value.',
        },
      ],
    },
    { heading: 'What the price covers', blocks: [{ kind: 'scope' }] },
  ],
  faqHeading: 'Moving a car out of Ghaziabad: your questions',
  faqs: [
    {
      question: 'How much does car transport from Ghaziabad cost?',
      answer:
        'It depends on distance, car size, carrier type and the handover point. A car loaded at a Raj Nagar Extension gate for Bangalore is priced on that route, with GST and tolls shown.',
    },
    {
      question: 'Do I need an NOC to move my car to Noida?',
      answer:
        'No. Noida is in Uttar Pradesh, so your UP-14 number stays valid. Update the address on your RC within 30 days of moving.',
    },
    {
      question: 'Do I need an NOC to move my car to Delhi or Gurgaon?',
      answer:
        'Yes, if it will stay there more than 12 months. Apply on Form 28 to the Ghaziabad RTO, then re-register with the Delhi or Haryana RTO.',
    },
    {
      question: 'My diesel car is over 10 years old. Can it still go?',
      answer:
        'It rides on the carrier, so it is never driven on NCR roads. Ask the Ghaziabad RTO about the NOC first, as states differ on re-registering an older car.',
    },
    {
      question: 'Can the carrier come inside my society?',
      answer:
        'Rarely. A long carrier seldom fits the internal roads of Indirapuram or Crossings Republik societies, so the handover point is agreed on the survey.',
    },
    {
      question: 'Will the Kanwar Yatra delay my car?',
      answer:
        'In the yatra weeks of July and August the Delhi-Meerut Expressway closes to trucks. Carriers then use NH 9 or the Eastern Peripheral Expressway, and your dated delivery window allows for it.',
    },
  ],
  servicesHeading: 'Other moving services in Ghaziabad',
  nearbyHeading: 'Car transport from nearby cities',
  nearbyIntro:
    'We also collect cars from Delhi, Noida, Greater Noida and Meerut, and deliver anywhere in India.',
  routes: [
    'Ghaziabad to Bangalore',
    'Ghaziabad to Lucknow',
    'Ghaziabad to Dehradun',
    'Ghaziabad to Delhi',
  ],
  ctaHeading: 'Sending a car from Ghaziabad? Get one written price.',
  ctaText:
    'Tell us the car, your society and the destination. We agree the carrier handover point and send one fixed quote.',
};
