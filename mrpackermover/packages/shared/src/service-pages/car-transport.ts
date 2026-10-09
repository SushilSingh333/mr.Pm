import type { ServicePage } from './types.js';

/** Car transport page, from the owner's brief "CarTransport_FINAL" (8 October 2026). */
export const carTransport: ServicePage = {
  title: 'Car Transport Services | Fixed Written Price | MrMoverPacker',
  metaDescription:
    'Car transport service from Delhi NCR and Meerut to anywhere in India. Open or enclosed carrier, photo condition report, one fixed written price.',
  h1: 'Car transport services with one fixed, written price',
  subhead:
    'Your car goes on a carrier, not on the road. We collect it from your gate in Delhi NCR or Meerut, record its condition in photos, and deliver it anywhere in India for one price agreed in writing.',
  trust: [
    'Photo condition report at pickup and delivery',
    'Open or enclosed carrier',
    'Driven 0 km on the way',
    'Transit insurance available',
  ],
  quoteMode: 'car',
  quoteNote:
    'Tell us the car and the route. A coordinator sends one fixed, written price, tolls included.',
  sections: [
    {
      heading: 'How does car transport work?',
      blocks: [
        {
          kind: 'text',
          body: 'Your car is loaded onto a carrier truck and stays there until delivery. Nobody drives it between cities, so the odometer reading does not change.',
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Quote',
              body: 'Tell us the car, the route, the carrier type and the date. You get one written price.',
            },
            {
              title: 'Pickup and inspection',
              body: 'We collect from your door. You and our crew walk round the car, photograph every panel, and note the odometer and fuel. You get a copy.',
            },
            {
              title: 'Loading',
              body: 'Driven up a ramp onto the carrier, wheels locked, soft straps over the tyres. No chains on the body.',
            },
            {
              title: 'Transit',
              body: 'You get progress updates on WhatsApp until delivery.',
            },
            {
              title: 'Delivery and check',
              body: 'We walk round it again with you against the pickup photos. You sign only when you are satisfied.',
            },
          ],
        },
      ],
    },
    {
      heading: 'Open vs enclosed car carrier: which should you choose?',
      blocks: [
        {
          kind: 'text',
          body: 'An open carrier suits most everyday cars and costs less. Choose an enclosed carrier for a new, premium or vintage car, or for long routes in the monsoon.',
        },
        {
          kind: 'table',
          columns: ['', 'Open carrier', 'Enclosed carrier'],
          rows: [
            [
              'How it travels',
              'On an open multi-car trailer',
              'Inside a closed container, alone or with one other car',
            ],
            [
              'Protection',
              'Exposed to dust, rain and road grit',
              'Covered from weather and debris',
            ],
            ['Cost', 'Lower', 'Higher'],
            [
              'Availability',
              'Frequent departures on main routes',
              'Fewer departures, book earlier',
            ],
            [
              'Best for',
              'Hatchbacks, sedans, everyday SUVs',
              'New, premium, luxury or vintage cars',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Not sure? Tell us the car and the route and we will recommend one, with both prices on the quote.',
        },
      ],
    },
    {
      heading: 'Is my car safe and insured during transport?',
      blocks: [
        {
          kind: 'text',
          body: "Every car travels with basic liability cover. For full cover up to your car's declared value, add transit insurance; it shows as one line on your quote.",
        },
        {
          kind: 'list',
          items: [
            'Photo condition report. Every panel, the wheels and the interior, at pickup and at delivery. Both sets are shared with you, so any question is settled by the record, not by memory.',
            'Wheel locks and soft tyre straps. The car is held by its wheels, never chained by the body.',
            'ID-verified crew and vehicle. Check who is coming and in which carrier before pickup: [verify your crew](/verify).',
            'Written claims process. If something does happen, it is assessed against the pickup photos and settled. We publish how fast. See [how claims work](/claims) and [transit insurance](/insurance).',
          ],
        },
      ],
    },
    {
      heading: 'How much does car transport cost?',
      blocks: [
        {
          kind: 'text',
          body: 'The price depends on six things. You get one fixed, written figure after we know them, with GST shown, and tolls included.',
        },
        {
          kind: 'table',
          columns: ['Factor', 'How it changes the price'],
          rows: [
            [
              'Distance and route',
              'Busy routes between big cities cost less per km, because carriers run full both ways',
            ],
            ['Car size', 'A hatchback takes less space on the carrier than an SUV'],
            ['Carrier type', 'Enclosed costs more than open'],
            [
              'Timing',
              'Month-end and festival weeks are busier; flexible dates can lower the price',
            ],
            [
              'Delivery point',
              'If the carrier cannot reach your lane, we agree the nearest delivery point in advance',
            ],
            ['Insurance', 'Optional transit cover is priced on your declared value'],
          ],
        },
        {
          kind: 'text',
          body: 'Use the form above to ask for your written price. Moving house too? Add the car to your home shifting quote and handle both with one coordinator: see [home shifting services](/services/home-shifting).',
        },
      ],
    },
    {
      heading: 'What the price covers',
      blocks: [{ kind: 'scope' }],
    },
    {
      heading: 'How long does car transport take?',
      blocks: [
        {
          kind: 'text',
          body: 'Most intercity car transport takes 2 to 12 days, depending on distance and how soon a carrier departs on your route. Your quote gives a dated delivery window, not a vague promise.',
        },
        {
          kind: 'table',
          columns: ['Distance', 'Typical time'],
          rows: [
            ['Within Delhi NCR', 'Same or next day'],
            ['Up to 500 km', '2 to 4 days'],
            ['500 to 1,000 km', '3 to 6 days'],
            ['1,000 to 1,500 km', '5 to 8 days'],
            ['Over 1,500 km', '7 to 12 days'],
          ],
        },
      ],
    },
    {
      heading: 'Can a car carrier reach my door?',
      blocks: [
        {
          kind: 'text',
          body: 'Often, but not always. A full-size open carrier is a long trailer, and many colonies, societies and old-city lanes will not take it. In those cases we agree the nearest point the carrier can safely reach before you book, so there are no surprises on the day.',
        },
      ],
    },
    {
      heading: 'Car transport by train vs by carrier: an honest comparison',
      blocks: [
        {
          kind: 'table',
          columns: ['', 'Train', 'MrMoverPacker carrier'],
          rows: [
            [
              'Pickup and drop',
              'You drive to and from the stations',
              'From your gate to your new address',
            ],
            [
              'Booking',
              'Depends on wagon and route availability',
              'One booking, one written quote',
            ],
            [
              'Handling',
              'Loaded and unloaded at both stations',
              'One crew loads, one crew unloads',
            ],
            ['Condition record', 'Usually your own', 'Photo report at both ends'],
            [
              'Total cost',
              'Freight plus local transport and your time at both ends',
              'One price for all of it',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'If you live near both stations and have time to spare, train can work. If you want it done door to door, that is what we do.',
        },
      ],
    },
    {
      heading: 'Which documents do I need for car transport?',
      blocks: [
        {
          kind: 'list',
          items: [
            'Copy of the RC (registration certificate)',
            'Copy of the car insurance policy',
            'Copy of the PUC certificate',
            "Owner's photo ID",
            'An authorisation letter if someone else hands the car over',
          ],
        },
        { kind: 'text', body: 'Keep the originals with you, never in the car.' },
      ],
    },
    {
      heading: 'Before handover: a 10-minute checklist',
      blocks: [
        {
          kind: 'list',
          items: [
            'Fuel at a quarter tank or less.',
            'Remove everything personal, including from the boot. Loose items are not covered and can damage the interior.',
            'Take off removable accessories: roof carrier, bike rack, dashcam.',
            'Declare any aftermarket fittings (alloys, body kit, music system) when you book.',
            'Wash the car so scratches and dents show clearly in the photos.',
            'Note the odometer and take your own photos too.',
            'Turn off the alarm or tell us how to disarm it. Keep the spare key with you.',
          ],
        },
        {
          kind: 'text',
          body: 'Moving to another state for good? If the car stays in the new state for more than 12 months, it must be re-registered there, which needs an NOC from your current RTO. Some states refund unused road tax; ask your RTO. If you are eligible for a BH (Bharat) series number, such as government and defence staff or employees of companies with offices in 4 or more states, you can avoid re-registering on future moves. RTO paperwork is not part of our service, but we will tell you where to start.',
        },
      ],
    },
  ],
  faqHeading: 'Car transport questions',
  faqs: [
    {
      question: 'How much does car transport cost?',
      answer:
        'It depends on distance, car size, carrier type, timing and delivery access. Use the form above to ask for your written price; your written quote is final. See [how pricing works](/pricing).',
    },
    {
      question: 'How long does car transport take?',
      answer:
        'From 2 days for nearby cities to 12 days for the longest routes. Your quote gives a dated delivery window.',
    },
    {
      question: 'Can I leave things in the car?',
      answer:
        'No. Personal items are not covered in transit, and loose things can damage the interior. Pack them with your household goods instead.',
    },
    {
      question: 'Will anyone drive my car?',
      answer:
        'Not between cities. It rides on the carrier the whole way. That is why the odometer reading does not change.',
    },
    {
      question: 'Do I need to be there at pickup and delivery?',
      answer:
        'Someone does, to hand over the keys and sign the condition report. A family member or friend with your authorisation letter is fine.',
    },
    {
      question: 'Do you transport cars within Delhi NCR?',
      answer: 'Yes. Local car moves within Delhi NCR are usually done the same or next day.',
    },
    {
      question: 'Can you move my car and household goods together?',
      answer:
        'Yes. One quote, one coordinator, one GST invoice. See [home shifting services](/services/home-shifting).',
    },
  ],
  citiesHeading: 'Car transport from Delhi NCR and Meerut',
  citiesIntro: 'We pick up from {count} cities and deliver anywhere in India.',
  ctaHeading: 'Get your car there in the condition it left',
  ctaText:
    'Tell us the car and the route. You get one written price, and a real person calls you back.',
  related: [
    { label: 'Bike transport', href: '/services/bike-transport' },
    { label: 'Home shifting', href: '/services/home-shifting' },
    { label: 'All services', href: '/services' },
  ],
  serviceType: 'Car transport',
};
