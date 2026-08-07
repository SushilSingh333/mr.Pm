# Deploy on DigitalOcean + Cloudflare cache

The chosen hosting: an **app droplet** on DigitalOcean running the Payload CMS and serving
the static site, a **DigitalOcean Managed Postgres** database, and **Cloudflare caching the
pages in front**. First visitor to a page pulls it from the droplet once; Cloudflare stores
it and serves everyone after that; when you publish in the CMS, the changed pages rebuild and
Cloudflare is told to refresh.

The reasoning and trade-offs are in [`hosting-astro-ssg-vps-cloudflare.md`](./hosting-astro-ssg-vps-cloudflare.md). This doc is the actual steps.

```
Visitor ──▶ Cloudflare (caches HTML) ──▶ Caddy on the droplet
                                          ├─ /            → static site (apps/web/dist)
                                          └─ /admin,/api  → Payload/Next (:3000)
                                                                │
                                                                ▼
                                                   DO Managed Postgres (+PostGIS)
```

This is the **launch topology** (one app droplet). When you want high availability, put a
**DigitalOcean Load Balancer** in front of 2+ app droplets — see
[Scaling to a Load Balancer](#scaling-to-a-load-balancer-ha-later). It needs **no code
changes** (the app is static + a stateless API + a portable `DATABASE_URL`).

---

## 0. What you need

- A **DigitalOcean Managed PostgreSQL** cluster (PostGIS supported) — automated backups,
  failover and patching you don't want to hand-run. (Or self-host on the droplet — see §2.)
- A DigitalOcean droplet — **Ubuntu 24.04, 2 GB / 1–2 vCPU** ($12/mo) is enough with Managed
  Postgres (bump to 4 GB if you also build on the box or self-host the DB).
- A domain, with its DNS on **Cloudflare** (free plan is enough).
- SSH access to the droplet.

## 1. Create the droplet & base packages

```bash
ssh root@YOUR_DROPLET_IP
adduser mpm && usermod -aG sudo mpm     # a non-root user to run things
# Node 22 + pnpm + Caddy (Postgres is managed — see §2)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git caddy postgresql-client-16
corepack enable                          # provides pnpm
```

## 2. Database — DigitalOcean Managed Postgres (recommended)

Create a **DigitalOcean Managed PostgreSQL** cluster in the **same region** as the droplet.

1. DigitalOcean → **Databases → Create → PostgreSQL**.
2. When it's up, add a database `mrpackermover` and enable PostGIS (run from the droplet,
   using the cluster's connection string):
   ```bash
   psql "$DATABASE_URL" -c 'CREATE DATABASE mrpackermover;'   # if not created in the UI
   psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS postgis;'
   ```
3. In the cluster's **Trusted sources**, add the droplet (and, if using a Load Balancer
   later, each app droplet) so only they can connect.
4. Copy the cluster's connection string — it's your `DATABASE_URL`; keep the `?sslmode=require`
   it ships with, and never commit it.

Managed Postgres runs the nightly backups, point-in-time restore and failover for you.

<details>
<summary>Alternative: run Postgres on the droplet (cheaper, but you manage it)</summary>

```bash
apt-get install -y postgresql postgresql-16-postgis-3
sudo -u postgres psql <<'SQL'
CREATE DATABASE mrpackermover;
CREATE USER mpm WITH PASSWORD 'CHANGE_ME_STRONG';
GRANT ALL PRIVILEGES ON DATABASE mrpackermover TO mpm;
\c mrpackermover
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO mpm;
SQL
```

Connection string: `postgres://mpm:CHANGE_ME_STRONG@localhost:5432/mrpackermover`.
If you self-host, **you** own the backups — see the Ops checklist.
</details>

## 3. Get the code & configure

```bash
sudo mkdir -p /srv/mrpackermover && sudo chown mpm:mpm /srv/mrpackermover
git clone YOUR_REPO /srv/mrpackermover && cd /srv/mrpackermover
pnpm install
```

