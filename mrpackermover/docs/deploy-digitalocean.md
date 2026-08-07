# Deploy on a single DigitalOcean droplet + Cloudflare cache

This is the chosen hosting: **everything on one DigitalOcean droplet** — Postgres, the
Payload CMS, and the static site — with **Cloudflare caching the pages in front**. First
visitor to a page pulls it from the droplet once; Cloudflare stores it and serves
everyone after that; when you publish in the CMS, the changed pages rebuild and
Cloudflare is told to refresh.

The reasoning and trade-offs are in [`hosting-astro-ssg-vps-cloudflare.md`](./hosting-astro-ssg-vps-cloudflare.md). This doc is the actual steps.

```
Visitor ──▶ Cloudflare (caches HTML) ──▶ Caddy on the droplet
                                          ├─ /            → static site (apps/web/dist)
                                          └─ /admin,/api  → Payload/Next (:3000) → Postgres
```

---

## 0. What you need

- A DigitalOcean droplet — **Ubuntu 24.04, 4 GB / 2 vCPU** ($24/mo) is comfortable (Payload + local Postgres + the build). A 2 GB box works if Postgres is managed and builds run in CI.
- A domain, with its DNS on **Cloudflare** (free plan is enough).
- SSH access to the droplet.

## 1. Create the droplet & base packages

```bash
ssh root@YOUR_DROPLET_IP
adduser mpm && usermod -aG sudo mpm     # a non-root user to run things
# Node 22 + pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git postgresql postgresql-16-postgis-3 caddy
corepack enable                          # provides pnpm
```

## 2. Postgres (on the droplet)

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE mrpackermover;
CREATE USER mpm WITH PASSWORD 'CHANGE_ME_STRONG';
GRANT ALL PRIVILEGES ON DATABASE mrpackermover TO mpm;
\c mrpackermover
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO mpm;
SQL
```

Your connection string (keep it on the box, never commit it):
`postgres://mpm:CHANGE_ME_STRONG@localhost:5432/mrpackermover`

> Prefer not to manage the DB yourself? Create a **DigitalOcean Managed Postgres** (PostGIS supported), and use its connection string instead. Everything else is identical.

## 3. Get the code & configure

```bash
sudo mkdir -p /srv/mrpackermover && sudo chown mpm:mpm /srv/mrpackermover
git clone YOUR_REPO /srv/mrpackermover && cd /srv/mrpackermover
pnpm install
```

Create `apps/cms/.env`:

```ini
DATABASE_URL=postgres://mpm:CHANGE_ME_STRONG@localhost:5432/mrpackermover
PAYLOAD_SECRET=run `openssl rand -base64 32` and paste here
# Optional until you turn on the spam guard / build automation:
TURNSTILE_SECRET_KEY=
BUILD_WEBHOOK_URL=
BUILD_TRIGGER_TOKEN=
# For the cache purge (step 7):
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

Also set `PUBLIC_SITE_URL=https://yourdomain.com` for the web build (in the environment
or `apps/web/.env`) so canonicals and sitemaps use the real origin.

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

Payload is now on `localhost:3000`. Create your first admin user at `/admin` (through
Caddy, next step) or via `pnpm --filter @mpm/cms payload create-first-user`.

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

1. Point the domain's DNS at the droplet (an **A record** to the droplet IP), **proxied** (orange cloud). For the origin lock, prefer a **`cloudflared` Tunnel** so the droplet has no open public ports.
2. **Cache Rule** (Rules → Caching): _If_ URI path does **not** start with `/api/` **and** does **not** start with `/admin` → **Cache eligibility: Eligible for cache**, **Edge TTL: respect origin** (our Caddy `s-maxage` drives it). This is what makes Cloudflare hold the HTML.
3. Turn on **Always Online** and keep **Tiered Cache** on.
4. Create an API token with **Zone → Cache Purge** for this zone; put it + the Zone ID into `apps/cms/.env` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`).

## 8. The publish → live cycle

When an editor publishes in the CMS:

1. Payload's `afterChange` hook fires and (debounced 10 min) POSTs to `BUILD_WEBHOOK_URL`.
2. That triggers **`deploy/deploy.sh`**: rebuild the manifest through the publish gate → rebuild the static site → copy into the web root → **`scripts/purge-cache.mjs`** tells Cloudflare to drop the old copies.
3. The next visitor gets the fresh page, which Cloudflare then caches again.

Simplest wiring: point `BUILD_WEBHOOK_URL` at a tiny listener on the droplet that runs
`deploy/deploy.sh`. To run it by hand any time: `bash deploy/deploy.sh`.

> **Cache purge & your Cloudflare plan:** by-tag and by-prefix purge are Enterprise-only.
> On Free/Pro, `purge-cache.mjs` purges **everything** by default (fine for a site that
> publishes in batches — `stale-while-revalidate` covers the brief cold window), or you can
> pass it the specific changed URLs: `node scripts/purge-cache.mjs https://site/a https://site/b`.

---

## Moving the database later (Neon → DO, or DO → managed)

Standard Postgres, so it's a copy job — no app changes (§12 of the plan / the runbook):

```bash
pg_dump "$OLD_DATABASE_URL" --no-owner --no-privileges -Fc -f mpm.dump
pg_restore --no-owner --no-privileges -d "$NEW_DATABASE_URL" mpm.dump
# update DATABASE_URL in apps/cms/.env, then: sudo systemctl restart mrpackermover-cms
```

## Ops checklist

- **Backups:** if you self-host Postgres, cron a nightly `pg_dump` to DigitalOcean Spaces. (Managed Postgres does this for you.)
- **Firewall:** allow only 80/443 (or nothing, if using a Tunnel) + your SSH; bind Postgres to `localhost`.
- **Updates:** `apt upgrade` regularly; restart the CMS service after deploys of the CMS itself.
- **Monitoring:** watch `journalctl -u mrpackermover-cms`, the Caddy logs, and Cloudflare's cache-hit ratio (should be >95%).
