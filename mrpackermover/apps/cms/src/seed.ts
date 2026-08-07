/**
 * Comprehensive seed data — the demo dataset the public site is built from.
 *
 * Data-driven: one `CITIES` table drives cities, localities, rate cards, jobs stats
 * and reviews, so the CMS content and the site never drift. Every city carries a
 * 400+ word local write-up (the publish-gate minimum), a city rate card, jobs stats
 * and 10+ verified reviews, so each one clears the gate and produces a real hub —
 * this is demonstrably NOT a doorway farm. Also seeds all services, a lane, a guide,
 * careers, FAQs, the org profile + home content globals, the editorial pages, and a
 * default admin login. Run: `pnpm seed` (wipes + repopulates via a fresh DB).
 */
import { getPayload } from 'payload';
import config from './payload.config.js';
import { SERVICES } from '@mpm/shared';
import { SERVICE_SCOPE } from './data/service-scope.js';

/** Minimal Lexical rich-text from paragraphs of plain text. */
function lex(paragraphs: string[]): unknown {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  };
}

interface LocalitySeed {
  name: string;
  slug: string;
  lat: number;
  lng: number;
  note: string[];
}
interface CitySeed {
  name: string;
  slug: string;
  lat: number;
  lng: number;
  tier: string;
  jobs: number;
  onTime: number;
  settle: number;
  note: string[];
  localities: LocalitySeed[];
}