Create `apps/cms/.env`:

```ini
# Managed Postgres connection string (keep the ?sslmode=require):
DATABASE_URL=postgres://USER:PASS@db-host.ondigitalocean.com:25060/mrpackermover?sslmode=require
PAYLOAD_SECRET=run `openssl rand -base64 32` and paste here
# Location autocomplete + geocoding in the admin (optional):
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
# Optional until you turn on the spam guard / build automation:
TURNSTILE_SECRET_KEY=
BUILD_WEBHOOK_URL=
BUILD_TRIGGER_TOKEN=
# For the cache purge (step 7):
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

Also set `PUBLIC_SITE_URL=https://yourdomain.com` for the web build (in the environment or
`apps/web/.env`, alongside `PUBLIC_GOOGLE_MAPS_API_KEY` for the quote estimator) so canonicals
and sitemaps use the real origin.

## 4. Database schema + seed

```bash
pnpm --filter @mpm/cms migrate:create initial_schema   # generate the base tables (incl. leads)
pnpm --filter @mpm/cms migrate                          # apply schema + PostGIS
pnpm seed                                               # Phase-0 demo data (incl. home content)
```

## 5. Run the CMS as a service

```bash
pnpm --filter @mpm/cms build                            # next build
sudo cp deploy/mrpackermover-cms.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mrpackermover-cms
journalctl -u mrpackermover-cms -f                      # watch it boot; Ctrl-C to stop tailing
```

Payload is now on `localhost:3000`. Create your first admin user at `/admin` (through Caddy,
next step) or via `pnpm --filter @mpm/cms payload create-first-user`.

## 6. Build the site & put Caddy in front

```bash
bash deploy/deploy.sh          # builds manifest + site → /var/www/mrpackermover, then purge (skips if no CF token yet)
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
echo 'SITE_DOMAIN=yourdomain.com' | sudo tee /etc/caddy/caddy.env
# make caddy load that env (systemd drop-in), then:
sudo systemctl restart caddy
```

At this point the droplet serves the site over HTTPS, `/admin` and `/api/*` go to Payload,
everything else is the static site.

## 7. Cloudflare in front (the caching)

1. Point the domain's DNS at the droplet (an **A record** to the droplet IP), **proxied**
   (orange cloud). For the origin lock, prefer a **`cloudflared` Tunnel** so the droplet has
   no open public ports.
2. **Cache Rule** (Rules → Caching): _If_ URI path does **not** start with `/api/` **and**
   does **not** start with `/admin` → **Cache eligibility: Eligible for cache**, **Edge TTL:
   respect origin** (our Caddy `s-maxage` drives it). This is what makes Cloudflare hold the HTML.
3. Turn on **Always Online** and keep **Tiered Cache** on. Enable **Brotli**, **HTTP/3** and
   **image resizing** here too. Use the **WAF managed ruleset**, but **not** "Bot Fight Mode"
   (it would block `/api/*` and retrieval AI crawlers).
4. Create an API token with **Zone → Cache Purge** for this zone; put it + the Zone ID into
   `apps/cms/.env` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`).

## 8. The publish → live cycle

When an editor publishes in the CMS:

1. Payload's `afterChange` hook fires and (debounced 10 min) POSTs to `BUILD_WEBHOOK_URL`.
2. That triggers **`deploy/deploy.sh`**: rebuild the manifest through the publish gate →
   rebuild the static site → copy into the web root → **`scripts/purge-cache.mjs`** tells
   Cloudflare to drop the old copies.
3. The next visitor gets the fresh page, which Cloudflare then caches again.

Simplest wiring: point `BUILD_WEBHOOK_URL` at a tiny listener on the droplet that runs
`deploy/deploy.sh`. To run it by hand any time: `bash deploy/deploy.sh`.

> **Cache purge & your Cloudflare plan:** by-tag and by-prefix purge are Enterprise-only.
> On Free/Pro, `purge-cache.mjs` purges **everything** by default (fine for a site that
> publishes in batches — `stale-while-revalidate` covers the brief cold window), or you can
> pass it the specific changed URLs: `node scripts/purge-cache.mjs https://site/a https://site/b`.

