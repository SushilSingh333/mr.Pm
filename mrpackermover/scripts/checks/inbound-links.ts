import { MIN_INBOUND_LINKS } from '@mpm/shared';
import { loadManifest, fail, type CheckResult } from './load.js';

/**
 * Inbound-link assertion (Doc 02 §7): every published page has at least three
 * contextual inbound links (excluding header/footer/breadcrumbs). This single
 * check is what prevents the incumbent's 95.8%-orphaned outcome.
 */
export function checkInboundLinks(): CheckResult {
  const m = loadManifest();
  const messages: string[] = [];

  for (const page of m.pages) {
    if (page.noindex) continue;
    if (page.inboundLinks.length < MIN_INBOUND_LINKS) {
      messages.push(
        `${page.path}: ${page.inboundLinks.length} inbound links (need ≥ ${MIN_INBOUND_LINKS})`,
      );
    }
  }
  return fail('inbound-links', messages);
}