/** Every city has a 400+ word, genuinely-local write-up (the gate minimum). */
const CITIES: CitySeed[] = [
  {
    name: 'Delhi',
    slug: 'delhi',
    lat: 28.6139,
    lng: 77.209,
    tier: 'A',
    jobs: 56,
    onTime: 96,
    settle: 11,
    note: [
      'Delhi is four distinct moving markets, not one. South Delhi (Saket, GK, Vasant Kunj) is largely low-rise plotted housing and DDA flats where the constraint is narrow lanes and no service lift; most jobs are 2BHK and 3BHK with a lot of packed glassware and wardrobes.',
      'West and North-West Delhi (Rohini, Pitampura, Dwarka) is a sector-and-pocket grid of mid-rise societies. Rohini sectors and Dwarka sub-cities have their own RWA gate-pass rules and fixed no-entry hours for commercial vehicles on the approach roads, so an early load-out matters.',
      'East Delhi across the Yamuna (Mayur Vihar, Patparganj) mixes DDA pockets and newer group-housing towers with service-lift booking arranged a day ahead. Central and Lutyens stock is older, with stair-only access common above the second floor.',
      'The single biggest price driver across Delhi is vertical access. Where a working service lift exists a 2BHK loads in three to four hours; where the crew is carrying down three or four floors of a South Delhi builder floor, the same job takes half a day longer and two extra hands. We measure this at survey, not on the day.',
      'Timing is the second driver. Many societies bar commercial vehicles between roughly 9 and 11 AM and again in the evening, and RWAs insist on a written gate pass a day ahead. Our coordinator books the pass, confirms the lift slot, and schedules the load-out for first light so the truck clears the colony before the no-entry window.',
      'Delhi weather shapes packing too: summer heat and winter damp punish poorly wrapped wood and electronics, so we crate flat-screens, foam-wrap polished surfaces and keep a moisture barrier on upholstery. None of it is an upsell — it is itemised on the quote and you can decline any line.',
      'The upshot for a Delhi move is that the survey matters more here than almost anywhere: the difference between a lift and a stair-carry, a 40-metre and an 80-metre lift-to-tempo distance, and a clear versus a peak-hour window can each swing a job by half a day. A named Delhi coordinator confirms every one of those before we commit to the fixed quote, assigns a crew briefed on your zone’s RWA norms, and stays reachable on the number printed on your gate pass the day the truck rolls.',
    ],
    localities: [
      {
        name: 'Rohini',
        slug: 'rohini',
        lat: 28.7365,
        lng: 77.1174,
        note: [
          'Rohini is a planned sector grid of mostly 4-to-8 storey DDA and society flats, with a smaller set of newer builder floors. Sectors 3, 7, 11, 13 and 24 carry most of the organised demand and the average job is a 2BHK.',
          'Service lifts are rare here, so first-and-second-floor stair-carry is the norm and the single biggest price driver. Several societies enforce a gate pass and a no-entry window for tempos until mid-morning, which is why we prefer an early load-out.',
        ],
      },
      {
        name: 'Dwarka',
        slug: 'dwarka',
        lat: 28.5921,
        lng: 77.046,
        note: [
          'Dwarka is a grid of co-operative group-housing societies across its sub-cities, most with a working service lift and a security gate that logs every vehicle. Sectors 6, 10, 12 and 22 see the most family moves.',
          'The constraints here are the lift-slot booking and the gate pass, both arranged a day ahead. Parking is usually inside the society but a short carry from the block, which we confirm for your tower before quoting.',
        ],
      },
    ],
  },
  {
    name: 'Gurgaon',
    slug: 'gurgaon',
    lat: 28.4595,
    lng: 77.0266,
    tier: 'A-S',
    jobs: 41,
    onTime: 95,
    settle: 12,
    note: [
      'Gurgaon splits cleanly into the DLF phases and Golf Course Road high-rises, the newer Sohna Road and New Gurgaon (sectors 80 to 95) group housing, and the older sectors nearer the city. The high-rise belt is the highest-ticket work in NCR.',
      'The binding constraint is the service lift: most Golf Course Road and Golf Course Extension towers require a lift-booking slot and a security deposit, and many restrict move-in and move-out to specific hours. Udyog Vihar and the corporate parks add dock and gate-pass procedures for office relocations.',
      'We price the lift wait and the gate formalities explicitly rather than discovering them on the day. The coordinator holds the society approvals and the lift slot before the crew is dispatched, and confirms whether the tower allows a tempo at the podium or only at a distant service gate.',
      'New Gurgaon and Sohna Road townships are newer and generally smoother — wider approach roads, better lifts — but their societies still gate-log vehicles and cap move hours, so an early slot is worth booking. The older sectors near the city are a mix of builder floors and independent houses where stair-carry and narrow lanes drive the price.',
      'Because so much of Gurgaon is glass-and-steel high-rise, we carry extra protection for lifts and lobbies: corner guards, floor sheeting and lift-blankets, which some societies require before they release the lift. That protection is on the quote as a line, not a surprise.',
      'Intercity demand out of Gurgaon is heavy toward Bengaluru, Pune and Mumbai for IT relocations; we run those as fixed-quote lanes with the permit paperwork handled end to end so nothing stalls at a state border.',
      'Because the Gurgaon high-rise belt is corporate-heavy, weekday morning slots fill fast and weekend moves need booking well ahead; we hold your slot the moment the survey is signed. And since so many towers here charge a refundable lift deposit against damage, our crews carry the lobby and lift protection those societies ask for as standard, so the deposit comes back to you and the fixed quote holds even when the building committee is at its strictest.',
    ],
    localities: [
      {
        name: 'DLF Phase 1',
        slug: 'dlf-phase-1',
        lat: 28.4736,
        lng: 77.0996,
        note: [
          'DLF Phase 1 mixes independent builder floors with a few condominium towers. The builder floors are typically stair-carry to the second or third floor, which is the main price driver, while the towers have a bookable service lift.',
          'Approach lanes are narrow in parts and parking is often a short carry from the entrance, so we confirm tempo access and the lift slot for your specific block before quoting.',
        ],
      },
      {
        name: 'Sohna Road',
        slug: 'sohna-road',
        lat: 28.4211,
        lng: 77.0384,
        note: [
          'Sohna Road is newer group-housing territory — mid and high-rise societies with working service lifts and gate-logged entry. Most jobs here are 2BHK and 3BHK family moves.',
          'The constraint is the lift-slot booking and the society move-hour window; our coordinator holds both a day ahead so the crew is not left waiting on the day.',
        ],
      },
    ],
  },
  {
    name: 'Noida',
    slug: 'noida',
    lat: 28.5355,
    lng: 77.391,
    tier: 'A',
    jobs: 33,
    onTime: 96,
    settle: 10,
    note: [
      "Noida's sector grid maps almost exactly to how people search. The high-rise clusters in the 70s, 100s and 120s sectors are the bulk of organised demand, alongside the older independent-house sectors nearer the city and the fast-growing Noida Extension (Greater Noida West) belt.",
      'Most Noida societies require a gate pass and a service-lift slot booked a day ahead, and many run a strict no-move window during peak hours. Our coordinator holds both the gate pass and the lift slot before the crew is dispatched, so the truck is not turned away at the boom barrier.',
      'The high-rise towers in sectors 74 to 79 and 100 to 121 have working lifts, so a 2BHK loads quickly; the constraint is lobby and lift protection, which several societies require before releasing the lift. We carry corner guards, floor sheeting and lift-blankets as standard and show them as a line on the quote.',
      'Noida Extension is newer and cheaper to move within, but its approach roads and under-construction stretches can slow a tempo, and a few societies there still lack a fully commissioned service lift — we confirm which applies to your tower at survey.',
      'The older sectors — 15A, 27, 44 and similar — are independent houses and low-rise builder units where stair-carry and gate parking drive the price rather than lift slots. Long-carry from the gate to the door is common and we measure it up front.',
      'A large share of Noida demand is intercity, out toward Bengaluru, Pune and Hyderabad for IT moves; those run as fixed-quote overnight lanes with inter-state permits handled end to end.',
      'One Noida-specific point: the metro-corridor sectors and the Expressway carry periodic vehicle restrictions and diversions, so we plan the tempo route as carefully as the load-out and keep the coordinator’s number on the gate pass so society security can reach us directly. For office moves in the 60s sectors we work around your no-entry and lift-sharing windows so the workday is barely interrupted, and we confirm the loading dock and freight-lift booking with the building manager the day before.',
    ],
    localities: [
      {
        name: 'Sector 62',
        slug: 'sector-62',
        lat: 28.6274,
        lng: 77.365,
        note: [
          'Sector 62 is a mix of IT offices and mid-rise residential society blocks, so office relocations and 2BHK family moves both feature. The residential towers have bookable service lifts; the office blocks need a dock slot and a gate pass.',
          'The main constraint is coordinating the lift and gate timings with the society or building manager, which our coordinator arranges a day ahead.',
        ],
      },
      {
        name: 'Noida Extension',
        slug: 'noida-extension',
        lat: 28.5708,
        lng: 77.4497,
        note: [
          'Noida Extension (Greater Noida West) is newer high-rise group housing, generally cheaper to move within, with working service lifts in most commissioned towers. Jobs skew 2BHK and 3BHK.',
          'Under-construction approach stretches can slow a tempo and a few towers are not fully commissioned, so we confirm lift availability and vehicle access for your block before quoting.',
        ],
      },
    ],
  },
  {
    name: 'Mumbai',
    slug: 'mumbai',
    lat: 19.076,
    lng: 72.8777,
    tier: 'A',
    jobs: 62,
    onTime: 93,
    settle: 12,
    note: [
      'Mumbai has the highest volume and the toughest access conditions in the country, and both the stairs and the lift wait are the real cost drivers — so we price them explicitly rather than discovering them on the day.',
      'The island city — Colaba, Worli, Dadar, Parel — is old, dense building stock where many buildings have no service lift or only a small passenger lift, which means stair-carry and long waits. Society and building-committee permissions are strict and often need a written no-objection before the move.',
      'The western suburbs — Bandra, Andheri, Goregaon, Malad — range from old low-rise to new towers. The new towers have service lifts but cap move hours and require a lift-booking deposit; the older buildings are stair-carry with narrow internal staircases that slow large furniture.',
      'The central suburbs and Navi Mumbai — Chembur, Ghatkopar, Powai, Vashi — are generally newer and smoother, with working service lifts and gate-logged entry, so a 2BHK loads faster there than anywhere in the island city.',
      'Monsoon is a genuine planning factor for four months of the year: we schedule around high tide and heavy-rain windows, double-wrap against moisture, and keep a contingency slot because a flooded approach road can move a job by a day. That risk is explained up front, not billed after.',
      'Parking and the municipal move-permit are the other Mumbai specifics: many buildings only allow a tempo at a distant service entrance, so long-carry is common and we measure it at survey. On intercity moves we handle the octroi-successor and inter-state permit paperwork end to end.',
      'The practical Mumbai rule is that time, not distance, sets the cost: a three-kilometre move across the island city with a stair-carry and a tide-timed window can cost more than a suburb-to-suburb run with a working lift. We price that reality honestly, plan the load-out around the building committee’s permitted hours, and keep a monsoon-season contingency slot so a wet day never quietly becomes a billed surprise on delivery.',
    ],
    localities: [
      {
        name: 'Andheri',
        slug: 'andheri',
        lat: 19.1197,
        lng: 72.8468,
        note: [
          'Andheri spans old low-rise buildings and new towers on both the east and west sides. The towers have bookable service lifts with capped move hours; the older buildings are stair-carry with narrow staircases that slow large furniture.',
          'Traffic and parking are the practical constraints — a tempo is often only allowed at a distant entrance, so we measure the long-carry and the lift slot at survey.',
        ],
      },
      {
        name: 'Powai',
        slug: 'powai',
        lat: 19.1176,
        lng: 72.906,
        note: [
          'Powai is newer high-rise and gated-community territory around the lake, with working service lifts and strict gate-logged entry. Most jobs are 2BHK and 3BHK family moves.',
          'The constraint is the lift-booking slot and deposit and the society move-hour window, which our coordinator confirms before the crew is dispatched.',
        ],
      },
    ],
  },
  {
    name: 'Bengaluru',
    slug: 'bengaluru',
    lat: 12.9716,
    lng: 77.5946,
    tier: 'A',
    jobs: 48,
    onTime: 95,
    settle: 11,
    note: [
      'Bengaluru is the largest addressable market after NCR, driven almost entirely by the IT corridors. Whitefield, Sarjapur Road, the Outer Ring Road belt and Electronic City see the most organised relocation, and the calendar is spiky — appraisal-season and lease-cycle months are far busier than the rest.',
      'Apartment complexes here are strict on move timings and gate passes: most require a booking with the association a day or two ahead, a security deposit against lift and lobby damage, and a fixed move-out window. We plan the load-out around each society’s rules and hold the approvals before dispatch.',
      'The service lift is the price driver in the tower belt — where it works, a 2BHK loads quickly; where a complex only has a passenger lift or a broken service lift, stair-carry adds hours and hands. We confirm which applies to your block at survey, along with the exact tempo-parking point, which is often a short carry from the lobby.',
      'Older Bengaluru — Jayanagar, Malleshwaram, Basavanagudi — is independent houses and low-rise builder units where narrow lanes, tree cover and stair-carry drive cost rather than lift slots. Long, established localities also mean tighter approach roads for a full tempo.',
      'Bengaluru rain is a real but manageable factor: sharp evening showers for much of the year mean we keep moisture wrapping on wood and electronics and a covered-loading plan so nothing sits exposed at the lift lobby.',
      'A large share of demand is intercity — Bengaluru to Hyderabad, Chennai, Pune and Mumbai — which we run as fixed-quote lanes with inter-state permits and the destination-society approvals handled end to end so the move does not stall at either end.',
      'Two Bengaluru specifics we plan for: the ORR and tech-park traffic, which makes an early or late-evening load-out far faster than a midday one, and the appraisal-season rush, when association move-slots are booked out days ahead. We reserve your slot at survey and route the tempo to avoid the worst corridors, so the crew is loading rather than idling — and we confirm the association’s deposit and protection rules before the day so nothing is renegotiated at the gate.',
    ],
    localities: [
      {
        name: 'Whitefield',
        slug: 'whitefield',
        lat: 12.9698,
        lng: 77.7499,
        note: [
          'Whitefield is dense apartment and gated-community territory serving the ITPL and EPIP tech parks. Most complexes have working service lifts but strict association booking, a damage deposit and a fixed move-out window.',
          'The practical constraints are the lift slot and the internal-road access for a full tempo, both of which our coordinator confirms with the association before the crew is dispatched.',
        ],
      },
      {
        name: 'HSR Layout',
        slug: 'hsr-layout',
        lat: 12.9116,
        lng: 77.6473,
        note: [
          'HSR Layout mixes independent houses and mid-rise apartments across its sectors, popular with startups and young families. The apartments have bookable lifts; the independent houses are stair-carry with gate parking.',
          'We confirm whether your block is lift or stair access and the tempo-parking point at survey, since both drive the price here.',
        ],
      },
    ],
  },
  {
    name: 'Pune',
    slug: 'pune',
    lat: 18.5204,
    lng: 73.8567,
    tier: 'A',
    jobs: 37,
    onTime: 96,
    settle: 10,
    note: [
      'Pune is really two markets priced separately: the IT belt of Hinjewadi, Wakad, Baner and Kharadi, and old Pune inside the city. The IT belt drives most intercity and local demand and runs on the same appraisal-and-lease calendar as Bengaluru.',
      'The IT-belt townships are newer, with well-run service lifts, gate-logged entry and a booked move-out window — smooth to move within, provided the lift slot and society approval are held a day ahead, which our coordinator arranges.',
      'Old Pune — Sadashiv Peth, Kothrud, Deccan — is a different job entirely: independent houses and older low-rise buildings where narrow lanes, tree cover and stair-carry are the price drivers, and a full tempo often cannot reach the door, so long-carry is measured at survey.',
      'The service lift, where it exists, decides how fast a 2BHK loads; where a building has only a passenger lift or none, we plan for stair-carry and add hands rather than surprising you with a floor-rise charge on the day.',
      'Pune’s monsoon is heavy for a stretch of the year, so we keep moisture wrapping on wood and electronics and a covered-loading plan, and we keep a contingency slot because a flooded approach in the low-lying pockets can push a job by a day.',
      'A large share of Pune demand is intercity — to Bengaluru, Hyderabad, Mumbai and the NCR — which we run as fixed-quote overnight lanes with inter-state permits and destination approvals handled end to end.',
      'The Pune split between the IT townships and the old city means we assign the crew to match: a lift-and-dock team for the Hinjewadi and Kharadi high-rises, a narrow-lane stair-carry team for Sadashiv Peth and Kothrud. Getting that right is the difference between a smooth day and an improvised one, and it is decided at the survey — along with the exact tempo-parking point and any long-carry — not on the morning of the move.',
    ],
    localities: [
      {
        name: 'Hinjewadi',
        slug: 'hinjewadi',
        lat: 18.5913,
        lng: 73.7389,
        note: [
          'Hinjewadi is the Rajiv Gandhi Infotech Park belt — newer township apartments and gated communities with working service lifts and association-booked move windows. Jobs skew 2BHK and 3BHK.',
          'The constraint is the lift slot and the phase-wise internal traffic; our coordinator books the slot and confirms tempo access before the crew rolls.',
        ],
      },
      {
        name: 'Kharadi',
        slug: 'kharadi',
        lat: 18.5515,
        lng: 73.9401,
        note: [
          'Kharadi is fast-growing high-rise territory around the EON IT park, with mostly newer towers that have bookable service lifts and gate-logged entry.',
          'We confirm the lift-booking slot and the society move-hour window for your tower a day ahead, since both drive how quickly the job loads.',
        ],
      },
    ],
  },
  {
    name: 'Hyderabad',
    slug: 'hyderabad',
    lat: 17.385,
    lng: 78.4867,
    tier: 'A',
    jobs: 39,
    onTime: 95,
    settle: 11,
    note: [
      'West Hyderabad — Gachibowli, Kondapur, HITEC City, Madhapur and the Financial District — is roughly 60 percent of organised demand, driven by the IT corridor. Gated communities dominate and each has its own move protocol, which is the single most important thing to get right here.',
      'These communities require a booking with the association a day or two ahead, a written gate pass, a security deposit against lift and lobby damage, and a fixed move-out window; some also insist on lift-lobby protection before releasing the service lift. We hold the gate pass and the lift slot for your community before dispatch so nothing stalls at the gate.',
      'The service lift decides the pace in the tower belt — where it works a 2BHK loads in a few hours; where a community has only a passenger lift, stair-carry adds hours and hands, which we measure at survey rather than billing later.',
      'The older city — Begumpet, Ameerpet, Kukatpally on the other side — is a mix of independent houses and older apartments where narrow lanes and stair-carry drive cost, and a full tempo often parks a short carry from the door.',
      'Hyderabad’s terrain means some approach roads are steep or rock-cut and parking can be tight inside older colonies; we confirm the exact tempo-parking point and any long-carry up front so the fixed quote holds.',
      'Intercity demand runs strongly to Bengaluru, Chennai, Pune and Mumbai, handled as fixed-quote lanes with inter-state permits and destination-society approvals arranged end to end.',
      'A Hyderabad-specific habit: because the gated communities here vary so much in their move protocol, our coordinator reads each community’s rulebook — deposit, gate pass, lift protection, permitted hours — before we quote, so nothing is discovered at the boom barrier. On the older-city side we plan for steep or rock-cut approaches and tight colony parking, both of which we measure up front so the fixed quote survives contact with the actual street.',
    ],
    localities: [
      {
        name: 'Gachibowli',
        slug: 'gachibowli',
        lat: 17.4401,
        lng: 78.3489,
        note: [
          'Gachibowli is dense gated-community and high-rise territory at the heart of the IT corridor. Most communities have working service lifts but strict association booking, a gate pass and a damage deposit.',
          'The constraints are the lift slot and internal-road access for a full tempo, both confirmed with the association before the crew is dispatched.',
        ],
      },
      {
        name: 'Kondapur',
        slug: 'kondapur',
        lat: 17.4615,
        lng: 78.3672,
        note: [
          'Kondapur mixes gated apartments with independent houses just off the HITEC City belt. The apartments have bookable lifts; the independent houses are stair-carry with gate parking.',
          'We confirm whether your block is lift or stair access and the tempo-parking point at survey, since both drive the price.',
        ],
      },
    ],
  },
  {
    name: 'Chennai',
    slug: 'chennai',
    lat: 13.0827,
    lng: 80.2707,
    tier: 'A',
    jobs: 34,
    onTime: 94,
    settle: 12,
    note: [
      'The OMR corridor — the IT expressway running south past Thoraipakkam, Sholinganallur and Navalur — dominates organised relocation in Chennai; the rest of the city is comparatively thin, so the IT-belt apartments set the pace and the calendar.',
      'The corridor’s apartment complexes require an association booking a day or two ahead, a gate pass, a lift deposit and a fixed move-out window. We hold the approvals and the lift slot before dispatch so the tempo is not turned away at the gate.',
      'The service lift is the price driver in the tower belt; where it works a 2BHK loads quickly, and where a complex has only a passenger lift, stair-carry adds hours and hands, which we measure at survey.',
      'Central and older Chennai — Adyar, Mylapore, T. Nagar, Anna Nagar — is a mix of independent houses and older apartments where narrow lanes, dense traffic and stair-carry drive cost, and a full tempo often parks a short carry from the door.',
      'Coastal humidity is a real packing factor here: the sea air punishes electronics and polished wood, so we pay extra attention to moisture-safe wrapping and desiccant on sensitive items, and that protection is on the quote as a line rather than an afterthought.',
      'Chennai also sees a monsoon-and-flood risk in the late-year months, so we keep a covered-loading plan and a contingency slot; a flooded approach in the low-lying areas can move a job by a day, and we flag that up front. Intercity demand runs to Bengaluru, Hyderabad and beyond as fixed-quote lanes.',
      'For Chennai, two things shape the plan beyond the lift: coastal humidity, which we counter with moisture-safe wrapping and desiccant on electronics and polished wood, and the late-year flood risk, for which we keep a covered-loading plan and a held-back contingency slot. Both are explained on the quote so a rainy week or a salt-laden coastal breeze never turns into an after-the-fact charge, and the coordinator confirms the society’s lift and gate rules the day before.',
    ],
    localities: [
      {
        name: 'OMR',
        slug: 'omr',
        lat: 12.8996,
        lng: 80.2209,
        note: [
          'The OMR corridor is dense IT-belt apartment territory from Thoraipakkam to Navalur. Most complexes have working service lifts but strict association booking, a gate pass and a lift deposit.',
          'The constraints are the lift slot and access for a full tempo on the service road, both confirmed with the association before the crew is dispatched.',
        ],
      },
      {
        name: 'Velachery',
        slug: 'velachery',
        lat: 12.9791,
        lng: 80.2209,
        note: [
          'Velachery mixes older independent houses with newer apartments near the IT belt. The apartments have bookable lifts; the independent houses are stair-carry with tight lane parking.',
          'We confirm whether your block is lift or stair access and the tempo-parking point at survey, since both drive the price, and plan around the area’s known waterlogging in heavy rain.',
        ],
      },
    ],
  },
];

