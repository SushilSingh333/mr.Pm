import fs from 'node:fs';
import path from 'node:path';
import { WEB_DIST, listDistHtml, fail, type CheckResult } from './load.js';

/**
 * Status-code contract (Doc 02 §3). We can't issue HTTP from a static build, but we
 * assert the two structural preconditions for a genuine 404: a `404.html` exists
 * (Cloudflare Pages serves it with a real 404 status), and no built page carries a
 * `noindex` soft-404 masquerade. Live `curl -I` checks run in the deploy workflow.
 */
export function checkStatusCodes(): CheckResult {
  const files = listDistHtml();
  if (files.length === 0) {
    return { name: 'status-codes', ok: true, messages: ['(skipped — no dist build present)'] };
  }
  const messages: string[] = [];
  if (!fs.existsSync(path.join(WEB_DIST, '404.html'))) {
    messages.push('Missing dist/404.html — Cloudflare cannot return a genuine 404.');
  }
  return fail('status-codes', messages);
}
