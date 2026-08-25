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

> **The pnpm project is nested one level inside the repository.** The clone gives you
> `repo/`, and the workspace with `package.json` lives at `repo/mrpackermover/`. Every
> `pnpm` command, `deploy/…` path and systemd `WorkingDirectory` refers to that inner
> directory, **not** the clone root. Getting this wrong is the single most common cause
> of a failed deploy here.

```bash
sudo mkdir -p /srv/mrpackermover && sudo chown mpm:mpm /srv/mrpackermover

# Clone into repo/, then step into the nested workspace.
git clone YOUR_REPO /srv/mrpackermover/repo
cd /srv/mrpackermover/repo/mrpackermover     # ← package.json lives here

pnpm install
```

Resulting layout:

```
/srv/mrpackermover/repo                  # git clone (repo root — no package.json)
/srv/mrpackermover/repo/mrpackermover    # pnpm workspace  ← all commands run here
/srv/mrpackermover/repo/mrpackermover/apps/cms/.env
/var/www/mrpackermover                   # what Caddy serves (rsync target)
```

Create `apps/cms/.env`:

```ini
# Managed Postgres connection string (keep the ?sslmode=require):
DATABASE_URL=postgres://USER:PASS@db-host.ondigitalocean.com:25060/mrpackermover?sslmode=require
PAYLOAD_SECRET=run `openssl rand -base64 32` and paste here
# ── Google Maps: THREE different variables, not interchangeable ──
# Public site (Astro): Places suggestions on the address fields + Distance Matrix.
#   `deploy.sh` sources this file before the web build, so setting it here is enough —
#   no separate apps/web/.env is needed on the droplet. Restrict by HTTP referrer to
#   the real domain; the value is inlined into the public JS at BUILD time, so adding
#   it later needs a rebuild, not just a restart.
PUBLIC_GOOGLE_MAPS_API_KEY=
# CMS server: geocoding, auto-fills a city's lat/lng (optional):
GOOGLE_MAPS_API_KEY=
# CMS admin browser: the address field inside /admin (optional):
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
# Optional until you turn on the spam guard / build automation:
TURNSTILE_SECRET_KEY=
BUILD_WEBHOOK_URL=
BUILD_TRIGGER_TOKEN=
# For the cache purge (step 7):
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
# Media storage on Cloudinary (signed uploads). Set all three to store CMS uploads —
# incl. a city's Hero image — on Cloudinary's CDN; leave blank to use local disk.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**`PUBLIC_SITE_URL` belongs in `apps/cms/.env`, not `apps/web/.env`.** Canonicals, sitemaps,
robots.txt and JSON-LD are all read from `manifest().siteOrigin`
([`apps/web/src/lib/page.ts`](../apps/web/src/lib/page.ts)) — never from Astro's `site`
config. That origin is baked into the manifest by `pnpm build-manifest`, which runs on the
CMS side; `deploy/deploy.sh` sources `apps/cms/.env` before calling it. Setting the variable
in `apps/web/.env` has no effect, and the site would ship canonicals pointing at localhost.

**On the droplet, `apps/cms/.env` is the only env file you need — do not create
`apps/web/.env` there.** `deploy/deploy.sh` runs `set -a` and sources `apps/cms/.env`
before building, so every variable in it is exported into the environment the Astro build
runs in, `PUBLIC_*` included. Splitting them across two files is how the browser key ends
up set in one place and read from the other.

`apps/web/.env` exists for **local development only**, where you run the web app without
`deploy.sh`.

Every `PUBLIC_*` value is inlined into the public JavaScript at **build** time, so adding
or changing one requires a rebuild — restarting the service is not enough. And because
those values ship to the browser by design, an HTTP-referrer restriction on the Maps key
is the only thing protecting your quota: it must allow the real domain, not just
localhost, or production's own requests get rejected.

## 4. Database schema + seed

```bash
pnpm --filter @mpm/cms migrate:create initial_schema   # generate the base tables (incl. leads)
pnpm --filter @mpm/cms migrate                          # apply schema + PostGIS
pnpm seed                                               # Phase-0 demo data (incl. home content)
```

`migrate:create` automatically runs `scripts/fix-migration.mjs`, which repairs two things
the Payload generator gets wrong for this project:

- it emits a **value** import for `MigrateUpArgs` / `MigrateDownArgs`, which throws at
  runtime on Payload 3.87 — they are rewritten to `import type`, with `sql` kept as a
  separate value import;
- it regenerates `migrations/index.ts`, whose order can put the committed `0001_postgis`
  migration **before** the base schema. `0001_postgis` runs `ALTER TABLE locations`, so
  that ordering fails on a fresh database. The script refuses to continue (exit 1) and
  tells you to move `0001_postgis` last.

## 5. Run the CMS as a service

```bash
bash deploy/build-cms.sh                # typechecks, then builds; keeps the old build on failure
sudo bash deploy/install-units.sh       # writes the units with THIS clone's real paths
sudo systemctl daemon-reload
sudo systemctl enable --now mrpackermover-cms
journalctl -u mrpackermover-cms -f      # watch it boot; Ctrl-C to stop tailing
```

Use `deploy/build-cms.sh` rather than a bare `pnpm --filter @mpm/cms build`. `next build`
deletes `.next` _before_ it compiles, so a failing build leaves the droplet with no build
output and systemd crash-loops the admin panel — a bad commit becomes an outage. The
wrapper typechecks first, moves the working build aside, and restores it if the build
fails, exiting non-zero so you don't restart onto a broken build.

`install-units.sh` exists because systemd requires absolute paths, and the committed units
have to hardcode them. It derives the real paths from its own location, so it is correct
no matter where the repo is cloned. Plain `sudo cp` of the `.service` files only works if
your layout is exactly `/srv/mrpackermover/repo/mrpackermover`.

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

## 8. The publish → live cycle (auto-deploy)

Wire this **once** and CMS publishes go live on their own — editors never touch a terminal.

**a. Set the shared secret + webhook** in `apps/cms/.env`:

```ini
BUILD_TRIGGER_TOKEN=run `openssl rand -base64 32` and paste here
BUILD_WEBHOOK_URL=http://127.0.0.1:4545/deploy
```

**b. Install the deploy listener** — a tiny localhost-only service that runs `deploy/deploy.sh`
when the CMS calls it (token-checked; builds never overlap):

```bash
sudo bash deploy/install-units.sh              # installs both units with this clone's paths
sudo systemctl daemon-reload
sudo systemctl enable --now mrpackermover-deploy
journalctl -u mrpackermover-deploy -f          # watch builds; Ctrl-C to stop tailing
```

**c. Restart the CMS** so it picks up the new env:

```bash
sudo systemctl restart mrpackermover-cms
```

Now the flow, with no manual steps:

1. An editor publishes/unpublishes → Payload's `afterChange` hook fires, **debounced ~10 min**
   (forty edits ⇒ one build), and POSTs to the listener with the shared token.
2. The listener runs **`deploy/deploy.sh`**: rebuild the manifest (publish gate) → build the
   static site → rsync into the web root → **purge Cloudflare** (`scripts/purge-cache.mjs`).
   Triggers that arrive during a build coalesce into exactly one follow-up build.
3. The next visitor gets the fresh page, which Cloudflare then caches again.

**Publish immediately** (skip the ~10-min debounce), or if you haven't wired the listener yet:
just run `bash deploy/deploy.sh`. Check the listener is alive with `curl localhost:4545/health`.

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
