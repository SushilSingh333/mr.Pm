import type { ServicePage } from './types.js';

/** Bike transport page, from the owner's brief "BikeTransport_FINAL" (3 October 2026). */
export const bikeTransport: ServicePage = {
  title: 'Bike Transport Services | Door to Door | MrMoverPacker',
  metaDescription:
    'Bike transport service, door to door. Foam-wrapped, crated on request, photographed at pickup and drop. One fixed price, no railway parcel queues.',
  h1: 'Bike transport service, door to door, with one fixed price',
  subhead:
    'We pick your bike up from your gate, wrap it properly, and hand it back at the new address with photos to prove its condition. No parcel office, no queue, no packing by whoever is free that day.',
  trust: [
    'Fixed written quote',
    'Photographed at pickup and drop',
    'Loaded on ramps, never lifted by the handlebars',
    'Transit insurance available',
  ],
  quoteMode: 'bike',
  quoteNote: 'Tell us the bike and the route. A coordinator sends one fixed, written price.',
  sections: [
    {
      heading: 'How our bike shifting service works',
      blocks: [
        {
          kind: 'steps',
          items: [
            {
              title: 'Quote',
              body: 'Tell us the bike, the route and the date. You get one written price.',
            },
            {
              title: 'Pickup',
              body: 'Our crew comes to your door, photographs the bike from all sides and notes the odometer.',
            },
            {
              title: 'Packing',
              body: 'Foam and bubble over the tank and panels, padding on the levers and mirrors, stretch film over it all. Crated in wood if you choose.',
            },
            {
              title: 'Transit',
              body: 'Loaded on ramps and strapped upright in a closed vehicle, tracked live.',
            },
            {
              title: 'Delivery',
              body: 'We unwrap it at your door, match it against the pickup photos, and you sign off.',
            },
          ],
        },
      ],
    },
    {
      heading: 'Most bike damage happens while loading, not on the highway',
      blocks: [
        {
          kind: 'text',
          body: 'A motorcycle has no shell. The weight sits high, and the parts most likely to get hurt are the ones sticking out. So that is where the care goes.',
        },
        {
          kind: 'table',
          columns: ['Part', 'What we do'],
          rows: [
            ['Tank and side panels', 'Foam sheet, then bubble wrap, then stretch film'],
            ['Mirrors and levers', 'Padded, or mirrors removed and packed separately'],
            ['Exhaust and indicators', 'Corner foam and wrap'],
            [
              'Front fork and wheels',
              'Bike strapped upright at four points so the fork never takes a side load',
            ],
            [
              'Long routes or premium bikes',
              'Wooden crate on request, the closest thing to a guarantee against handling damage',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Nobody lifts a bike by the handlebars and nobody drops it onto a truck bed. That is exactly how a fork gets bent.',
        },
      ],
    },
    {
      heading: 'Bike transport by train vs door-to-door: an honest comparison',
      blocks: [
        {
          kind: 'text',
          body: 'Railway parcel is often cheaper on paper, and for some people it is the right choice. Here is what each one actually involves.',
        },
        {
          kind: 'table',
          columns: ['', 'Railway parcel', 'MrMoverPacker door to door'],
          rows: [
            ['Pickup', 'You ride it to the station parcel office', 'We collect from your gate'],
            [
              'Packing',
              'Usually done at the station by local packers, quality varies',
              'Our crew, foam and wrap, crate on request',
            ],
            [
              'Handling',
              'Changes hands several times between platform and wagon',
              'One crew loads, one crew unloads',
            ],
            [
              'Delivery',
              'You collect from the destination station',
              'Delivered to your new address',
            ],
            ['Condition record', 'Usually none', 'Photos at pickup and delivery'],
            [
              'Price',
              'Freight plus packing, porter and local transport at both ends',
              'One written price for all of it',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'If you are near both stations and the bike is not precious, train can work. If you want it at your door without taking a day off twice, that is what we do.',
        },
      ],
    },
    {
      heading: 'Bike transport charges: what decides your price',
      blocks: [
        {
          kind: 'list',
          items: [
            'Distance: within the city, or city to city',
            'Bike type: a scooter takes less space than a 650 cc tourer',
            'Packing: standard wrap, or a wooden crate',
            'Insurance: optional transit cover up to your declared value, shown as one line',
          ],
        },
        {
          kind: 'text',
          body: 'Your written quote is the final number, with GST shown. Moving house too? Add the bike to your [home shifting quote](/services/home-shifting).',
        },
      ],
    },
    {
      heading: 'What the price covers',
      blocks: [{ kind: 'scope' }],
    },
    {
      heading: 'Documents you need for bike transport',
      blocks: [
        {
          kind: 'list',
          items: [
            'Copy of the RC (registration certificate)',
            "Copy of the bike's insurance policy",
            "Owner's photo ID",
            'An authorisation letter if someone else hands the bike over',
          ],
        },
        { kind: 'text', body: 'The originals stay with you, never in the vehicle.' },
      ],
    },
    {
      heading: 'Before handover: a 5-minute checklist',
      blocks: [
        {
          kind: 'list',
          items: [
            "Ride the tank down. Fuel is drained before transit for safety, so don't fill up.",
            'Remove top boxes, panniers and anything loose, or tell us about them.',
            'Declare aftermarket parts (crash guards, exhausts, raised bars). Undeclared accessories are the most common reason a claim gets stuck.',
            'Note the odometer and take your own photos too.',
            'Keep the spare key with you.',
          ],
        },
        {
          kind: 'text',
          body: 'Moving to another state for good? If you will keep the bike in the new state for more than 12 months, it needs re-registration there, and you will need an NOC from your current RTO. That paperwork is not part of this service, but ask us and we will tell you where to start.',
        },
      ],
    },
  ],
  faqHeading: 'Bike transport questions',
  faqs: [
    {
      question: 'How long does bike transport take?',
      answer:
        'Within the city, usually the same day. City to city, your quote gives a dated delivery window.',
    },
    {
      question: 'Is my bike insured in transit?',
      answer:
        "Basic liability cover comes with every move. For full cover up to your bike's declared value, add transit insurance; it shows as one line on your quote. See [insurance details](/insurance).",
    },
    {
      question: 'What if it arrives with a scratch?',
      answer:
        'We compare it against the pickup photos at your door. If the damage happened with us, we settle it under our written claims process. See [how claims work](/claims).',
    },
    {
      question: 'Do you move scooters and electric bikes?',
      answer:
        'Yes. For electric scooters, tell us the model when you book, as battery handling depends on it.',
    },
    {
      question: 'Can I pack my luggage with the bike?',
      answer:
        'Not on the bike or inside the crate. Add a few boxes to the same quote and they travel in the same vehicle.',
    },
    {
      question: 'Do I need to be there at pickup and delivery?',
      answer:
        'Someone does, to hand over the keys and sign the condition report. It can be a friend or family member with your authorisation letter.',
    },
  ],
  citiesHeading: 'Bike transport from {count} cities',
  citiesIntro: 'Pickup from {count} cities across North India, delivery anywhere in India.',
  ctaHeading: 'Get your bike there in the condition it left',
  ctaText:
    'Tell us the bike and the route. You get one written price, and a person, not a bot, calls you back.',
  related: [
    { label: 'Car transport', href: '/services/car-transport' },
    { label: 'Home shifting', href: '/services/home-shifting' },
    { label: 'All services', href: '/services' },
  ],
  serviceType: 'Bike transport',
};
