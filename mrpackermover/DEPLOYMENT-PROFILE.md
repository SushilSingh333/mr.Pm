# DEPLOYMENT-PROFILE.md

Generated from a read of the actual repo files (package.json / lockfile / turbo.json / configs / `deploy/*` / `.github/workflows/*` / `.env.example` / Payload config / migrations). Claims are cited as `path:line`. Anything not derivable is marked **UNKNOWN — needs confirmation**.

---

## 1. Project Identity

- **Name / purpose:** `mrpackermover` — data-backed packers & movers SEO site for India: a static Astro public site driven by a Payload CMS + Postgres, with a build-manifest publish gate. (`package.json:2,5`)
- **Primary language / version:** TypeScript (`typescript ^5.7.3`, `package.json:36`) on **Node.js ≥ 22** (`package.json:9`, `.nvmrc` = `22`).
- **Frameworks:**
  - Web: **Astro `^5.1.5`** (SSG) + **Preact `^10.25.4`** islands + Tailwind `^4.0.0`. (`apps/web/package.json:19,21,27`)
  - CMS: **Payload `^3.37.0`** inside **Next.js `^15.1.6`** (React `^19`). (`apps/cms/package.json:28,29,30`)
- **Package manager / lockfile:** **pnpm `11.11.0`** (`package.json:7`); **`pnpm-lock.yaml` present — yes**.
- **Monorepo?** **Yes** — pnpm + Turborepo. Workspaces (`pnpm-workspace.yaml`): `apps/*`, `packages/*`:
  - `apps/web` (`@mpm/web`), `apps/cms` (`@mpm/cms`)
  - `packages/`: `@mpm/config`, `@mpm/db`, `@mpm/seo`, `@mpm/shared`, `@mpm/ui-tokens`

---

## 2. Runtime Architecture

Hosting is **one DigitalOcean droplet + Cloudflare cache in front** (ADR-0005; `docs/deploy-digitalocean.md`, `deploy/*`).

| Process                                             | Command                                                                         | Port                 | Persistent?        | Source                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- | ------------------ | ---------------------------------------------------------------------------- |
| **Payload/Next CMS** (admin + `/api/*`)             | `pnpm start` → `next start -p 3000`                                             | **3000** (localhost) | Yes, under systemd | `apps/cms/package.json:9`, `deploy/mrpackermover-cms.service:23`             |
| **Caddy** (reverse proxy + static file server, TLS) | `caddy run` (systemd)                                                           | **80 / 443**         | Yes                | `deploy/Caddyfile:10,16-19,22-35`                                            |
| **PostgreSQL** (if self-hosted)                     | `postgresql.service`                                                            | **5432** (localhost) | Yes                | `docs/deploy-digitalocean.md:32,50`; `service:11` `After=postgresql.service` |
| Static public site                                  | _no process_ — files served by Caddy from `/var/www/mrpackermover`              | —                    | No                 | `Caddyfile:23`, `deploy.sh:33`                                               |
| Build/deploy                                        | `bash deploy/deploy.sh` (on webhook or manual) — **not a long-running process** | —                    | No                 | `deploy.sh`, `docs/deploy-digitalocean.md:120-129`                           |

- **SSR / SPA / static / API-only / hybrid:** **Hybrid.** Public pages are **static SSG** (`output: 'static'`, `apps/web/astro.config.ts:17`); the CMS admin + the five JSON endpoints are a **persistent Node SSR/API app** (Payload/Next).
- **Persistent process required?** The public HTML alone can be served as static files. But **`/admin` and `/api/{quote,search,track,apply,contact}` require the persistent Payload/Next process** (`apps/cms/src/endpoints/index.ts:19-25`, `Caddyfile:16-19`). So a persistent process is required for the dynamic surfaces; the marketing pages are not.
- **No** dedicated worker/queue/cron/websocket process exists in the repo. The publish→rebuild loop relies on a webhook listener that runs `deploy.sh` — **that listener is not in the repo** (`docs/deploy-digitalocean.md:128` describes it as "a tiny listener" to wire yourself). **UNKNOWN — needs confirmation.**

---

## 3. Dependencies and Services

- **Database — required.** PostgreSQL with **PostGIS**. Version: **Postgres 16 + PostGIS 3** per the deploy doc (`postgresql-16-postgis-3`, `docs/deploy-digitalocean.md:32`). PostGIS is used for `geo geography(Point,4326)` generated columns + GiST indexes + the `internal_links` table (`apps/cms/migrations/0001_postgis.ts:14-43`).
  - Drivers: **`pg` (node-postgres) `^8.13.1`** for build/script SQL (`packages/db/package.json`, `packages/db/src/index.ts:1,21`); Payload uses **`@payloadcms/db-postgres` `^3.37.0`** with its own pool (`apps/cms/src/payload.config.ts:4,55-59`). Both speak standard Postgres wire protocol (portability is a stated goal).