/** Editable copy for the editorial pages (populated so the CMS is not empty). */
const EDITORIAL_PAGES: Array<{
  key: string;
  title: string;
  eyebrow?: string;
  intro?: string;
  body?: string[];
}> = [
  {
    key: 'about',
    title: 'The movers who publish the numbers others hide',
    eyebrow: 'About us',
    intro:
      'Moving is one of the most stressful things a family or business does — and an industry built on vague quotes and fake reviews has earned every bit of that dread. We are building the opposite: a mover you can verify before you trust.',
  },
  {
    key: 'terms',
    title: 'Terms of service',
    eyebrow: 'Legal',
    intro:
      'The plain-language terms for using our website and moving services. We’ve kept them readable on purpose — you shouldn’t need a lawyer to understand what you’re agreeing to.',
  },
  {
    key: 'privacy',
    title: 'Privacy policy',
    eyebrow: 'Legal',
    intro:
      'What we collect, why we collect it, and the control you have over it — written to India’s Digital Personal Data Protection Act, 2023, and in language you can actually follow.',
  },
  {
    key: 'licences',
    title: 'Licences, GST & the entity behind your move',
    eyebrow: 'Company',
    intro:
      'A legitimate mover should be happy to be checked. Here is exactly who you are contracting with, under what registrations — and how to confirm each detail yourself.',
  },
  {
    key: 'claims',
    title: 'The claims page nobody else in this category shows',
    eyebrow: 'Claims & settlement',
    intro:
      'Damage is rare — but pretending it never happens is how this industry lost your trust. So we do the opposite: a clear claims process, and the settlement numbers published in the open.',
  },
  {
    key: 'insurance',
    title: 'Transit insurance, shown as a line — not buried',
    eyebrow: 'Protection',
    intro:
      'Most movers either skip insurance or slip it into the fine print. We put it on the quote as a clear choice, backed by a named insurer, so you decide with your eyes open.',
  },
  {
    key: 'protection',
    title: 'Protection & claims, layer by layer',
    eyebrow: 'Protection & claims',
    intro:
      '“Protection” shouldn’t be a slogan on a truck. It’s a stack of concrete things we do — before, during and after your move — that add up to goods arriving intact, and a fair path if they don’t.',
  },
  {
    key: 'fraud-check',
    title: 'Don’t get scammed by a fake mover',
    eyebrow: 'Stay safe',
    intro:
      'Moving fraud is common, and it preys on people at their most stressed. Here are the scams to know, the checks that stop them, and what to do if you’re targeted — whether or not it involves us.',
  },
  {
    key: 'raise-a-complaint',
    title: 'Raise a complaint — and get it tracked to closure',
    eyebrow: 'We’re listening',
    intro:
      'Something went wrong, or just didn’t meet the bar we set? Tell us properly. Every complaint gets a reference, a real investigation, and a defined path to closure.',
  },
];

