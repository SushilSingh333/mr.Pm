# Running the whole thing locally (Windows)

How to run the CMS + database on your machine to add content and see it flow through to
the site — no cloud, no Cloudflare.

## The pieces

- **Database**: your PostgreSQL 17 service on **port 5432** (auto-starts with Windows). The
  project uses a database `mrpackermover` owned by a dedicated `mpm` role. The connection
  string is in [apps/cms/.env](../apps/cms/.env) (gitignored).
- **CMS admin**: Payload/Next on **http://localhost:3000/admin** (the `/` root has no page —
  that 404 is expected; always go to **`/admin`**).
- **Public site**: Astro static build, generated from the manifest.

## Everyday workflow

```powershell
# Postgres auto-starts as a Windows service, so just start the CMS (loads apps/cms/.env):
pnpm --filter @mpm/cms dev
#   → open http://localhost:3000/admin   (first time: create your admin user)
```

The site's `/api/quote` runs inside this same CMS server, so submitting the quote form
creates a lead you'll see under **Leads** in the admin.

## One-time database setup (already done on this machine)

On a fresh machine, create the role + database once (uses your `postgres` superuser
password only here — it never goes into `.env`):

```powershell
$env:PGPASSWORD='<your postgres password>'
psql -h localhost -p 5432 -U postgres -c "CREATE ROLE mpm SUPERUSER LOGIN PASSWORD 'mpm';"
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE mrpackermover OWNER mpm;"
pnpm --filter @mpm/cms seed
```

## Reset / reseed

```powershell
$env:PGPASSWORD='<your postgres password>'
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE mrpackermover; CREATE DATABASE mrpackermover OWNER mpm;"
pnpm --filter @mpm/cms seed
```

The seed is realistic: **Delhi** has enough data (a rate card, ≥10 reviews, a 400+ word
local write-up) to clear the publish gate and produce a full city hub + its services + the
Rohini locality. **Gurgaon / Bengaluru stay thin on purpose** — the gate correctly holds
them back until they have real data. That is the anti-doorway-farm rule working, not a bug.

## Building the public site from your real CMS data

By default the web build uses a rich committed **sample** manifest
(`apps/web/src/data/manifest.sample.json`, 8 cities) so design/CI work without a DB. To
build the site from **your** database instead:

```powershell
pnpm build-manifest              # runs the publish gate → apps/web/src/data/manifest.json
pnpm --filter @mpm/web build     # static site from real data
```

`manifest.json` is gitignored; delete it to fall back to the sample.

## Notes

- In dev, Payload builds the schema straight from the collections (`push`) — no migrations
  and no PostGIS needed locally. Production uses migrations (see
  [deploy-digitalocean.md](./deploy-digitalocean.md)).
- The `mpm` role's password (`mpm`) is a local-only convenience so the superuser password
  stays out of `.env`. Production uses a real secret.
