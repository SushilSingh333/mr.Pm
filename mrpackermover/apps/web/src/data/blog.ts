/**
 * Blog data for the static site. Posts now come from the CMS (`posts` collection) via
 * the build manifest. The in-repo FALLBACK_POSTS below are shown when the manifest has
 * no blog entries (design/CI with no database) and stay visible alongside CMS posts
 * unless a CMS post reuses their slug — so the blog is never empty and adding a post in
 * the CMS is purely additive. Bodies are trusted HTML (the CMS rich-text renderer, or
 * authored here). Covers reuse the self-hosted hero imagery in /public/images/hero.
 */
import { manifest } from './manifest.js';
import type { BlogPost } from '@mpm/shared';

export type { BlogPost } from '@mpm/shared';
export type BlogCategory = 'Guides' | 'Pricing' | 'Safety' | 'Packing' | 'Business';

export const CATEGORIES: BlogCategory[] = ['Guides', 'Pricing', 'Safety', 'Packing', 'Business'];

const AUTHOR = 'The MrPackerMover Team';

const FALLBACK_POSTS: BlogPost[] = [
  {
    slug: 'home-shifting-checklist-8-weeks',
    title: 'The 8-week home-shifting checklist that keeps moving day boring',
    excerpt:
      'A calm move is a planned move. Here’s exactly what to do each week — from eight weeks out to the morning the truck arrives — so nothing important happens by accident.',
    category: 'Guides',
    author: AUTHOR,
    date: '2026-07-28T09:00:00.000Z',
    readMins: 8,
    cover: '/images/hero/moving.jpg',
    coverAlt: 'A packed home ready for shifting day',
    featured: true,
    tags: ['home shifting', 'checklist', 'planning'],
    body: `
<p class="lead">The best moving days are the dull ones — the crew arrives, the plan runs, and by evening you’re unpacking in a new home. Dull is the product of planning. This is the timeline our coordinators actually use.</p>

<h2>8 weeks out: decide and declutter</h2>
<p>Confirm your move date and get a survey booked so you can lock a fixed quote early. Then start the single highest-value moving task there is: getting rid of what you won’t take. Every carton you don’t pack is money you don’t spend moving it.</p>
<ul>
  <li>Walk each room and sort into keep, donate, sell and discard.</li>
  <li>Be ruthless with duplicates, unused appliances and “someday” items.</li>
  <li>Book a video or in-home survey for an accurate, fixed quote.</li>
</ul>

<h2>6 weeks out: paperwork and providers</h2>
<p>Start the admin that has lead times. Notify your landlord if you’re renting, and list every service tied to your address — you’ll transfer or close them over the next few weeks.</p>
<ul>
  <li>Schedule transfers for internet, gas, and any subscriptions.</li>
  <li>Note school, bank and insurance address changes to make later.</li>
  <li>Confirm lift availability and parking at both ends for move day.</li>
</ul>

<h2>4 weeks out: confirm the move</h2>
<p>Accept your written quote and confirm the booking. This is also when you decide on transit insurance based on the declared value of your goods — not something to figure out on the day.</p>

<h2>2 weeks out: pack the rarely-used</h2>
<p>Begin packing things you won’t need before the move: off-season clothes, books, spare crockery. Label every carton by <em>room</em> and <em>contents</em>, not just “misc”. Your unpacking self will thank you.</p>

<h2>1 week out: essentials and valuables</h2>
<p>Pack a clearly-marked “first night” box — chargers, toiletries, a change of clothes, basic tools, medicines. Set aside cash, jewellery and documents to carry personally; these should never go on the truck.</p>

<h2>Move day: verify, then relax</h2>
<p>Match the crew IDs and vehicle number to what your coordinator sent you before anything is loaded. Do a final empty-cupboard walkthrough. Then let the crew do what they’re trained to do.</p>
<p>Want the whole thing to start on the right foot? <a href="/get-quote">Get a fixed quote</a> and we’ll build the plan around your date.</p>
`,
  },
  {
    slug: 'what-a-fair-moving-quote-includes',
    title: 'What a fair moving quote actually includes (and the tricks to avoid)',
    excerpt:
      'The lowest number is rarely the cheapest move. Learn to read a quote line by line, spot the classic bait-and-switch, and tell a real fixed price from a moving-day trap.',
    category: 'Pricing',
    author: AUTHOR,
    date: '2026-07-21T09:00:00.000Z',
    readMins: 6,
    cover: '/images/hero/home.jpg',
    coverAlt: 'A calculator and moving cartons representing a moving quote',
    tags: ['pricing', 'quotes', 'budgeting'],
    body: `
<p class="lead">Two quotes for the same move can differ by thousands — not because one company is cheaper, but because one of them left things out on purpose. Here’s how to compare honestly.</p>

<h2>A real quote starts with a survey</h2>
<p>No one can fix a price without seeing what you’re moving. If a quote lands after a two-minute phone call with no survey, treat the number as a guess — one that tends to grow on moving day.</p>

<h2>What should be on the quote</h2>
<ul>
  <li><strong>Packing materials and labour</strong> — cartons, wrap, and the crew to pack them.</li>
  <li><strong>Loading, transport and unloading</strong> — the core move, priced by volume and distance.</li>
  <li><strong>Basic assembly</strong> — dismantling and reassembling standard furniture.</li>
  <li><strong>Taxes</strong> — GST shown as its own line, not bolted on later.</li>
</ul>

<h2>What should be itemised separately — never hidden</h2>
<p>Some costs are legitimate but situational. A trustworthy mover names them up front rather than springing them on you:</p>
<ul>
  <li>Long carry or stairs where there’s no service lift.</li>
  <li>Short-term storage between pickup and delivery.</li>
  <li>Special crating for fragile or high-value items.</li>
  <li>Optional transit insurance, priced against your declared value.</li>
</ul>

<h2>The bait-and-switch, in one line</h2>
<p>The classic trap is a headline price with no survey, followed by “extra charges” once your goods are on the truck. The defence is simple: insist on a <a href="/pricing">written, fixed quote</a> after a survey, and confirm that anything not listed won’t be charged.</p>

<blockquote>If it isn’t on your written quote, you shouldn’t be paying for it.</blockquote>

<p>That’s the whole philosophy behind how we price. See exactly how a fixed quote is built on our <a href="/pricing">pricing page</a>.</p>
`,
  },
  {
    slug: 'spot-a-packers-movers-scam',
    title: 'How to spot a packers-and-movers scam before you pay a rupee',
    excerpt:
      'Moving fraud thrives on urgency and a suspiciously low first price. Here are the four scams that catch people every season — and the checks that stop each one cold.',
    category: 'Safety',
    author: AUTHOR,
    date: '2026-07-14T09:00:00.000Z',
    readMins: 5,
    cover: '/images/hero/route.jpg',
    coverAlt: 'A moving truck on an intercity route',
    tags: ['safety', 'fraud', 'verification'],
    body: `
<p class="lead">Every moving season brings a wave of fraud, because the setup is easy: a slick listing, a low quote, and a customer under pressure. Knowing the playbook is most of the defence.</p>

<h2>1. The advance-fee vanish</h2>
<p>You’re asked for a big “booking deposit” to a personal UPI or account — and then silence. A legitimate mover takes a token advance against a written, GST quote, not a large upfront transfer to an individual.</p>

<h2>2. The bait quote</h2>
<p>A price well below everyone else, given without a survey. On the day, it balloons — or your goods are held until you pay “extra”. A fixed written quote after a survey removes the bait entirely.</p>

<h2>3. The look-alike listing</h2>
<p>Fraudsters clone a real company’s name, reviews and photos. The tell is the paperwork: the name on the invoice won’t match the GST registration. Always check the <strong>GSTIN and CIN</strong> against the company name on the government portals.</p>

<h2>4. Hostage goods</h2>
<p>Your belongings are loaded, then the price jumps and the truck won’t move. A written, itemised quote agreed in advance takes away all the leverage.</p>

<h2>Your 60-second safety check</h2>
<ul>
  <li>Was there a survey and a written, itemised quote?</li>
  <li>Does the GSTIN match the company name? (Check it online.)</li>
  <li>Are you paying the company on record, not an individual in cash?</li>
  <li>Do the crew and vehicle match what you were sent?</li>
</ul>
<p>We wrote a fuller guide — including how to report fraud in India — on our <a href="/fraud-check">fraud-check page</a>. And here’s <a href="/verify">how to verify us</a> specifically.</p>
`,
  },
  {
    slug: 'packing-fragile-items-that-survive',
    title: 'Packing fragile items so they actually survive the trip',
    excerpt:
      'Most transit damage is decided at the packing table, not on the road. A room-by-room guide to wrapping the things you’d be gutted to break.',
    category: 'Packing',
    author: AUTHOR,
    date: '2026-07-07T09:00:00.000Z',
    readMins: 7,
    cover: '/images/hero/storage.jpg',
    coverAlt: 'Carefully packed and labelled moving boxes in storage',
    tags: ['packing', 'fragile', 'how-to'],
    body: `
<p class="lead">Here’s the counter-intuitive truth of moving: whether your glassware arrives intact is mostly decided before the truck even starts. Good packing is the single biggest lever on damage.</p>

<h2>The three rules that prevent most breakage</h2>
<ul>
  <li><strong>Immobilise.</strong> Anything that can move inside a box will, eventually, hit something. Fill every gap.</li>
  <li><strong>Cushion the edges.</strong> Corners and rims take the hit first — pad them most.</li>
  <li><strong>Right-size the box.</strong> Heavy items go in small boxes; light and bulky in large ones.</li>
</ul>

<h2>Kitchen: the highest-risk room</h2>
<p>Wrap plates individually and pack them <em>on their edge</em>, like records — never stacked flat. Nest glasses in cell dividers, stuff each with paper, and never let two touch directly. Mark the carton <strong>fragile</strong> and <strong>this way up</strong>.</p>

<h2>Electronics: original boxes win</h2>
<p>If you kept the original packaging, use it — it was engineered for exactly this. Otherwise, wrap screens in a blanket, then bubble wrap, and box them upright. Photograph cable arrangements before you unplug anything.</p>

<h2>Art, mirrors and glass</h2>
<p>Tape a large X across glass faces to hold shards if the worst happens, wrap in bubble wrap, and sandwich between cardboard. These travel standing on edge, never flat under weight.</p>

<h2>Lamps, décor and the awkward stuff</h2>
<p>Remove bulbs and shades and pack them separately. Small valuables and anything irreplaceable — carry those yourself.</p>

<h2>When to let the crew do it</h2>
<p>For genuinely valuable or tricky items, professional packing and crating earns its cost, and it keeps things clean for any claim. Our crews pack to a standard and log fragile items with photos, so you’re covered by a shared record. See how that fits into <a href="/protection">protection &amp; claims</a>.</p>
`,
  },
  {
    slug: 'office-relocation-without-downtime',
    title: 'Office relocation without losing a working day',
    excerpt:
      'Moving a business is a logistics project, not a weekend errand. How to sequence an office move so your team logs in on Monday like nothing happened.',
    category: 'Business',
    author: AUTHOR,
    date: '2026-06-30T09:00:00.000Z',
    readMins: 6,
    cover: '/images/hero/office.jpg',
    coverAlt: 'An office set up after a smooth relocation',
    tags: ['office shifting', 'business', 'planning'],
    body: `
<p class="lead">A home move disrupts a family for a day. A botched office move can cost a company a week of productivity. The difference between the two outcomes is sequencing.</p>

<h2>Start with a survey and a runbook</h2>
<p>Walk both sites early. Map assets, access, lift windows and the order in which departments move. The output is a runbook — floor by floor, with timings and named responsibilities — not a vague plan.</p>

<h2>Move around your no-entry windows</h2>
<p>The best office moves happen after hours or over a weekend, planned around building rules and lift bookings, so the team returns to a working space rather than a work site.</p>

<h2>Treat IT as its own workstream</h2>
<ul>
  <li>Label and photograph every workstation and its cabling before disassembly.</li>
  <li>Keep an asset checklist you can audit against on arrival.</li>
  <li>Prioritise reconnecting the network so people can actually log in.</li>
</ul>

<h2>Give every department a sign-off</h2>
<p>Don’t declare the move “done” centrally. Let each team check and sign off its own space — it catches the small misses while the crew is still on site.</p>

<h2>One coordinator, one accountable price</h2>
<p>A single named coordinator should own the project end to end, against a fixed, itemised quote your finance team can approve in advance. That’s exactly how our <a href="/corporate">corporate relocation</a> works — survey, fixed plan, move, sign-off.</p>
`,
  },
];

/**
 * Posts shown on the site: CMS posts (from the manifest) first, then any in-repo
 * fallback whose slug a CMS post hasn't overridden. Once you publish posts in the CMS
 * they take over; the fallbacks keep the blog populated until then.
 */
const cmsPosts: BlogPost[] = manifest().blog ?? [];
const cmsSlugs = new Set(cmsPosts.map((p) => p.slug));
export const POSTS: BlogPost[] = [
  ...cmsPosts,
  ...FALLBACK_POSTS.filter((p) => !cmsSlugs.has(p.slug)),
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Newest first. */
export function sortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Featured post, else the newest. */
export function featuredPost(): BlogPost {
  return POSTS.find((p) => p.featured) ?? sortedPosts()[0]!;
}

/** Up to `n` posts related to `slug` (same category first, then newest). */
export function relatedPosts(slug: string, n = 3): BlogPost[] {
  const current = getPost(slug);
  const others = sortedPosts().filter((p) => p.slug !== slug);
  if (!current) return others.slice(0, n);
  const sameCat = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);
  return [...sameCat, ...rest].slice(0, n);
}