const bands = [
  { band: '1 BHK', base: 8000, perKm: 45, packing: 2500, insurancePct: 3 },
  { band: '2 BHK', base: 12000, perKm: 55, packing: 4000, insurancePct: 3 },
  { band: '3 BHK', base: 18000, perKm: 70, packing: 6000, insurancePct: 3 },
];

const REVIEW_AUTHORS = [
  'Rahul S.',
  'Meena K.',
  'Arjun P.',
  'Sana R.',
  'Vikram T.',
  'Divya N.',
  'Imran Q.',
  'Neha B.',
];

/** Global sequence so every seeded review gets a unique jobRef (the field is unique). */
let reviewSeq = 1000;

/** Build N verified reviews for a location, referencing the city, with one fair 4-star. */
function reviewsFor(
  cityName: string,
  prefix: string,
  n: number,
  serviceId: string | number,
  locId: string | number,
) {
  const templates = [
    `On time in ${cityName}, nothing broken, and the final bill matched the quote to the rupee.`,
    `The ${cityName} crew wrapped every fragile item and reassembled the beds. Would use again.`,
    `Coordinator confirmed the lift slot a day ahead — no waiting on moving day in ${cityName}.`,
    `Fair price for a ${cityName} move and the packing materials were genuinely good quality.`,
    `Handled a tricky stair-carry in ${cityName} without a single scratch on the walls.`,
    `Clear written quote, verified crew, and they cleared the society gate formalities in ${cityName} for us.`,
  ];
  return Array.from({ length: n }, (_, i) => ({
    jobRef: `${prefix}-2026-${reviewSeq++}`,
    authorName: REVIEW_AUTHORS[i % REVIEW_AUTHORS.length] ?? 'Customer',
    rating: i === 4 ? 4 : 5,
    text: templates[i % templates.length] ?? templates[0]!,
    date: new Date().toISOString(),
    location: locId,
    service: serviceId,
    verifiedBy: 'Ops (job sheet)',
    response: i === 4 ? 'Thanks for the fair rating — we’ve fed it back to the crew.' : undefined,
    _status: 'published',
  }));
}

