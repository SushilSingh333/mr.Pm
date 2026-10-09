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
          body: 'MrMoverPacker plans office shifting services backwards from Monday morning, the moment your team needs to log in. Desks, files and IT move while the building is empty, on one fixed, itemised price you approve before we start.\n\nEvery carton is labelled to a seat, a cabin or a store room. Workstations are reinstalled at the new site. Server decommissioning, structured cabling and anything under a support contract stay with your IT vendor. We plan the IT handover with them.\n\nTo fix the price, book a free video survey of both floors, the server room and the lift lobby, or ask for an in-person survey.',
        },
      ],
    },
    {
      heading: 'What office shifting services should protect: your working hours',
      blocks: [
        {
          kind: 'text',
          body: 'On an office move, the trucks are the cheap part; the expensive part is every seat that cannot log in on Monday. Price one lost Monday morning in seats and salary before you compare quotes.',
        },
        {
          kind: 'table',
          columns: ['Step', 'What to enter', 'Where to find it'],
          rows: [
            ['A', 'Seats on the floors that are moving', 'Your headcount list'],
            [
              'B',
              'Cost of one seat for one working hour',
              'Monthly salary and overhead per seat, divided by working hours in the month',
            ],
            ['C', 'Hours lost if the move runs into Monday', 'Count from your normal start time'],
            [
              'A × B × C',
              'What one lost morning costs you',
              'Set it beside the total on your moving quote',
            ],
          ],
        },
        {
          kind: 'text',
          body: "That figure is why we move desks after Friday close and split larger floors across two weekends. A cheaper quote that leaves desks unbuilt at your Monday start time costs more than it saved.\n\nIf your team's desks are going to another country, see [moving an office abroad](/services/international-relocation) or [all our moving services](/services).",
        },
      ],
    },
    {
      heading: 'How an office relocation runs over one weekend',
      blocks: [
        {
          kind: 'text',
          body: 'Desks usually move between Friday close and Sunday night, while the floor is empty. On larger floors, we split the move across two weekends so half your desks stay in use.',
        },
        {
          kind: 'table',
          columns: ['When', 'What happens'],
          rows: [
            [
              'Well before the move',
              'Building approvals filed at both sites. Seat map and floor plan agreed. Crew names sent to building security.',
            ],
            [
              'Friday, after close',
              'Each workstation photographed. IT hardware unplugged and packed. Desks dismantled. Every carton labelled to its new seat.',
            ],
            [
              'Saturday',
              'Loading, transport in a separate vehicle carrying only your goods, and unloading floor by floor to the seat map',
            ],
            [
              'Sunday',
              'Desks rebuilt and workstations reinstalled. Your IT vendor reconnects the network and servers. Department heads walk their own space.',
            ],
            ['Monday morning', 'Your team logs in.'],
          ],
        },
        {
          kind: 'text',
          body: 'For an intercity move, we pack the desks in one of our pickup cities. Your quote gives a dated delivery window, and that decides whether desks are rebuilt that weekend or the next.\n\nFor the planning on your side, from seat plans to IT cut-over, read [our guide to sequencing an office move](/blog/office-relocation-without-downtime).',
        },
      ],
    },
    {
      heading: 'Building approvals your office move needs, and who files them',
      blocks: [
        {
          kind: 'text',
          body: 'Commercial towers usually need notice for after-hours access, a service lift booking and our crew names, so we file that paperwork well before the first desk moves.',
        },
        {
          kind: 'table',
          columns: ['Approval', 'Who files it'],
          rows: [
            ['After-hours access notice, at both buildings', 'We file it with your admin team'],
            ['Service lift booking, at both buildings', 'We file it with your admin team'],
            ['Crew name list and vehicle number, for building security', 'We send it'],
            ['Loading bay or truck parking slot', 'We file it with your admin team'],
            ['Material outward pass, if the old building uses one', 'Your admin team signs it'],
          ],
        },
        {
          kind: 'text',
          body: "Get both buildings' after-hours rules in writing, because the lift timings at each end decide which departments move on which night.",
        },
      ],
    },
    {
      heading: 'Office relocation services: what we do and what your IT vendor does',
      blocks: [
        {
          kind: 'text',
          body: 'Our crew handles desks, files and hardware. Anything that could void a support contract or needs a network engineer stays with your IT vendor. We agree IT handover times with them before Friday.',
        },
        {
          kind: 'table',
          columns: ['Task', 'Who does it'],
          rows: [
            ['Packing desks, drawers, files and IT hardware', 'Our crew'],
            ['Photographing each workstation before dismantling', 'Our crew'],
            ['Dismantling and rebuilding desks and storage units', 'Our crew'],
            [
              'Reinstalling workstations: monitors, CPUs and peripherals back on the right desk',
              'Our crew',
            ],
            [
              'Shutting down and decommissioning servers',
              'Your IT vendor. Listed on our quote as an optional add-on',
            ],
            [
              'Structured network cabling at the new site',
              'Coordinated with your IT vendor. Listed on our quote as an optional add-on',
            ],
            ['Equipment under a support contract', 'Your IT vendor, so the contract stays valid'],
            ['Network and login testing', 'Your IT vendor'],
            ['Seat map, floor plan, list of furniture that is not moving', 'Your admin team'],
            ['Final sign-off at the new office', 'One named person from your side'],
          ],
        },
        {
          kind: 'text',
          body: 'If your own staff will carry and set up desks, book only [packing done by us, the rest by your staff](/services/packing-unpacking). If you have your own transport and only need hands for desks and cartons, book [a crew for loading and unloading only](/services/loading-unloading). If you run several offices or move departments every year, [multi-site and repeat moves under one agreement](/corporate) puts them under one MSA.',
        },
      ],
    },
    {
      heading: 'How office shifting packers and movers get every desk back to its seat',
      blocks: [
        {
          kind: 'text',
          body: 'Every carton carries a label that maps to a destination: a seat number, a cabin or a store room. The crew unloads to the seat map, floor by floor.',
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Seat map',
              body: 'Your admin team gives us the new floor plan with seats marked. Every seat, cabin and store room gets a code, labelled by team and floor.',
            },
            {
              title: 'Labels',
              body: 'Every carton, desk part and IT unit gets the code of the seat it is going to.',
            },
            {
              title: 'Photos',
              body: 'Each workstation is photographed before it comes apart, so cables, monitor arms and drawers go back the same way.',
            },
            {
              title: 'Files',
              body: 'Files are packed in sequence, never tipped loose into boxes. A cabinet unpacks in the order it was filled.',
            },
            {
              title: 'Inventory',
              body: 'Every carton goes on a labelled inventory, so your admin team can audit by department on arrival. The photo inventory is shared on WhatsApp before anything leaves.',
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
          body: 'The survey counts seats, not rooms; [how our fixed pricing works](/pricing) explains the rest of the method.',
        },
        {
          kind: 'table',
          columns: ['Input', 'Why it moves the price'],
          rows: [
            ['Seats and workstations', 'Each one is photographed, dismantled, moved and rebuilt'],
            [
              'IT units: monitors, CPUs, printers',
              'Each is packed and labelled on its own. Monitors get foam corners and a rigid carton, and stay upright',
            ],
            ['Files and records', 'Packing in sequence takes more cartons and more time'],
            ['Furniture that must come apart', 'Crew time at both ends'],
            [
              'Floors and service lift at each building',
              'Lift slots and stairs set how long loading takes',
            ],
            ['Distance and truck size', 'Local and intercity moves are priced separately'],
            ['Packing level', 'Basic cartons and wrap, or 3-layer wrap with crates'],
          ],
        },
        {
          kind: 'text',
          body: 'Before the survey, settle three things about your seats and furniture.',
        },
        {
          kind: 'list',
          items: [
            'What is not moving. Workstations and cabinets left over from past teams are the easiest money to save: leave them off the move.',
            "Who signs off at the new office. One named person needs the authority to move a team's seats on the night.",
            'The floor plan. With seats marked, the quote covers the whole weekend rather than the parts we could see from a call.',
          ],
        },
      ],
    },
    {
      heading: 'What your office shifting quotation will list',
      blocks: [
        {
          kind: 'text',
          body: 'Tell us what you are moving and where it is going. You get one price for the whole job, itemised and in writing, with nothing added on moving day.\n\nThe written quote is the price you pay. Anything that could change it, floor rise, long carry, extra packing, is itemised up front, never sprung on you on delivery day.',
        },
        { kind: 'scope' },
        {
          kind: 'text',
          body: "One move coordinator owns the plan from survey to department sign-off.\n\nA token advance books the weekend, and the balance is due on completion, after the last department signs off. If seats or departments are added after the survey, we confirm the revised charge before doing the work. To check another mover's quote for the same desks and IT, read [what a fair moving quote includes](/blog/what-a-fair-moving-quote-includes).",
        },
      ],
    },
    {
      heading: 'Crews, cover and claims on your office move',
      blocks: [
        {
          kind: 'text',
          body: "Every crew and vehicle is ID-verified. Check who's coming, and in what vehicle, before they load. Building security gets the same names before Friday, so check each crew member's ID at the door before a single desk is unplugged.\n\nOptional transit cover, shown as a clear line item on your quote, never buried in the fine print. Without it, the most we pay for a damaged laptop or monitor is our basic liability limit. That limit is not insurance, so check it against the value of your IT hardware.\n\nYour fixed asset register should already list the laptops, monitors and furniture with their values, so use it for the declared value.\n\nDamage is rare, but when it happens we settle. And we publish our median settlement time on the [claims page](/claims). If a monitor or desk is damaged, report it within the claims window printed on your invoice. We check it against that workstation's pre-move photo and the carton inventory.",
        },
      ],
    },
  ],
  faqHeading: 'Office shifting questions facilities teams ask',
  faqs: [
    {
      question: 'How long does it take to move an office?',
      answer:
        "Most office moves fit between Friday close and Monday's first login. Larger floors are split across two weekends, so half your desks stay in use. [Our guide to sequencing an office move](/blog/office-relocation-without-downtime) covers seat plans and IT cut-over on your side.",
    },
    {
      question: 'How much does office moving cost?',
      answer:
        'We do not publish a range, because the price is set by seat count, IT units, files, floors and distance. Our [instant price check](/get-quote) does not count seats, so treat its figure as a budget. The survey of your floors and seats fixes the price in writing: see [how our fixed pricing works](/pricing).',
    },
    {
      question: 'How far in advance should we book an office move?',
      answer:
        'A week ahead is comfortable, and earlier for the first and last few days of the month, as those dates fill first. Book once the new seat plan is final, so building approvals at both ends can go in well before the move.',
    },
    {
      question: 'Do you charge extra for weekend or night work?',
      answer:
        'No. After-hours and weekend moves are included in every office quote, since that is when the desks are free.',
    },
    {
      question: 'Do you move servers?',
      answer:
        'Server decommissioning is done by your IT vendor and appears on our quote only as an optional add-on. Anything under a support contract stays with them too.',
    },
    {
      question: 'What will the GST invoice show?',
      answer:
        'Your finance team gets one GST invoice that matches the quote you approved, with GST as its own line. Our GST details are on [our licences and GST page](/company/licences).',
    },
    {
      question: 'Can we sign one agreement for repeat office moves?',
      answer:
        'Yes. Several offices or yearly department moves can run under one master service agreement: see [corporate relocation](/corporate).',
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
