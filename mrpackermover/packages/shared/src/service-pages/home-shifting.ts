import type { ServicePage } from './types.js';

/** Home shifting page, from the owner's brief "Home_Shifting_Page" (5 October 2026). */
export const homeShifting: ServicePage = {
  title: 'Home Shifting Services | Fixed Written Price | MrMoverPacker',
  metaDescription:
    'Home shifting services on one fixed, itemised quote after a video survey. Own ID-verified crews, pickup from {count} cities. See every line before you book.',
  h1: 'Home Shifting Services with One Fixed, Written Price',
  subhead:
    'We survey your home on video, then put one itemised price in writing. Our own ID-verified crews pack, move and reassemble. Pickup from {count} North India cities, delivery anywhere in India.',
  trust: [
    'One written, itemised quote',
    'Basic liability cover on every move',
    'Crew and vehicle you can check',
    'Median claim time published',
  ],
  quoteMode: 'home',
  quoteNote:
    'A coordinator calls you back and sends one fixed, written price after a short video survey. We use your number only for your quote and never sell your data.',
  sections: [
    {
      heading: '',
      blocks: [
        {
          kind: 'text',
          body: 'MrMoverPacker does home shifting on one fixed price, set after we see your goods on a video survey. The number on the written quote is the number you pay. Anything that could change it is listed before you book.\n\nOur own trained crews do the packing, carrying and reassembly. Every item is photographed and listed at pickup, and the inventory reaches you on WhatsApp before the truck leaves.\n\nOur [instant price check](/get-quote) gives you a working figure. To lock the price, [book a free video survey](/get-quote).',
        },
      ],
    },
    {
      heading: 'What home shifting services actually cover',
      blocks: [
        {
          kind: 'text',
          body: 'Our house shifting services cover three jobs: packing, carrying and reassembly. On our quotes, most of the cost sits in the carrying lines: vehicle, floor rise and long carry.\n\nThat is why our estimator asks for the floor and the lift at both ends. Two flats with the same contents can get very different quotes.\n\nWe will not fix a price over the phone. Our price comes after a survey. A number set without seeing your goods is the one that gets revised on moving day.',
        },
        {
          kind: 'table',
          columns: ['Job', 'What our crew does', 'What drives the cost'],
          rows: [
            [
              'Packing',
              'Wraps and boxes everything, crates fragile pieces, labels each carton by room',
              'Volume of goods, packing level, items that need crates',
            ],
            [
              'Carrying',
              'Loads, transports and unloads, with only your goods on the truck',
              'Floors and lifts at both ends, distance from truck to door, truck size, distance between homes',
            ],
            [
              'Reassembly',
              'Rebuilds beds, wardrobes, dining tables and modular units',
              'Number of pieces we dismantled',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'For other moves, see [all our moving services](/services), including [moving an office instead](/services/office-shifting) and [moving abroad](/services/international-relocation).',
        },
      ],
    },
    {
      heading: 'How your house shifting runs, from survey to reassembly',
      blocks: [
        {
          kind: 'steps',
          items: [
            {
              title: 'Book the survey',
              body: '[Book a free video survey](/get-quote), send us a video of your home on WhatsApp, or ask for an in-person visit.',
            },
            {
              title: 'Walk us through the home',
              body: 'The video survey takes about 10 minutes. Show us every room, the almirahs, the loft and the stairs at both ends. Our surveyor records four things: cartons for the kitchen, which wardrobes dismantle, pieces that need crates, and where the truck can park. Each one becomes a line on your quote.',
            },
            {
              title: 'Get one written price',
              body: 'You receive an itemised quote with GST on its own line and transit insurance as one optional line. The validity period is printed on your quote. A token advance confirms your slot, and the balance is due on completion.',
            },
            {
              title: 'Check your crew',
              body: "Your move coordinator shares the crew members' names and the vehicle number in advance. Match the IDs and the number plate at your door before anything is loaded.",
            },
            {
              title: 'Packing day',
              body: 'We usually pack the day before the vehicle arrives. Fragile items go first, and every carton is labelled by room. Moving day is then loading only, so the truck spends less time at your gate.',
            },
            {
              title: 'Inventory sign-off',
              body: 'Every item is photographed and listed. You and the crew lead sign the list, and a copy reaches you on WhatsApp before the truck leaves. Any claim is checked against this list.',
            },
            {
              title: 'Loading and the road',
              body: 'Your goods travel alone on a separate vehicle, never a shared load. Local moves can load by 8 PM and arrive the next morning. Intercity moves get a dated delivery window on your quote.',
            },
            {
              title: 'Delivery and reassembly',
              body: 'We unload into the rooms on the carton labels and rebuild your furniture before we leave. We tick off every item on the inventory with you before you sign.',
            },
          ],
        },
        {
          kind: 'text',
          body: 'For the weeks before the move, work through [the 8-week home shifting checklist](/blog/home-shifting-checklist-8-weeks). Our notes on [packing fragile items so they survive](/blog/packing-fragile-items-that-survive) cover glass, frames and screens.',
        },
      ],
    },
    {
      heading: 'What a household shifting quotation should list',
      blocks: [
        {
          kind: 'text',
          body: 'Every line below can appear on our quote. If a line is not on yours, you do not pay it on moving day.',
        },
        {
          kind: 'table',
          columns: ['Line on the quote', 'What it pays for', 'When it appears'],
          rows: [
            ['Packing materials', 'Cartons, wrap, foam and crates for your goods', 'Every quote'],
            ['Packing labour', 'Crew time to wrap and box', 'Every quote with packing'],
            [
              'Dismantling and reassembly',
              'Standard beds, wardrobes, tables, modular units',
              'When the survey finds them',
            ],
            ['Loading and unloading', 'Crew carrying at both ends', 'Every quote'],
            [
              'Vehicle',
              'A separate truck sized at the survey, carrying only your goods',
              'Every quote',
            ],
            [
              'Move coordinator',
              'One person who runs your move and answers your calls',
              'Every quote, included',
            ],
            [
              'Floor rise',
              'Carrying up or down stairs without a lift',
              'Only when there are stairs',
            ],
            [
              'Long carry',
              'Carrying from where the truck parks to your door',
              'Only when the truck parks more than 50 metres from your door',
            ],
            [
              'Special crating',
              'Crates for a piano, artwork or large appliances',
              'Only for listed items',
            ],
            ['Fixed-time delivery', 'An express or fixed delivery slot', 'Only if you ask for it'],
            ['Short-term storage', 'Storage between pickup and delivery', 'Only if you need it'],
            ['Tolls and permits', 'Road charges on intercity moves', 'Own line on intercity moves'],
            ['Basic liability cover', 'Our cover on every move', 'Every quote, included'],
            [
              'Transit insurance',
              'Optional cover up to the value you declare',
              'Only if you choose it',
            ],
            ['GST', 'Tax on the services above', 'Every quote, with a GST invoice'],
          ],
        },
        {
          kind: 'text',
          body: 'If you add items after the survey, we confirm the revised charge with you before doing that work. Before you compare quotes from anyone, read [what a fair moving quote includes](/blog/what-a-fair-moving-quote-includes).',
        },
      ],
    },
    {
      heading: 'What moves your home shifting charges',
      blocks: [
        {
          kind: 'text',
          body: 'Our [instant price check](/get-quote) is built from our rate card. These are its inputs, and why each one moves the figure.',
        },
        {
          kind: 'table',
          columns: ['Input', 'Your options', 'Why it changes the price'],
          rows: [
            [
              'Truck size',
              '10, 12, 14, 15, 16, 17 or 19 ft',
              'A bigger truck costs more to run. The survey confirms the size you need.',
            ],
            [
              'Packing level',
              'Basic: cartons and wrap. Standard: 3-layer wrap and crates',
              'More material and more crew time per item',
            ],
            [
              'Pickup floor',
              'Ground to 5th and above',
              'Each floor without a lift adds carrying time',
            ],
            ['Lift at pickup', 'Yes or no', 'A lift cuts most of the floor-rise cost'],
            ['Drop floor', 'Ground to 5th and above', 'Same as pickup'],
            ['Lift at drop', 'Yes or no', 'Same as pickup'],
            [
              'Pickup and drop locations',
              'From the form',
              'Distance sets fuel, driver time and tolls. Local and intercity are priced separately.',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'Your date matters too. The first and last few days of the month are the busiest. Your quote shows the difference, so you can pick a cheaper date.\n\nThe estimator cannot see:',
        },
        {
          kind: 'list',
          items: [
            'a wardrobe that will not come apart',
            'pieces that need crates',
            'how far the truck parks from your door',
            "your society's truck timings",
          ],
        },
        {
          kind: 'text',
          body: 'The survey catches all four. That is why the estimator is accurate to about ±6% and the survey quote is fixed.\n\nThe full method is on [how our fixed pricing works](/pricing).',
        },
      ],
    },
    {
      heading: "When the house shifting charges calculator is enough, and when it isn't",
      blocks: [
        {
          kind: 'table',
          columns: ['', 'Instant price check', 'Survey quote'],
          rows: [
            [
              'What it sees',
              'The truck, packing, floor and lift choices you enter',
              'Every room, every large piece, access at both ends',
            ],
            [
              'What it misses',
              'Dismantling, crating, long carry, truck access',
              'Only what you do not show us',
            ],
            ['Accuracy', 'About ±6%', 'Fixed'],
            ['Binding', 'No, it is a guide', 'Yes, it is the price you pay'],
            ['Use it for', 'Setting a budget', 'Booking'],
          ],
        },
        {
          kind: 'text',
          body: "If any of the four blind spots in the section above apply to your home, book a survey before you rely on the estimator's figure.",
        },
      ],
    },
    {
      heading: "What our household shifting services include, and what they don't",
      blocks: [
        {
          kind: 'text',
          body: 'Every quote includes packing and all materials, dismantling and refitting of standard furniture, loading and unloading by our trained crew, a separate vehicle, a move coordinator and a GST invoice.',
        },
        {
          kind: 'table',
          columns: ['Task', 'Who does it'],
          rows: [
            ['Packing every room, including the kitchen and almirahs', 'Our crew'],
            ['Documents, jewellery, cash, medicines, keys, chargers', 'You keep them with you'],
            ['Dismantling and refitting standard beds, wardrobes and tables', 'Our crew'],
            ['Defrosting and draining the fridge and washing machine the day before', 'You'],
            [
              'Uninstalling and refitting a split AC',
              'A technician, charged at actual cost as its own line on your quote. Gas charging and new piping: a specialist',
            ],
            ['Removing or fitting a geyser', 'A specialist'],
            ['Drilling and new fittings', 'A specialist'],
            ['Electrical points and wiring', 'A specialist'],
            ['Carpentry repairs or changes', 'A specialist'],
            ['Appliance servicing', 'A third party, charged extra'],
            ['Unpacking cartons', 'Our crew, when you add it to your quote'],
            ['Society gate pass and lift slot', 'Your move coordinator'],
          ],
        },
        {
          kind: 'text',
          body: 'We tell you at the survey which jobs need a specialist, so the scope is settled before you book.\n\nSpecialist trade work, third-party appliance servicing, special crating, fixed-time delivery and short-term storage cost extra. Each appears as its own line only if you need it.\n\nFor part of the job only, book [packing and unpacking on its own](/services/packing-unpacking), or [a crew for loading and unloading only](/services/loading-unloading). Vehicles go separately: see [moving your car with the household](/services/car-transport) and [sending your bike separately](/services/bike-transport).',
        },
      ],
    },
    {
      heading: 'Overnight home relocation for societies with truck curfews',
      blocks: [
        {
          kind: 'text',
          body: 'Local moves can run overnight. We load by 8 PM and deliver the next morning.\n\nThis suits societies that stop trucks or lift use during the day. Load-out happens after office hours, so you do not lose a working day.',
        },
        {
          kind: 'table',
          columns: ['Time', 'What happens'],
          rows: [
            ['By 8 PM', 'Loading finishes at your old home'],
            ['Overnight', 'The truck drives on empty roads'],
            [
              'Next morning',
              'We unload as soon as your new society opens its gate, then reassemble',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'An overnight move needs two permissions. One is an evening gate pass at the old society. The other is a morning lift and truck slot at the new one. Your move coordinator arranges both.\n\nIf your society does not allow evening loading, we plan a day move instead. Local truck timings are on each city page.',
        },
      ],
    },
    {
      heading: 'Cover, photos and claims on every house shifting job',
      blocks: [
        {
          kind: 'table',
          columns: ['Layer', 'What it is', 'What it costs you'],
          rows: [
            ['Basic liability cover', 'Our cover on every move', 'Included'],
            [
              'Transit insurance',
              'Optional cover up to the value you declare, from a licensed insurer named on your certificate',
              'One line on your quote, priced from your declared value',
            ],
            [
              'Photo inventory',
              'Every item photographed and listed at pickup, signed by you and the crew lead',
              'Included',
            ],
            [
              'Claims process',
              'Written steps, assessed against the pickup photos',
              'Free to raise',
            ],
          ],
        },
        {
          kind: 'text',
          body: 'How a claim works:',
        },
        {
          kind: 'list',
          items: [
            'Report damage within the claims window printed on your invoice, ideally at handover, with photos.',
            'We give a first response within 24 hours and compare your report with the pickup photos and the signed inventory.',
            'We agree repair, replacement or reimbursement, based on your declared value and any transit insurance you chose.',
          ],
        },
        {
          kind: 'text',
          body: 'We publish [our median claim settlement time](/claims) and update it each reporting period. Items you pack yourself without our inspection are not covered the same way. Read what [optional transit insurance](/insurance) covers and excludes, and ask for the certificate before loading day.',
        },
      ],
    },
    {
      heading: 'Home shifting crews you can verify before they load',
      blocks: [
        {
          kind: 'text',
          body: "Your goods are handled by our own trained crews. We do not pick up daily-wage labour for the day.\n\nEvery crew member and vehicle is ID-verified. Before loading starts, [check your crew's ID](/verify) and the vehicle number against what your coordinator sent you.",
        },
      ],
    },
  ],
  faqHeading: 'Home shifting questions people ask before booking',
  faqs: [
    {
      question: 'Is GST charged on home shifting?',
      answer:
        'Yes. GST is shown as its own line on your quote, and every move gets a GST invoice. Our GST details are on [our licences and GST page](/company/licences).',
    },
    {
      question: 'Will you pack everything in the house?',
      answer:
        'Yes. Every room is packed, photographed and listed, except what you keep with you: documents, jewellery, cash, medicines and keys. We do not carry hazardous or flammable materials, firearms, illegal items or perishables, and the full list is confirmed at survey. If you only need the packing done, book our [packing and unpacking service](/services/packing-unpacking).',
    },
    {
      question: 'Will the crew remove and refit my AC?',
      answer:
        'A technician removes and refits a split AC, charged at actual cost as its own line on your quote. Gas charging and new piping are specialist jobs, and we flag them at the survey.',
    },
    {
      question: 'Will I be charged octroi or entry tax?',
      answer:
        'No. Octroi was abolished when GST came in on 1 July 2017, so it should not appear on any moving quote. If you see it, use our [checks to run before you pay any mover](/fraud-check).',
    },
    {
      question: 'Can I pack myself and book only the crew?',
      answer:
        'Yes. [Book loading and unloading only](/services/loading-unloading) and our trained crew loads your vehicle. Items you pack yourself without our inspection are not covered the same way if you claim.',
    },
    {
      question: 'Are my goods insured during the move?',
      answer:
        'Partly. Every move carries basic liability cover. Full cover up to your declared value is [optional transit insurance](/insurance), priced as one line on your quote.',
    },
  ],
  citiesHeading: 'Home shifting from {count} North India cities',
  citiesIntro: 'We pick up from {count} cities and deliver anywhere in India.',
  ctaHeading: 'Get one fixed price for your home shifting',
  ctaText:
    'Send us a video on WhatsApp or book a video survey, and you get an itemised, written price. That price is what you pay.',
  related: [
    { label: 'Packing and unpacking services', href: '/services/packing-unpacking' },
    { label: 'Car transport services', href: '/services/car-transport' },
    { label: 'Office shifting services', href: '/services/office-shifting' },
  ],
  serviceType: 'Home shifting',
};