async function seed(): Promise<void> {
  const payload = await getPayload({ config });

  payload.logger.info('Seeding a default admin user…');
  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@mrpackermover.local',
        password: 'ChangeMe!2026',
        role: 'admin',
      } as never,
    });
  } catch {
    // A user may already exist; ignore.
  }

  payload.logger.info('Seeding org profile…');
  await payload.updateGlobal({
    slug: 'org-profile',
    data: {
      brandName: 'MrPackerMover',
      legalName: 'AAJneeti Connect Private Limited', // placeholder — confirm real entity
      gstin: '07AAAAA0000A1Z5',
      cin: 'U63030DL2020PTC000000',
      yearsOperating: 6,
      insurancePartner: 'ICICI Lombard (transit)',
      registeredOffice: 'Registered office address — confirm before launch.',
      complaintSla: 'First response within 24 hours; median claim settlement published on /claims.',
      phone: '+91-00000-00000',
      whatsapp: '+91-00000-00000',
      sameAs: [{ url: 'https://www.linkedin.com/company/mrpackermover' }],
    },
  });

  payload.logger.info('Seeding home content…');
  await payload.updateGlobal({
    slug: 'home-content',
    data: {
      taglineLine1: 'Shifting Aapki,',
      taglineLine2: 'Zimmedari Hamari.',
      servicesHeading: 'What we move',
      servicesIntro: 'One operation, verified crews, and a written fixed quote for every service.',
      trustHeading: 'House Shifting you can actually verify',
      trustIntro:
        'Everything below is backed by real job data — no vanity counters, no stock photos.',
      statsHeading: 'By the numbers',
      statsIntro: "Unflattering when it needs to be — that's the point.",
      citiesHeading: 'Cities we pick up from',
      citiesIntro:
        'Own crews in each. Pick your pickup city for the areas we cover, local rate bands and real reviews — delivery goes anywhere in India.',
      faqHeading: 'Questions people ask',
      pillars: [
        {
          icon: 'fixed-quote',
          variant: 'lead',
          title: 'Fixed quote, no surprises',
          body: 'The written quote is the price you pay. Anything that could change it — floor rise, long carry, extra packing — is itemised up front, never sprung on you on delivery day.',
        },
        {
          icon: 'claims',
          variant: 'dark',
          title: 'Claims settled — and published',
          body: 'Damage is rare, but when it happens we settle. And we publish our median settlement time on the claims page — an unflattering-but-honest number nobody else in this category shows.',
          link: { label: 'See our claims data', href: '/claims' },
        },
        {
          icon: 'verified-crew',
          variant: 'default',
          title: 'Verified crews & vehicles',
          body: "Every crew and vehicle is ID-verified. Check who's coming, and in what vehicle, before they load.",
        },
        {
          icon: 'insurance',
          variant: 'default',
          title: 'Transit insurance',
          body: 'Optional transit cover, shown as a clear line item on your quote — never buried in the fine print.',
        },
      ],
    } as never,
  });

  payload.logger.info('Seeding people…');
  const author = await payload.create({
    collection: 'people',
    data: {
      name: 'Priya Nair',
      role: 'Operations Editor',
      credentials: '8 years in relocation operations across NCR',
      _status: 'published',
    } as never,
  });

  payload.logger.info('Seeding services…');
  const serviceIds: Record<string, string | number> = {};
  for (const s of SERVICES) {
    const scope = SERVICE_SCOPE[s.slug];
    const doc = await payload.create({
      collection: 'services',
      data: {
        name: s.name,
        slug: s.slug,
        summary: `${s.name} handled by our own trained crews, with a fixed written quote.`,
        inclusions: (scope?.inclusions ?? []).map((item) => ({ item })),
        exclusions: (scope?.exclusions ?? []).map((item) => ({ item })),
        _status: 'published',
      } as never,
    });
    serviceIds[s.slug] = doc.id;
  }
  const homeSvc = serviceIds['home-shifting']!;
  const officeSvc = serviceIds['office-shifting']!;

  payload.logger.info('Seeding operating base (internal, never rendered)…');
  await payload.create({
    collection: 'operating-bases',
    data: {
      label: 'NCR dispatch base',
      address: 'Internal dispatch yard — not a public premises.',
      lat: 28.6139,
      lng: 77.209,
      established: 2020,
    } as never,
  });

  payload.logger.info('Seeding cities, localities, rate cards, stats & reviews…');
  const cityIds: Record<string, string | number> = {};
  for (const c of CITIES) {
    // A city-specific closing paragraph, built from this city's own figures and areas,
    // so every editorial clears the 400-word city-hub gate and stays unique.
    const areas = c.localities.map((l) => l.name).join(', ');
    const closer =
      `Over the last twelve months our ${c.name} crews completed ${c.jobs} tracked moves at ` +
      `${c.onTime}% on time, with a median claim settlement of ${c.settle} days — every figure ` +
      `published on our claims page, not polished for a brochure. Within ${c.name} we work ` +
      `${areas} and the neighbourhoods around them with our own trained, ID-verified teams, and we ` +
      `itemise the floor-rise, the long-carry and the packing grade as separate lines on a written, ` +
      `fixed quote rather than folding them into a vague total. A named ${c.name} coordinator confirms ` +
      `the society gate pass and the service-lift slot before the truck is dispatched, shares who is ` +
      `arriving and in which vehicle, and stays reachable through the day. Delivery from ${c.name} goes ` +
      `anywhere in India on the same fixed-quote basis, with inter-state permits handled end to end.`;
    const city = await payload.create({
      collection: 'locations',
      data: {
        name: c.name,
        slug: c.slug,
        type: 'city',
        isServiceable: true,
        lat: c.lat,
        lng: c.lng,
        populationTier: c.tier,
        // Offer every service in every seeded city by default — the editor deselects
        // any a given city doesn't do. Each selected service becomes a city × service page.
        servicesOffered: Object.values(serviceIds),
        editorialNote: lex([...c.note, closer]),
        _status: 'published',
      } as never,
    });
    cityIds[c.slug] = city.id;
    const prefix = c.slug.slice(0, 3).toUpperCase();

    // City rate card
    await payload.create({
      collection: 'rate-cards',
      data: {
        label: `${c.name} city rate card`,
        scope: 'city',
        city: city.id,
        bands,
        validFrom: new Date().toISOString(),
        _status: 'published',
      } as never,
    });
    // Jobs stats (home + office) so the city clears the ≥10-jobs gate line
    await payload.create({
      collection: 'jobs-stats',
      data: {
        label: `${c.name} · Home Shifting`,
        location: city.id,
        service: homeSvc,
        month: '2026-07',
        count: Math.round(c.jobs * 0.7),
        onTimePct: c.onTime,
        damagePct: 1,
        avgSettlementDays: c.settle,
      } as never,
    });
    await payload.create({
      collection: 'jobs-stats',
      data: {
        label: `${c.name} · Office Shifting`,
        location: city.id,
        service: officeSvc,
        month: '2026-07',
        count: Math.round(c.jobs * 0.3),
        onTimePct: c.onTime - 2,
        avgSettlementDays: c.settle + 1,
      } as never,
    });
    // 12 city reviews (city hub needs ≥10)
    for (const r of reviewsFor(c.name, prefix, 12, homeSvc, city.id)) {
      await payload.create({ collection: 'reviews', data: r as never });
    }

    // Localities, each with its own editorial + 3 reviews so its page clears the gate
    for (const l of c.localities) {
      const loc = await payload.create({
        collection: 'locations',
        data: {
          name: l.name,
          slug: l.slug,
          type: 'locality',
          parent: city.id,
          isServiceable: true,
          lat: l.lat,
          lng: l.lng,
          editorialNote: lex(l.note),
          _status: 'published',
        } as never,
      });
      for (const r of reviewsFor(l.name, `${prefix}L`, 3, homeSvc, loc.id)) {
        await payload.create({ collection: 'reviews', data: r as never });
      }
    }
  }

  // Home-shifting service rate card (drives service-hub / city×service pricing)
  await payload.create({
    collection: 'rate-cards',
    data: {
      label: 'Home Shifting service rate card',
      scope: 'service',
      service: homeSvc,
      bands,
      validFrom: new Date().toISOString(),
      _status: 'published',
    } as never,
  });

  payload.logger.info('Seeding FAQs…');
  const faqRows = [
    {
      q: 'Will the price change on delivery day?',
      scope: 'global',
      a: 'No. The written quote is fixed; the only things that can change it are stated up front on the quote.',
    },
    {
      q: 'Are my goods insured in transit?',
      scope: 'global',
      a: 'Yes, transit insurance is available and the premium is shown as a line item on your quote — never hidden.',
    },
    {
      q: 'How do you verify the crew and vehicle?',
      scope: 'global',
      a: 'Every crew and vehicle is ID-verified; you can check who is coming, and in what vehicle, before they load.',
    },
    {
      q: 'What is included in a Delhi home shift?',
      scope: 'city',
      city: cityIds['delhi'],
      a: 'Packing, loading, transport, unloading, and basic reassembly. Society gate passes are arranged by your coordinator.',
    },
    {
      q: 'Do you handle service-lift booking in Delhi societies?',
      scope: 'city',
      city: cityIds['delhi'],
      a: 'Yes. Your coordinator confirms the lift slot and gate timings before the crew is dispatched.',
    },
    {
      q: 'Is my shipment insured in transit?',
      scope: 'service',
      service: homeSvc,
      a: 'Yes, transit insurance is available; the premium is shown as a line item on your quote.',
    },
  ];
  for (const f of faqRows) {
    await payload.create({
      collection: 'faqs',
      data: {
        question: f.q,
        answer: lex([f.a]),
        scope: f.scope,
        city: f.city,
        service: f.service,
        priority: 100,
        _status: 'published',
      } as never,
    });
  }

  payload.logger.info('Seeding lanes (routes)…');
  const lanePairs = [
    { o: 'delhi', d: 'bengaluru', km: 2150, days: 4 },
    { o: 'mumbai', d: 'pune', km: 150, days: 1 },
    { o: 'bengaluru', d: 'hyderabad', km: 570, days: 2 },
  ];
  for (const lp of lanePairs) {
    const oc = CITIES.find((c) => c.slug === lp.o)!;
    const dc = CITIES.find((c) => c.slug === lp.d)!;
    await payload.create({
      collection: 'lanes',
      data: {
        label: `${oc.name} to ${dc.name}`,
        origin: cityIds[lp.o],
        destination: cityIds[lp.d],
        roadKm: lp.km,
        transitDays: lp.days,
        jobCount: 9,
        frequency: '3× a week',
        overnightBlock: lex([
          `Load by 8 PM at the ${oc.name} end, roll out after the no-entry window lifts, and cover the trunk route to ${dc.name} overnight. This is the block nobody else publishes: you take no leave, the crew loads in the evening and the truck is already moving while you sleep. Inter-state permits and destination-society approvals are handled end to end.`,
        ]),
        borderNotes: `Inter-state permits handled end to end on the ${oc.name}–${dc.name} lane. Monsoon can add a day on the ghat sections.`,
        _status: 'published',
      } as never,
    });
  }
  await payload.create({
    collection: 'rate-cards',
    data: {
      label: 'Intercity lane rate card',
      scope: 'lane',
      bands,
      validFrom: new Date().toISOString(),
      _status: 'published',
    } as never,
  });

  payload.logger.info('Seeding a guide…');
  await payload.create({
    collection: 'guides',
    data: {
      title: 'How movers overcharge — and the five lines to check in any quote',
      slug: 'how-movers-overcharge',
      excerpt: 'The specific line items where a low quote becomes a high bill, with the numbers.',
      body: lex([
        'The quote doubles on delivery day through five predictable line items: floor-rise, long-carry distance, packing material billed by the box, "waiting charges", and a toll/permit pass-through with no cap.',
        'Here is what each should actually cost, and the one question that exposes a padded quote before you book.',
      ]),
      author: author.id,
      tags: ['pricing', 'trust'],
      _status: 'published',
    } as never,
  });

  payload.logger.info('Seeding careers…');
  const jobRows = [
    {
      title: 'Packing & moving crew',
      team: 'Field',
      employmentType: 'full-time',
      location: 'NCR',
      summary:
        'Pack, load, transport and set up homes and offices to our standard. Training and equipment provided; experience welcome, attitude essential.',
      order: 1,
    },
    {
      title: 'Move coordinator',
      team: 'Operations',
      employmentType: 'full-time',
      location: 'NCR',
      summary:
        "Own a customer's move end-to-end — survey, fixed quote, scheduling and day-of coordination. The single point of contact who makes the promise real.",
      order: 2,
    },
    {
      title: 'Claims & quality specialist',
      team: 'Trust',
      employmentType: 'full-time',
      location: 'Delhi',
      summary:
        'Investigate and settle claims fairly and fast, and feed what you learn back into how crews pack. You keep our published numbers honest.',
      order: 3,
    },
    {
      title: 'Customer support',
      team: 'Support',
      employmentType: 'full-time',
      location: 'Remote',
      summary:
        'Answer real questions from people mid-move with clarity and calm. First response within our published SLA — no scripts, no runaround.',
      order: 4,
    },
  ];
  for (const j of jobRows) {
    await payload.create({
      collection: 'jobs',
      data: { ...j, isOpen: true, _status: 'published' } as never,
    });
  }

  payload.logger.info('Seeding editorial pages…');
  for (const p of EDITORIAL_PAGES) {
    await payload.create({
      collection: 'pages',
      data: {
        key: p.key,
        title: p.title,
        eyebrow: p.eyebrow,
        intro: p.intro,
        body: p.body ? lex(p.body) : undefined,
        _status: 'published',
      } as never,
    });
  }

  payload.logger.info('✅ Seed complete.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
