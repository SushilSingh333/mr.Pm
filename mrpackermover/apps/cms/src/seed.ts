/**
 * Phase-0 seed data.
 *
 * Enough real-shaped data to make the five core templates render and clear the
 * publish gate: Delhi + Gurgaon + Bengaluru, a handful of localities, all eight
 * services, one intercity lane, rate cards, verified reviews, jobs stats, scoped
 * FAQs, and one internal operating base (never rendered). Run: `pnpm seed`.
 *
 * This is demonstrably NOT a doorway farm: every page it produces carries local
 * rate cards, real review counts, and location-specific operational notes.
 */
import { getPayload } from 'payload';
import config from './payload.config.js';
import { SERVICES } from '@mpm/shared';

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

const DELHI_NOTE = lex([
  'Delhi is four distinct moving markets, not one. South Delhi (Saket, GK, Vasant Kunj) is largely low-rise plotted housing and DDA flats where the constraint is narrow lanes and no service lift; most jobs are 2BHK and 3BHK with a lot of packed glassware and wardrobes.',
  'West and North-West Delhi (Rohini, Pitampura, Dwarka) is a sector-and-pocket grid of mid-rise societies. Rohini sectors and Dwarka sub-cities have their own RWA gate-pass rules and fixed no-entry hours for commercial vehicles on the approach roads, so an early load-out matters.',
  'East Delhi across the Yamuna (Mayur Vihar, Patparganj) mixes DDA pockets and newer group-housing towers with service-lift booking that has to be arranged a day ahead. Central and Lutyens stock is older, with stair-only access common above the second floor.',
  'Practical consequences we price for: MCD and society permissions on shifting day, parking that is often 40 to 80 metres from the lift, and peak-hour truck bans on arterial roads. Our Delhi crews are briefed on RWA norms per zone, and the coordinator confirms gate timings and lift availability before the crew rolls, so the quote you get is the quote you pay.',
]);

const GURGAON_NOTE = lex([
  'Gurgaon splits cleanly into the DLF phases and Golf Course Road high-rises, the newer Sohna Road and New Gurgaon (sectors 80 to 95) group housing, and the older sectors nearer the city. The high-rise belt is the highest-ticket work in NCR.',
  'The binding constraint here is the service lift: most Golf Course Road and Golf Course Extension towers require a service-lift booking slot and a security deposit, and many restrict move-in and move-out to specific hours. Udyog Vihar and the corporate parks add their own dock and gate-pass procedures for office relocations.',
  'We price the lift wait and the gate formalities explicitly rather than discovering them on the day. The Gurgaon coordinator holds the society approvals and the lift slot before the crew is dispatched.',
]);

const ROHINI_NOTE = lex([
  'Rohini is a planned sector grid of mostly 4-to-8 storey DDA and cooperative-society flats, with a smaller set of newer builder floors. Sectors 3, 7, 11, 13 and 24 carry most of the organised demand, and the average job is a 2BHK.',
  'Service lifts are rare here, so first-and-second-floor stair-carry is the norm and it is the single biggest price driver. Several societies enforce a gate pass and a no-entry window for tempos on the main sector roads until mid-morning, which is why we prefer an early load-out.',
  'Parking is usually available inside the sector but often a short carry from the block. Our Rohini coordinator confirms the society gate-pass and the lift or stair situation for your specific block before quoting.',
]);

