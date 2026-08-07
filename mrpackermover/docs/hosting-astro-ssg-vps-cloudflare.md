# Astro SSG on a single VPS + aggressive Cloudflare cache

**Setup:** Astro builds static HTML → served by Nginx/Caddy on one VPS (alongside the CMS + Postgres) → Cloudflare caches full pages at the edge in front.

The key insight: because it's **SSG** and Cloudflare **hard-caches the HTML**, the edge serves ~all traffic and the origin is barely touched — which erases most of a VPS's usual downsides.

---

## TL;DR — the one real issue

Keeping the **edge cache in sync with content**, and protecting a **single small origin**:

- **Cache invalidation.** Every content edit must trigger: rebuild the changed static pages → deploy → **purge exactly those URLs on Cloudflare**. Get it wrong and visitors see stale content (or you over-purge and hammer the origin).
- **Single origin.** One box is a single point of failure and can be overwhelmed on a cold cache or during a big build — so builds should run in **CI (not on the serving box)**, and you own all the ops (patching, backups, monitoring).

Everything else (speed, cost, resilience) is a win — those two are the parts you have to engineer carefully.

---

## ✅ Pros

- **The edge does the work.** Cached HTML is served from Cloudflare's global POPs → fast TTFB worldwide, while the VPS sees almost no request volume.
- **Origin can be tiny and cheap.** Since Cloudflare absorbs traffic, a $6–12/mo droplet serving static files handles a large audience. Flat, predictable cost.
- **Near-zero-downtime & resilient.** With a warm cache (+ _stale-while-revalidate_ / "Always Online"), reboots, deploys and patching are invisible to visitors.
- **Bandwidth savings.** Cloudflare serves cached assets, so the droplet's (metered) egress stays minimal.
- **Security handled for free.** TLS, WAF and DDoS absorption happen at the edge; lock the origin firewall to Cloudflare IPs (or use a Tunnel) so nobody hits the box directly.
- **Full control of the content stack.** CMS + Postgres/**PostGIS** + the build run as normal Node/DB processes — no edge-runtime constraints, any extension, any cron.
- **Clean static/dynamic split.** Hard-cache the static pages; bypass cache for the few dynamic routes (quote/track/search, admin).
- **Portable, low lock-in.** One origin you own; easy to move providers.

## ⚠️ Cons & gotchas

- **Cache invalidation is the real work.** Publish → rebuild affected pages → deploy → **purge those URLs**. Use per-URL or cache-tag purge — never "purge everything."
- **Cold-cache thundering herd.** Right after a full purge/deploy, a burst of misses hits the small origin at once. Mitigate with selective purge, stale-while-revalidate, tiered cache, and pre-warming key URLs.
- **Origin is the SPOF for misses + dynamic.** Cached pages survive downtime, but uncached URLs, first-time hits, and the quote form/admin fail if the droplet is down. A big SSG site won't have every URL warm.
- **You own ops.** OS patching, Nginx/Caddy, origin TLS, **Postgres backups**, monitoring, uptime. Consider managed Postgres to offload DB HA/backups.
- **Build vs. serve contention.** A full SSG build (manifest + thousands of pages) is CPU/RAM heavy; running it on the same box as the origin + Postgres degrades live serving. **Build in CI or a separate box.**
- **Cloudflare config is fiddly.** CF does **not** cache HTML by default — add a Cache Rule (`Cache Everything` + edge TTL), set correct `Cache-Control`, and **carefully exclude** dynamic/cookie'd routes (`/quote`, `/track`, `/admin`). Easy to accidentally cache an admin page, or fail to cache at all.
- **Purge isn't instant globally + preview needs a bypass.** Brief stale window after purge (fine for marketing/SEO). Editor "preview before publish" needs an uncached path (bypass cookie/hostname).

## 🏁 Verdict & best practices

For a **content-driven, SSG** site this is an **excellent** fit — edge performance and resilience _and_ a full-control origin for the CMS/DB, at low cost.

Make it solid with:

1. **Selective purge** (per-URL or **cache-tags**) so one edit only invalidates the changed pages.
2. **Stale-while-revalidate / serve-stale-on-error / Always Online** so origin blips never surface.
3. **Build in CI**, deploy to the box via rsync/SSH — keep builds off the serving box.
4. **Bind Postgres to localhost**, firewall the origin to Cloudflare IPs, keep `/admin` off the cached path.
5. **Size for the build + Postgres, not for traffic** (Cloudflare handles traffic). ≥2 vCPU / 4 GB if the build runs there.

> Note for this project: the runbook already models **cache-tags + sharded sitemaps + "purge only the changed shard"** — exactly the invalidation discipline this architecture needs. The main change from the all-Cloudflare ADR is just _where the origin lives_ (a VPS vs. Pages/Workers); the caching strategy stays the same.

---

## DigitalOcean — the concrete build (chosen origin)

**Why this is a good fit here (unbiased):** it's arguably _simpler and more robust_ than all-Cloudflare for one specific reason — Payload runs on its **native Node runtime**, not OpenNext-on-Workers (the fragile part of the all-CF path). ADR-0004's documented "Node-host fallback" becomes the primary. The site is SSG, so Cloudflare absorbs public traffic and the droplet stays lightly loaded. The trade you accept is owning OS patching + backups.

**Components (one droplet, or droplet + managed DB):**

- **Caddy** (automatic TLS) as reverse proxy: serves the static `apps/web/dist`, and proxies `/admin` + the dynamic routes to the Node app.
- **Payload CMS (Node)** under systemd or pm2 — native runtime, no Workers/OpenNext.
- **Postgres + PostGIS** — on the droplet, or DO Managed Postgres.
- **Dynamic endpoints** `/quote`, `/search`, `/track` — served by the **Node app**, hitting Postgres via the standard `DATABASE_URL`. **No Hyperdrive** (that's a Workers-only connection shim); the DB is local/adjacent.

**Droplet sizing** (build runs in CI, not on the box):

- Payload + serve static + reverse proxy only → **2 GB / 1–2 vCPU (~$12–18/mo)** is enough.
- If you self-host Postgres and/or build on the box → **4 GB / 2 vCPU (~$24/mo)**.

**Postgres — two options:**

- **DO Managed Postgres** (~$15/mo): automated backups, failover, and PostGIS is supported. Least ops — recommended unless cost is critical.
- **Self-hosted on the droplet**: cheapest; bind to `localhost`, but you own `pg_dump` backups (cron → DO Spaces) and restore drills.

Either way it's standard Postgres, so moving **Neon → DigitalOcean** is exactly the `pg_dump → restore → repoint DATABASE_URL` portability drill the project already planned (§12) — no app-code changes beyond the connection string.

**Cloudflare (cache-only, no Workers):**

- Cache Rule: `Cache Everything` + edge TTL on HTML, keyed by cache-tag; **bypass** `/admin*`, `/quote`, `/search`, `/track`.
- `stale-while-revalidate` + Always Online so origin blips never surface.
- Lock the origin: a **`cloudflared` Tunnel** (no public IP, no open inbound ports — cleanest) or firewall the droplet to Cloudflare's IP ranges.

**Deploy flow (same discipline as the ADR):** GitHub Actions builds the manifest + static site, rsyncs `dist/` to the droplet, restarts Payload only if it changed. Payload `afterChange` → debounced CI trigger → rebuild the changed shard → **purge that cache-tag**. (Already modeled by the runbook + `triggerBuildForShard`/`triggerBuildOnChange`.)

**⚠️ The one code change this requires:** the three endpoints in `apps/web/functions/*` are **Cloudflare Pages Functions** using `env.HYPERDRIVE`. On a pure DigitalOcean origin they move to the **Node app** (Payload custom endpoints) and use `DATABASE_URL` directly. It's small and mechanical — the SQL is already standard Postgres — but it's a required change, because with no Workers there is nothing to run those functions at the edge.