- **Cache / queue:** **None in-app.** No Redis/RabbitMQ/etc. Cloudflare is an external CDN cache in front; there is no message queue.
- **Object storage:** **None configured.** The `Media` collection uploads with image resizing but **no S3/R2/cloud-storage adapter is present in `payload.config.ts`** (no `plugins`), so originals land on the **droplet's local disk** (Payload default). Exact upload directory is not set (`staticDir` unset) — **UNKNOWN — needs confirmation.** The "served by Cloudflare Images" note (`apps/cms/src/collections/Media.ts:7`) is a comment, not wired.
- **Search:** In-app typeahead over Postgres (`GET /api/search`), no external search engine. (`apps/cms/src/endpoints/index.ts:11`)
- **Third-party APIs called at runtime:**
  - **Cloudflare Turnstile** siteverify — server-side spam check on form posts (`https://challenges.cloudflare.com/turnstile/v0/siteverify`, `apps/cms/src/endpoints/_lib.ts:49`).
  - **Cloudflare API** `purge_cache` — at **deploy time only**, not in the request path (`scripts/purge-cache.mjs:47`).
  - Google Maps: **not referenced in code** (a runtime integration is being planned but no code path exists yet). **UNKNOWN — needs confirmation.**
- **Environment variables** (from `.env.example`, `turbo.json:4-11`, and code):

| Var                             | Where used                                                  | Notes                                                              |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `PUBLIC_SITE_URL`               | `astro.config.ts:5`, `.env.example:8`                       | canonicals/sitemaps                                                |
| `DATABASE_URL`                  | `packages/db/src/env.ts`, `payload.config.ts:56`            | standard Postgres; **local box needs `?sslmode=disable`** (see §8) |
| `PAYLOAD_SECRET`                | `payload.config.ts:50`                                      | 32+ char; empty default errors                                     |
| `TURNSTILE_SECRET_KEY`          | `_lib.ts:42`                                                | if unset, verification is skipped (dev)                            |
| `PUBLIC_TURNSTILE_SITE_KEY`     | `.env.example:27`                                           | client widget key                                                  |
| `CLOUDFLARE_API_TOKEN`          | `purge-cache.mjs:19`                                        | Zone → Cache Purge                                                 |
| `CLOUDFLARE_ZONE_ID`            | `purge-cache.mjs:20`                                        |                                                                    |
| `BUILD_TRIGGER_TOKEN`           | `.env.example:32`                                           | publish→build webhook auth                                         |
| `BUILD_WEBHOOK_URL`             | `.env.example:33`, deploy doc:124                           | target of the afterChange hook                                     |
| `NODE_ENV`                      | `payload.config.ts:57` (`push:false` in prod), `service:19` |                                                                    |
| `CMS_ORIGIN`                    | `astro.config.ts:7`                                         | **dev-only** proxy target, default `http://localhost:3000`         |
| `SITE_DOMAIN`                   | `Caddyfile:10`                                              | Caddy site address                                                 |
| `CF_HYPERDRIVE_ID`              | `turbo.json:8`                                              | **legacy/retired** (Hyperdrive removed); leftover in globalEnv     |
| `DEPLOY_PATH`, `PURGE_REQUIRED` | `deploy.sh:14`, `purge-cache.mjs:25`                        | optional                                                           |

---

## 4. Build Requirements

Two build targets.

- **Web (static site):** `pnpm --filter @mpm/web build` → `astro build`. Output: **`apps/web/dist`** (`astro.config.ts:17`, `deploy.sh:33`).
- **Full deploy build (`deploy/deploy.sh`):** `pnpm build-manifest` (→ `tsx src/scripts/build-manifest.ts`, **queries Postgres**, `apps/cms/package.json:13`) → `astro build` → `rsync dist/` → `node scripts/purge-cache.mjs` (`deploy.sh:26-36`).
- **CMS:** `pnpm --filter @mpm/cms build` → `next build`. Output: **`apps/cms/.next`** (`turbo.json:16`).

**Does the build run on the server?**

- **As implemented, yes — on the droplet.** `deploy-web.yml` SSHes to the droplet and runs `deploy/deploy.sh` there, _"because build-manifest needs the local Postgres"_ (`.github/workflows/deploy-web.yml:3-5,29-34`). `deploy-cms.yml` also builds on the droplet (`deploy-cms.yml:34`).
- **CI does not produce the deploy artefact:** `ci.yml` builds the web app from the **committed sample manifest** (no DB) only to run the HTML gates (`ci.yml:38-44`).
- It _can_ move to CI if Postgres is exposed to the runner (stated in `deploy.sh:5-6`), but that is not the current wiring.

**Peak build RAM (estimated, with reasoning):**

