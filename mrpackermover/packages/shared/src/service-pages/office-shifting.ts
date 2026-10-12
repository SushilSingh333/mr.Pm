import type { ServicePage } from './types.js';

/** Office shifting page, from the owner's brief "Office_Shifting_Page_FINAL" (6 October 2026). */
export const officeShifting: ServicePage = {
  title: 'Office Shifting Services | Weekend Moves | MrMoverPacker',
  metaDescription:
    'Office shifting services planned around your Monday login. Weekend moves, IT labelled to each seat, one fixed itemised quote. See every line first.',
  h1: 'Office Shifting Services with One Fixed, Written Price',
  subhead:
    'We plan your move around the hour your team logs back in. Our own crew packs, labels and reinstalls workstations, mostly over a weekend, on one itemised written quote.',
  trust: [
    'One written, itemised quote',
    'Crew names sent to your building in advance',
    'Workstations photographed before dismantling',
    'After-hours & weekend moves included',
  ],
  quoteMode: 'office',
  quoteNote:
    'Tell us your seats, both addresses and the weekend you want. A coordinator sends one fixed, written price after a survey of both floors.',
  sections: [
    {
      heading: '',
      blocks: [
        {
          kind: 'text',
          body: 'MrMoverPacker plans office shifting services backwards from Monday morning, when your team logs in. Desks, files and IT move while the building is empty, on one fixed, itemised price you approve first.\n\nTo fix the price, book a free video survey of both floors, the server room and the lift lobby, or an in-person survey.',
        },
      ],
    },
    {
      heading: 'What office shifting services should protect: your working hours',
      blocks: [
        {
          kind: 'text',
          body: 'Trucks are the cheap part of an office move. The expensive part is every seat that cannot log in on Monday, so price one lost morning first.',
        },
        {
          kind: 'table',
          columns: ['Step', 'What to enter', 'Where to find it'],
          rows: [
            ['A', 'Seats on the floors that are moving', 'Your headcount list'],
            [
              'B',
              'Cost of one seat for one working hour',
              'Monthly salary and overhead per seat, divided by working hours',
            ],
            ['C', 'Hours lost if the move runs into Monday', 'Count from your normal start time'],
            ['A × B × C', 'What one lost morning costs you', 'Set it beside your moving quote'],
          ],
        },
        {
          kind: 'text',
          body: "A cheaper quote that leaves desks unbuilt at your Monday start time costs more than it saved.\n\nIf your team's desks are going to another country, see [moving an office abroad](/services/international-relocation) or [all our moving services](/services).",
        },
      ],
    },
    {
      heading: 'How an office relocation runs over one weekend',
      blocks: [
        {
          kind: 'text',
          body: 'Desks usually move between Friday close and Sunday night, while the floor is empty. Larger floors split across two weekends so half your desks stay in use.',
        },
        {
          kind: 'table',
          columns: ['When', 'What happens'],
          rows: [
            [
              'Well before the move',
              'Building approvals filed at both sites. Seat map and floor plan agreed.',
            ],
            [
              'Friday, after close',
              'Workstations photographed, IT unplugged and packed, desks dismantled, cartons labelled to new seats.',
            ],
            [
              'Saturday',
              'Loading, transport in a separate vehicle with only your goods, unloading floor by floor to the seat map',
            ],
            [
              'Sunday',
              'Desks rebuilt, workstations reinstalled. Your IT vendor reconnects the network and servers. Department heads walk their space.',
            ],
            ['Monday morning', 'Your team logs in.'],
          ],
        },
        {
          kind: 'text',
          body: 'For an intercity move, we pack the desks in one of our pickup cities. The dated delivery window on your quote decides whether desks are rebuilt that weekend or the next.\n\nFor your side, from seat plans to IT cut-over, read [our guide to sequencing an office move](/blog/office-relocation-without-downtime).',
        },
      ],
    },
    {
      heading: 'Building approvals your office move needs, and who files them',
      blocks: [
        {
          kind: 'text',
          body: 'Commercial towers need notice for after-hours work. We file it well before the first desk moves.',
        },
        {
          kind: 'table',
          columns: ['Approval', 'Who files it'],
          rows: [
            [
              'After-hours access notice and service lift booking at both buildings, plus a loading bay or truck parking slot',
              'We file them with your admin team',
            ],
            ['Crew names and vehicle number, for building security', 'We send them'],
            ['Material outward pass, if the old building uses one', 'Your admin team signs it'],
          ],
        },
        {
          kind: 'text',
          body: "Get both buildings' after-hours rules in writing. The lift timings at each end decide which departments move on which night.",
        },
      ],
    },
    {
      heading: 'Office relocation services: what we do and what your IT vendor does',
      blocks: [
        {
          kind: 'text',
          body: 'Anything that could void a support contract or needs a network engineer stays with your IT vendor. We agree handover times with them before Friday.',
        },
        {
          kind: 'table',
          columns: ['Task', 'Who does it'],
          rows: [
            ['Packing desks, drawers, files and IT hardware', 'Our crew'],
            ['Dismantling and rebuilding desks and storage units', 'Our crew'],
            ['Reinstalling monitors, CPUs and peripherals on the right desk', 'Our crew'],
            [
              'Shutting down and decommissioning servers',
              'Your IT vendor. An optional add-on on our quote',
            ],
            [
              'Structured network cabling at the new site',
              'Coordinated with your IT vendor. An optional add-on on our quote',
            ],
            ['Equipment under a support contract', 'Your IT vendor, so the contract stays valid'],
            ['Network and login testing', 'Your IT vendor'],
            ['Final sign-off at the new office', 'One named person from your side'],
          ],
        },
        {
          kind: 'text',
          body: 'If your staff will carry and set up desks, book only [packing done by us, the rest by your staff](/services/packing-unpacking). If you have transport, book [a crew for loading and unloading only](/services/loading-unloading). Several offices or yearly department moves can run as [multi-site and repeat moves under one agreement](/corporate).',
        },
      ],
    },
    {
      heading: 'How office shifting packers and movers get every desk back to its seat',
      blocks: [
        {
          kind: 'text',
          body: 'Every carton, desk part and IT unit carries the code of its seat, cabin or store room. The crew unloads to the seat map, floor by floor.',
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Seat map',
              body: 'Your admin team marks seats on the new floor plan. Every seat, cabin and store room gets a code by team and floor.',
            },
            {
              title: 'Photos',
              body: 'Each workstation is photographed before it comes apart, so cables, monitor arms and drawers go back the same way.',
            },
            {
              title: 'Files',
              body: 'Files are packed in sequence, never tipped loose into boxes, so a cabinet unpacks in the order it was filled.',
            },
            {
              title: 'Inventory',
              body: 'Every carton goes on a labelled inventory, so your admin team can audit by department. The photo inventory is shared on WhatsApp before anything leaves.',
            },
            {
              title: 'Department sign-off',
              body: 'Each department head checks their own seats before our crew leaves. A missing monitor cable gets fixed then, not on Monday.',
            },
          ],
        },
      ],
    },
    {
      heading: 'What moves your office shifting charges',
      blocks: [
        {
          kind: 'text',
          body: 'The survey counts seats, not rooms. [How our fixed pricing works](/pricing) explains the rest.',
        },
        {
          kind: 'table',
          columns: ['Input', 'Why it moves the price'],
          rows: [
            ['Seats and workstations', 'Each is photographed, dismantled, moved and rebuilt'],
            [
              'IT units: monitors, CPUs, printers',
              'Each is packed and labelled alone. Monitors go upright in a rigid carton with foam corners',
            ],
            ['Files and records', 'Packing in sequence takes more cartons and time'],
            ['Furniture that must come apart', 'Crew time at both ends'],
            [
              'Floors and service lift at each building',
              'Lift slots and stairs set the loading time',
            ],
            ['Distance and truck size', 'Local and intercity moves are priced separately'],
            ['Packing level', 'Basic cartons and wrap, or 3-layer wrap with crates'],
          ],
        },
        {
          kind: 'text',
          body: 'Before the survey, settle three things.',
        },
        {
          kind: 'list',
          items: [
            'What is not moving. Leftover workstations and cabinets from past teams are the easiest saving.',
            "Who signs off. One named person needs the authority to move a team's seats on the night.",
            'The floor plan. With seats marked, the quote covers the whole weekend.',
          ],
        },
      ],
    },
    {
      heading: 'What your office shifting quotation will list',
      blocks: [
        {
          kind: 'text',
          body: 'Anything that could change your price, such as floor rise, long carry or extra packing, is itemised up front and never added on delivery day.',
        },
        { kind: 'scope' },
        {
          kind: 'text',
          body: "One move coordinator owns the plan from survey to department sign-off. A token advance books the weekend, and the balance is due after final sign-off.\n\nIf seats or departments are added after the survey, we confirm the revised charge first. To check another mover's quote, read [what a fair moving quote includes](/blog/what-a-fair-moving-quote-includes).",
        },
      ],
    },
    {
      heading: 'Crews, cover and claims on your office move',
      blocks: [
        {
          kind: 'text',
          body: "Every crew member and vehicle is ID-verified, and building security gets the names before Friday. [Check each crew member's ID](/verify) at the door before a desk is unplugged.\n\n[Optional transit cover](/insurance) is one clear line on your quote. Without it, the most we pay for a damaged laptop or monitor is our basic liability limit, which is not insurance. Use your fixed asset register for the declared value.\n\nDamage is rare, and when it happens we settle. Our median settlement time is on the [claims page](/claims). Report damage within the claims window on your invoice, and we check it against the pre-move photo and carton inventory.",
        },
      ],
    },
  ],
  faqHeading: 'Office shifting questions facilities teams ask',
  faqs: [
    {
      question: 'How long does it take to move an office?',
      answer:
        "Most office moves fit between Friday close and Monday's first login, with larger floors split across two weekends.",
    },
    {
      question: 'How much does office moving cost?',
      answer:
        'Seat count, IT units, files, floors and distance set the price, so we do not publish a range. Our [instant price check](/get-quote) does not count seats, so use it as a budget. The survey fixes the price: see [how our fixed pricing works](/pricing).',
    },
    {
      question: 'How far in advance should we book an office move?',
      answer:
        'A week ahead is comfortable, and earlier for month-start and month-end dates, which fill first. Book once the seat plan is final, so building approvals go in early.',
    },
    {
      question: 'Do you charge extra for weekend or night work?',
      answer:
        'No. After-hours and weekend moves are included in every office quote, since that is when the desks are free.',
    },
    {
      question: 'Do you move servers?',
      answer:
        'Your IT vendor decommissions servers, listed on our quote only as an optional add-on. Anything under a support contract stays with them too.',
    },
    {
      question: 'What will the GST invoice show?',
      answer:
        'Your finance team gets one GST invoice matching the quote you approved, with GST as its own line. Our GST details are on [our licences and GST page](/company/licences).',
    },
    {
      question: 'Can you move staff who relocate with the office?',
      answer:
        "Yes. Each home is surveyed and quoted on its own: see [shifting a staff member's home](/services/home-shifting).",
    },
  ],
  citiesHeading: 'Office shifting from {count} cities',
  citiesIntro: 'Office shifting in Delhi NCR and Meerut.',
  ctaHeading: 'Get one fixed price for your office shifting',
  ctaText:
    'Send us your floor plan, seat count and target date. You get one itemised, written price covering every seat and the whole weekend.',
  related: [
    { label: 'Corporate relocation', href: '/corporate' },
    { label: 'Packing and unpacking services', href: '/services/packing-unpacking' },
    { label: 'Loading and unloading services', href: '/services/loading-unloading' },
  ],
  serviceType: 'Office shifting',
};