---

## Scaling to a Load Balancer (HA) later

The launch setup is one droplet. Because Cloudflare serves ~all page views from cache, one
droplet handles a lot — but when you want **high availability** (no single point of failure,
zero-downtime deploys), put a **DigitalOcean Load Balancer** in front of **2+ identical app
droplets**, all pointing at the same Managed Postgres:

```
Cloudflare ──▶ DO Load Balancer ──▶ app droplet #1  (Caddy static + Payload) ─┐
              (health check         app droplet #2  (Caddy static + Payload) ─┼──▶ Managed Postgres
               GET / )                    …                                   ─┘
```

**Nothing in the app changes** — it's already static + a stateless API + a portable
`DATABASE_URL`. What you stand up:

1. **Managed Postgres** (already the default in §2) — the shared DB every droplet uses; add
   each app droplet to its Trusted sources.
2. **N identical app droplets** — each runs Caddy (serving its own copy of `apps/web/dist`)
   plus the Payload service, from the same commit and the same `.env` (secrets stay per-box
   or in a secrets manager).
3. **A DO Load Balancer** in front, forwarding 443 → the droplets with a **health check**
   (e.g. `GET /`, the static homepage). Point Cloudflare's A record at the **Load Balancer**
   IP instead of a single droplet.

**The one real wrinkle — distributing the static site.** With multiple droplets, a publish
must rebuild `apps/web/dist` on **every** droplet, not one. Pick one approach:

- **Build in CI, rsync to all droplets** (simplest, recommended): the publish webhook
  triggers a CI job that builds the manifest + site once and `rsync`s `dist/` to each droplet,
  then purges Cloudflare. Deterministic, and the droplets spend no CPU building.
- **Build once, serve from object storage:** build to **DigitalOcean Spaces** (or R2) and
  serve the static site from there; the droplets then only run Payload.
- **One "builder" droplet + shared volume:** a DO Volume the builder writes `dist/` to and
  the app droplets mount read-only. Fewer moving parts than CI, but a shared-storage dependency.

**CMS writer.** Several Payload instances can all serve `/admin` + `/api/*` against the one
Managed DB (the API is stateless). Keep the **publish → build** trigger pointed at a single
place (the CI job or the builder droplet) so a publish rebuilds the site **once**, not N times.

Everything else — the Cloudflare config, the publish→live cycle, the cache purge — is unchanged.

---

## Moving the database later (self-hosted → Managed, or region → region)

Standard Postgres, so it's a copy job — no app changes (§12 of the plan / the runbook):

```bash
pg_dump "$OLD_DATABASE_URL" --no-owner --no-privileges -Fc -f mpm.dump
pg_restore --no-owner --no-privileges -d "$NEW_DATABASE_URL" mpm.dump
# update DATABASE_URL in apps/cms/.env, then: sudo systemctl restart mrpackermover-cms
```

## Ops checklist

- **Backups:** Managed Postgres runs nightly backups + point-in-time restore for you. (If you
  self-host instead, cron a nightly `pg_dump` to DigitalOcean Spaces.)
- **Firewall:** allow only 80/443 (or nothing, if using a Tunnel) + your SSH. Managed Postgres
  is reached over its private network / Trusted sources, not a public port.
- **Updates:** `apt upgrade` regularly; restart the CMS service after deploys of the CMS itself.
- **Monitoring:** watch `journalctl -u mrpackermover-cms`, the Caddy logs, and Cloudflare's
  cache-hit ratio (should be >95%). With a Load Balancer, watch its health-check status too.