- `astro build` — Vite/esbuild + Tailwind v4, ~100 sample pages (up to ~1,500 real per the build sheet); **no** typecheck in `astro build` (`astro check` is separate); hero images are pre-optimised by `scripts/optimize-hero-images.mjs`, not at build. → **~0.4–1 GB.**
- `next build` (CMS) — Next 15 + webpack + Payload + React 19: the memory-heavy step, **~1–2 GB peak** (can spike higher).
- `build-manifest` — a `tsx` script + one Postgres pass: **~0.3 GB**.
- Running `next build` **and** Postgres **and** serving on one box can exceed 2 GB → the deploy doc recommends **4 GB** (`docs/deploy-digitalocean.md:21`).

**Build duration (estimated):**

- `astro build`, sample scale (~100 pages): seconds. Full ~1,500-page site: **~1–3 min — UNKNOWN, needs measuring.**
- `next build`: **~30 s–2 min — UNKNOWN, needs measuring.**

---

## 5. Resource Estimate

Assumptions: Cloudflare fronts the site and hard-caches HTML, so **the origin serves cache-misses + revalidation + `/api` + `/admin` only** — public traffic barely reaches the box. "Self-hosted PG" = Postgres on the same droplet.

| Row                                        | Minimum | Recommended                 | Notes / assumptions                                                                 |
| ------------------------------------------ | ------- | --------------------------- | ----------------------------------------------------------------------------------- |
| RAM at idle                                | ~400 MB | 512 MB–1 GB                 | Payload/Next idle ~150–300 MB + Caddy ~20–40 MB + Postgres base ~100 MB             |
| RAM under load — low (<1k req/day)         | ~0.5 GB | ~0.7 GB                     | Edge serves pages; origin sees a trickle of form posts                              |
| RAM under load — moderate (10–50k req/day) | ~0.7 GB | ~1 GB                       | Still mostly edge-served; origin load is form posts + cache-miss HTML               |
| RAM peak during build                      | ~1.5 GB | **~2.5–3 GB free**          | `next build` 1–2 GB + Postgres + serve; drops to ~0 if build runs in CI             |
| vCPU                                       | 1       | 2                           | 1 fine to serve; `next build` benefits from 2 cores                                 |
| Disk — source + node_modules               | —       | ~2–3 GB                     | pnpm monorepo w/ Next + Payload + React + Astro + **sharp** native binaries         |
| Disk — build output                        | —       | ~0.2–0.7 GB                 | `apps/web/dist` (HTML + `_astro` + images) + `apps/cms/.next`                       |
| Disk — uploads/media                       | —       | budget ≥ few GB             | Payload media on **local disk**; grows with content — **UNKNOWN volume**            |
| Disk — logs                                | —       | ~0.5 GB rotated             | journald (CMS) + Caddy access logs                                                  |
| Bandwidth pattern                          | —       | low origin, spiky on deploy | Public egress is Cloudflare's; origin egress = cache-fill after each purge + `/api` |

Total disk: **≥ 20 GB** comfortable (the recommended 4 GB droplet ships 80 GB SSD).

---

## 6. Co-hosting Assessment

**Conditional.**

- **Can co-host on a shared 2 GB / 2 vCPU VPS** _only if_: (a) builds run in **CI or a separate box** (not on the serving VPS), (b) Postgres is **managed/off-box** (or a small, tuned local instance), and (c) ports **80/443/3000/5432** are free. The deploy doc says the same: _"A 2 GB box works if Postgres is managed and builds run in CI"_ (`docs/deploy-digitalocean.md:21`).
- **As currently wired (build ON the droplet), it wants its own box.** What breaks when squeezed:
  - **Memory (build spike):** `deploy.sh` runs `next build`/`astro build` on the serving box on every deploy; the 1–2 GB `next build` spike + Postgres + a co-tenant will **OOM on a 2 GB box** (`deploy-web.yml:29-34`, `deploy.sh:26-29`).
  - **CPU contention:** `next build` saturates cores during the build window, starving the co-tenant and the live Payload/Postgres.
  - **Port conflicts:** Payload fixed to **:3000** (`apps/cms/package.json:9`), Caddy owns **:80/:443**, Postgres **:5432** — any co-tenant using those collides.
  - **File locks / IO:** the deploy does `pnpm install --frozen-lockfile` + `rsync --delete` into the web root each deploy; heavy IO during the build hurts neighbours.

---

## 7. Deployment Requirements

