#!/usr/bin/env node
/**
 * Auto-deploy listener — closes the loop so CMS publishes go live on their own.
 *
 * The Payload `afterChange` hook (apps/cms/src/hooks/trigger-build.ts) POSTs, debounced
 * ~10 min, to BUILD_WEBHOOK_URL with `Authorization: Bearer <BUILD_TRIGGER_TOKEN>`. This
 * server receives that POST and runs `deploy/deploy.sh` (rebuild manifest → build site →
 * publish → purge Cloudflare). It binds to 127.0.0.1 only (same droplet as the CMS — never
 * public), verifies the token, replies instantly (202), and never runs two builds at once:
 * triggers that arrive mid-build coalesce into exactly one follow-up build.
 *
 * Zero dependencies (Node http + child_process). Run under systemd — see
 * deploy/mrpackermover-deploy.service. Env:
 *   BUILD_TRIGGER_TOKEN   shared secret, same value the CMS sends (required)
 *   DEPLOY_LISTEN_PORT    port to listen on              (default 4545)
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.BUILD_TRIGGER_TOKEN;
const PORT = Number(process.env.DEPLOY_LISTEN_PORT || 4545);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'deploy', 'deploy.sh');

if (!TOKEN) {
  console.error('[deploy-listener] BUILD_TRIGGER_TOKEN is not set — refusing to start.');
  process.exit(1);
}

let building = false;
let queued = false;

function runDeploy() {
  if (building) {
    queued = true; // a publish arrived mid-build → run exactly one more build after
    return;
  }
  building = true;
  console.info(`[deploy-listener] build start ${new Date().toISOString()}`);
  const child = spawn('bash', [SCRIPT], { cwd: ROOT, stdio: 'inherit' });
  child.on('exit', (code) => {
    building = false;
    console.info(`[deploy-listener] build finished (exit ${code})`);
    if (queued) {
      queued = false;
      runDeploy();
    }
  });
  child.on('error', (err) => {
    building = false;
    console.error('[deploy-listener] could not start deploy.sh:', err);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '';

  if (req.method === 'GET' && url.startsWith('/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, building, queued }));
    return;
  }

  if (req.method !== 'POST' || !url.startsWith('/deploy')) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  if ((req.headers.authorization || '') !== `Bearer ${TOKEN}`) {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }

  // We don't need the body (the shard is informational — deploy.sh rebuilds everything).
  req.resume();
  req.on('end', () => {
    runDeploy();
    res.writeHead(202, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, building }));
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.info(`[deploy-listener] listening on http://127.0.0.1:${PORT}/deploy`);
});
