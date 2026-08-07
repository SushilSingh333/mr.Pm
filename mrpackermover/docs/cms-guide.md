# CMS guide — how the site is edited

This is the practical guide to running the site from Payload: where every piece of
content lives, how a new location becomes a live page, where form submissions land,
and what is edited in code rather than the CMS (and why).

The admin lives at the CMS URL (`/admin`). Sign in with a `users` account.

---

## The model in one paragraph

The CMS is the source of truth for **data** — locations, services, rate cards,
reviews, job stats, FAQs — and for the **home page copy**. A build step reads all of
it, runs the **publish gate**, and writes a `manifest.json`; the static site is then
generated from that manifest. So editing in the CMS never touches code, and a page
only goes live when it has enough real data to deserve to (Doc 01 §6). Leads from the
public quote form flow straight back into the CMS.

A handful of **designed pages** (pricing, claims, verify, insurance, corporate,
company/\*) are built in code, not the CMS — see [What lives in code](#what-lives-in-code-and-why).

---

## Collections at a glance

| Collection          | Drives                                                      |
| ------------------- | ----------------------------------------------------------- |
| **Locations**       | City hubs, locality pages, and city×service pages           |
| **Services**        | The 8 service hubs + the service half of city×service pages |
| **Lanes**           | `/routes/{origin}-to-{destination}` pages                   |
| **Rate cards**      | The price tables on city / service / route pages            |
| **Reviews**         | The verified-review blocks (tied to a job ref)              |
| **Jobs stats**      | The "moves completed / on-time %" numbers                   |
| **FAQs**            | Scoped Q&A blocks (global / city / service)                 |
| **Guides**          | `/guides/{slug}` editorial posts                            |
| **People**          | Authors / reviewers credited on guides                      |
| **Content blocks**  | Reusable prose snippets                                     |
| **Leads**           | Quote-form submissions (read-only capture — see below)      |
| **Media**           | Uploaded images                                             |
| **Operating bases** | Internal dispatch only — **never rendered** (ADR-0004)      |

Globals: **Organisation profile** (legal identity in the footer + JSON-LD) and
**Home page content** (the editable home copy).

---

## Add a new location → a new page appears

This is the core workflow. Adding a city or locality is all it takes; the page is
generated on the next build **if** it clears the publish gate.

1. **Locations → Create new.**
   - `name` (e.g. "Jaipur"), `type` = City (or Locality).
   - For a locality, set `parent` to its city.
   - `slug` auto-fills from the name (lowercase, hyphenated). Slugs are permanent —
     renaming one later should create a redirect, not a silent change.
   - Tick **`isServiceable`** — unserviceable locations never publish.
   - Set `lat`/`lng` (used for nearest-neighbour internal links).
   - Write the **`editorialNote`** — a few paragraphs of genuinely local operational
     detail (access, society rules, what's specific here). This is the section that
     the gate requires; a location with no local facts will not publish.
2. **Give it real data.** A city needs, at minimum: a **rate card** (scope = City,
   pointed at this city), some **jobs stats**, and ideally a few **reviews**. Without
   a rate band + local content, the gate holds the page back (by design — this is
   what keeps the site from becoming a doorway farm).
3. **Publish** the location (and its rate card / reviews) — set status to Published,
   not Draft.
4. **Rebuild.** In production the `afterChange` hook debounces and triggers a build
   automatically. To do it by hand:
   ```bash
   pnpm build-manifest      # runs the gate, writes manifest.json
   pnpm --filter @mpm/web build
   ```
   The new `/packers-and-movers/{city}` (and its `{city}/{service}` and locality
   pages) now exist, are in the correct sitemap shard, and are cross-linked.

**If the page didn't appear:** it didn't clear the gate. The usual cause is no rate
card, no jobs stats, or a too-thin `editorialNote`. Add the missing data and rebuild.

---

## Where the leads go (the quote form)

Every submission of the public quote form is written to the **Leads** collection, so
the ops team sees them in the same admin — no separate inbox.

- **Leads → list** shows name, phone, service, pickup, status, and time.
- Each lead has a **status pipeline**: New → Contacted → Quoted → Won / Lost. New
  leads arrive as **New**.
- **Assign** a lead to a user and add internal **notes**.
- `sourceIp` and `sourcePage` are captured automatically (read-only) so you know
  which page produced the lead.

Leads are **create-only from the public site** (the form can submit; it can't read or
edit anything). Only signed-in staff can read, assign, and progress them.

> Technical note: the form posts to the `/quote` edge function, which writes straight
> to Postgres (via Hyperdrive) into the same `leads` table this collection owns — so
> capture keeps working even if the admin app is momentarily down, and the rows still
> show up here.

---

## Edit the home page

**Globals → Home page content.** Every field has a sensible built-in default, so a
blank field falls back to the current copy — you only override what you want to change.

- **Hero** — the two tagline lines ("Shifting Aapki," / "Zimmedari Hamari.") and an
  optional sub-line under them.
- **Section headings** — the heading + intro for each home section (What we move,
  the trust section, By the numbers, Cities, FAQ).
- **Trust pillars** — the "why us" cards. Leave empty to keep the built-in four. To
  customise, add pillars and set each one's **variant**, which places it in the
  layout:
  - **Lead** — the wide top-left card (use for your single strongest point).
  - **Dark** — the tall dark accent card (good for the claims-data differentiator);
    it can carry an optional **link** (e.g. label "See our claims data" → `/claims`).
  - **Default** — a normal supporting card.
  - A good set is **one Lead + one Dark + two Default** — that reproduces the bento.

The home FAQ block is driven by **FAQs with scope = Global**, so add/edit those in the
FAQs collection.

Changing the home global rebuilds the `core` sitemap shard (which the home lives in).

---

## What lives in code (and why)

These pages are hand-built templates, not CMS entries, because their layout is bespoke
(feature grids, step flows, stat callouts) rather than generic prose — putting them
behind a rich-text field would flatten the design:

- Trust cluster: `/pricing`, `/claims`, `/verify`, `/insurance`, `/protection`,
  `/fraud-check`, `/raise-a-complaint`
- Company: `/company/about`, `/careers`, `/contact`, `/licences`
- `/corporate`, `/get-quote`, `/track`, `/terms`, `/privacy`

They still render **data** from the CMS (org profile, rate cards, etc.) where relevant.
If you later want the prose on one of these editable in the CMS, that's a small,
scoped addition — ask a developer to wire that specific page to a content block.

---

## The publish flow, end to end

```
Edit in CMS (Draft → Published)
      │  afterChange hook (debounced 10 min)
      ▼
pnpm build-manifest   ── publish gate scores every candidate ──▶ manifest.json
      ▼                    (fails → 301 to parent, no URL minted)
pnpm --filter @mpm/web build   ── Astro reads the manifest ──▶ static HTML + sitemaps
      ▼
pnpm check            ── 7 CI gates (canonical/sitemap parity, ≥3 inbound links,
                         duplication ceiling, no catch-all, status codes, no banned
                         schema entities) ──▶ deploy only if green
```

The manifest is the single source of truth: the route table, every sitemap, and the
internal-link graph all derive from it, so they can't drift.