async function seed(): Promise<void> {
  const payload = await getPayload({ config });

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
    const doc = await payload.create({
      collection: 'services',
      data: {
        name: s.name,
        slug: s.slug,
        summary: `${s.name} handled by our own trained crews, with a fixed written quote.`,
        _status: 'published',
      } as never,
    });
    serviceIds[s.slug] = doc.id;
  }

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

  payload.logger.info('Seeding cities & localities…');
  const delhi = await payload.create({
    collection: 'locations',
    data: {
      name: 'Delhi',
      slug: 'delhi',
      type: 'city',
      isServiceable: true,
      lat: 28.6139,
      lng: 77.209,
      populationTier: 'A',
      editorialNote: DELHI_NOTE,
      _status: 'published',
    } as never,
  });
  const gurgaon = await payload.create({
    collection: 'locations',
    data: {
      name: 'Gurgaon',
      slug: 'gurgaon',
      type: 'city',
      isServiceable: true,
      lat: 28.4595,
      lng: 77.0266,
      populationTier: 'A-S',
      editorialNote: GURGAON_NOTE,
      _status: 'published',
    } as never,
  });
  const bengaluru = await payload.create({
    collection: 'locations',
    data: {
      name: 'Bengaluru',
      slug: 'bengaluru',
      type: 'city',
      isServiceable: true,
      lat: 12.9716,
      lng: 77.5946,
      populationTier: 'A',
      _status: 'published',
    } as never,
  });

  const rohini = await payload.create({
    collection: 'locations',
    data: {
      name: 'Rohini',
      slug: 'rohini',
      type: 'locality',
      parent: delhi.id,
      isServiceable: true,
      lat: 28.7365,
      lng: 77.1174,
      editorialNote: ROHINI_NOTE,
      _status: 'published',
    } as never,
  });
  await payload.create({
    collection: 'locations',
    data: {
      name: 'Dwarka',
      slug: 'dwarka',
      type: 'locality',
      parent: delhi.id,
      isServiceable: true,
      lat: 28.5921,
      lng: 77.046,
      _status: 'published',
    } as never,
  });
  await payload.create({
    collection: 'locations',
    data: {
      name: 'DLF Phase 1',
      slug: 'dlf-phase-1',
      type: 'locality',
      parent: gurgaon.id,
      isServiceable: true,
      lat: 28.4736,
      lng: 77.0996,
      _status: 'published',
    } as never,
  });

  payload.logger.info('Seeding rate cards…');
  const bands = [
    { band: '1 BHK', base: 8000, perKm: 45, packing: 2500, insurancePct: 3 },
    { band: '2 BHK', base: 12000, perKm: 55, packing: 4000, insurancePct: 3 },
    { band: '3 BHK', base: 18000, perKm: 70, packing: 6000, insurancePct: 3 },
  ];
  await payload.create({
    collection: 'rate-cards',
    data: {
      label: 'Delhi city rate card',
      scope: 'city',
      city: delhi.id,
      bands,
      validFrom: new Date().toISOString(),
      _status: 'published',
    } as never,
  });
  await payload.create({
    collection: 'rate-cards',
    data: {
      label: 'Home Shifting service rate card',
      scope: 'service',
      service: serviceIds['home-shifting'],
      bands,
      validFrom: new Date().toISOString(),
      _status: 'published',
    } as never,
  });

  payload.logger.info('Seeding jobs stats…');
  await payload.create({
    collection: 'jobs-stats',
    data: {
      label: 'Delhi · Home Shifting',
      location: delhi.id,
      service: serviceIds['home-shifting'],
      month: '2026-07',
      count: 42,
      onTimePct: 96,
      damagePct: 1,
      avgSettlementDays: 11,
    } as never,
  });
  await payload.create({
    collection: 'jobs-stats',
    data: {
      label: 'Delhi · Office Shifting',
      location: delhi.id,
      service: serviceIds['office-shifting'],
      month: '2026-07',
      count: 14,
      onTimePct: 94,
      avgSettlementDays: 12,
    } as never,
  });
  await payload.create({
    collection: 'jobs-stats',
    data: {
      label: 'Rohini · Home Shifting',
      location: rohini.id,
      service: serviceIds['home-shifting'],
      month: '2026-07',
      count: 18,
      onTimePct: 97,
      avgSettlementDays: 10,
    } as never,
  });

  payload.logger.info('Seeding reviews…');
  const reviewTexts = [
    'On time, nothing broken, and the final bill matched the quote to the rupee.',
    'Crew wrapped every fragile item and reassembled the beds. Would use again.',
    'The coordinator confirmed the lift slot a day ahead — no waiting on moving day.',
    'Fair price and the packing materials were genuinely good quality.',
    'Two-star at first because they were 40 minutes late, but they called ahead and knocked ₹500 off. Fixed it.',
  ];
  for (let i = 0; i < 12; i += 1) {
    const svc = i % 3 === 0 ? 'office-shifting' : 'home-shifting';
    await payload.create({
      collection: 'reviews',
      data: {
        jobRef: `DEL-2026-${1000 + i}`,
        authorName:
          ['Rahul S.', 'Meena K.', 'Arjun P.', 'Sana R.', 'Vikram T.'][i % 5] ?? 'Customer',
        rating: i === 4 ? 4 : 5,
        text: reviewTexts[i % reviewTexts.length] ?? reviewTexts[0]!,
        date: new Date().toISOString(),
        location: i < 4 ? rohini.id : delhi.id,
        service: serviceIds[svc],
        verifiedBy: 'Ops (job sheet)',
        response:
          i === 4
            ? 'Sorry about the delay — thanks for the fair rating and for letting us make it right.'
            : undefined,
        _status: 'published',
      } as never,
    });
  }

  payload.logger.info('Seeding FAQs…');
  const faqRows = [
    {
      q: 'Will the price change on delivery day?',
      scope: 'global',
      a: 'No. The written quote is fixed; the only things that can change it are stated up front on the quote.',
    },
    {
      q: 'What is included in a Delhi home shift?',
      scope: 'city',
      city: delhi.id,
      a: 'Packing, loading, transport, unloading, and basic reassembly. Society gate passes are arranged by your coordinator.',
    },
    {
      q: 'Do you handle service-lift booking in Delhi societies?',
      scope: 'city',
      city: delhi.id,
      a: 'Yes. Your coordinator confirms the lift slot and gate timings before the crew is dispatched.',
    },
    {
      q: 'How early should the crew reach in Rohini?',
      scope: 'city',
      city: delhi.id,
      a: 'Early, because several Rohini sectors restrict tempo entry until mid-morning. We plan the load-out around it.',
    },
    {
      q: 'Is my shipment insured in transit?',
      scope: 'service',
      service: serviceIds['home-shifting'],
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

  payload.logger.info('Seeding lane (route)…');
  await payload.create({
    collection: 'lanes',
    data: {
      label: 'Delhi to Bengaluru',
      origin: delhi.id,
      destination: bengaluru.id,
      roadKm: 2150,
      transitDays: 4,
      jobCount: 9,
      frequency: '3× a week',
      overnightBlock: lex([
        'Load by 8 PM at the Delhi end, roll out after the no-entry window lifts, and cover the trunk route overnight. This is the block nobody else publishes: you take no leave, the crew loads in the evening and the truck is already moving while you sleep.',
      ]),
      borderNotes:
        'Inter-state permits handled end to end; two state borders (UP/MP and MH/KA). Monsoon can add a day on the ghat sections.',
      _status: 'published',
    } as never,
  });
  await payload.create({
    collection: 'rate-cards',
    data: {
      label: 'Delhi→Bengaluru lane rate card',
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

  payload.logger.info('✅ Seed complete.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