- **Process manager:** **systemd.** The CMS runs as `mrpackermover-cms.service` (`Type=simple`, `Restart=always`, `ExecStart=/usr/bin/pnpm start`, `deploy/mrpackermover-cms.service`). Caddy and Postgres are their own systemd services. No PM2/supervisor/Docker in the repo.
- **Reverse proxy:** **Caddy** (`deploy/Caddyfile`):
  - Proxies `@payload path /admin* /api/*` → `localhost:3000` (`Caddyfile:16-19`).
  - Static root `/var/www/mrpackermover`; `try_files {path} {path}.html /404.html` (matches Astro `build.format:'file'`, `Caddyfile:23,33`).
  - Cache headers: HTML `s-maxage=86400, stale-while-revalidate=604800`; hashed assets `max-age=31536000, immutable` (`Caddyfile:27-30`).
  - `encode zstd gzip`; `handle_errors → /404.html` (`Caddyfile:11,37-40`).
  - **Max body size / upload limit:** not set in the Caddyfile — **UNKNOWN — confirm** for CMS media uploads (Payload/Next may impose its own). Websocket upgrade: not required (no websocket server); Caddy proxies it automatically if ever needed. Timeouts: not set.
- **Dedicated Linux user:** **`mpm`** (`service:15`, `docs/deploy-digitalocean.md:29`). Directories: code at **`/srv/mrpackermover`** (owned `mpm:mpm`), web root **`/var/www/mrpackermover`** (Caddy reads), secrets at **`/srv/mrpackermover/apps/cms/.env`** (`service:16,18`, deploy doc:57,62). The deploy user needs passwordless `sudo systemctl restart mrpackermover-cms` (`deploy-cms.yml:8`).
- **Health check endpoint:** **None dedicated found.** Candidates for a liveness probe: `GET /api/track` (returns JSON) or `/admin` (200). **UNKNOWN — needs confirmation / add one.**
- **Migrations / seed on first deploy** (`docs/deploy-digitalocean.md:82-85`):
  ```bash
  pnpm --filter @mpm/cms migrate:create initial_schema   # generate base tables
  pnpm --filter @mpm/cms migrate                          # apply schema + PostGIS (0001)
  pnpm seed                                               # demo data + home content
  ```
  Ongoing CMS deploys run `pnpm --filter @mpm/cms migrate` before build/restart (`deploy-cms.yml:33`).

---

## 8. Risks and Gotchas

- **Local-Postgres TLS mismatch (real, non-obvious).** `packages/db` forces `ssl: { rejectUnauthorized: true }` **unless** the connection string contains `sslmode=disable` (`packages/db/src/index.ts:20-26`). A local droplet Postgres has no TLS, and the deploy doc's example DSN omits `sslmode=disable` (`docs/deploy-digitalocean.md:50,65`) → `build-manifest`/scripts using this pool will **fail to connect** to local Postgres unless you append `?sslmode=disable`. (Payload's own adapter pool isn't affected.)
- **Native module `sharp`.** Native binary, allow-listed to build (`pnpm-workspace.yaml:8`), required by Payload image resizing (`apps/cms/package.json:32`, `payload.config.ts:95`). Must be installed **on the target platform** — never rsync `node_modules` from macOS/Windows; the workflows correctly `pnpm install` on the droplet.
- **Build runs on the serving box.** `deploy.sh` builds on the droplet on every publish (`deploy-web.yml`), so build spikes contend with live traffic + Postgres. Move to CI (with DB access) for anything but a low-edit site.
- **Media on local disk, not backed up by the app.** No cloud-storage adapter (§3); uploads persist only on the droplet's disk and are outside git — needs its own backup, and any `/srv` re-provision or over-broad clean loses them. Exact dir unset (`Media.ts`) — **confirm before wiring backups.**
- **Publish→deploy webhook listener is not in the repo.** `BUILD_WEBHOOK_URL` must point at a listener you build that runs `deploy.sh` (`docs/deploy-digitalocean.md:124-129`); until then the "publish rebuilds the site" loop is manual. **UNKNOWN — needs confirmation.**
- **Hardcoded paths in the systemd unit** (`User=mpm`, `WorkingDirectory=/srv/mrpackermover/apps/cms`, `EnvironmentFile=…/apps/cms/.env`, `pnpm` at `/usr/bin/pnpm`) must match the droplet exactly, or the service won't start (`deploy/mrpackermover-cms.service:15-23`).
- **Missing env fails startup.** `apps/cms/.env` must exist (systemd `EnvironmentFile`); `PAYLOAD_SECRET` defaults to `''` and Payload errors without it (`payload.config.ts:50`).
- **Cache purge is all-or-nothing on Free/Pro.** By-tag/prefix purge is Enterprise-only; `purge-cache.mjs` defaults to `purge_everything` (`scripts/purge-cache.mjs:59-61`, deploy doc:131-134) → a cold-cache burst after each deploy (mitigated by `stale-while-revalidate`).
- **Stale env reference.** `CF_HYPERDRIVE_ID` remains in `turbo.json:8` though Hyperdrive/Workers were retired (harmless, but misleading).
- **Repo size note.** `apps/web/public/images/hero/*` are committed binary JPGs (source images); not large individually, but the media/originals story lives on the droplet, not git.
