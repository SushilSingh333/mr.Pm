import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload';
import { PAGE_TYPE_TO_SHARD } from '@mpm/shared';

/**
 * Publish trigger (Doc 02 §1). On change, enqueue a shard rebuild and debounce
 * 10 minutes: an ops team editing 40 rate cards must cause ONE build, not forty.
 *
 * The debounce timer lives in-process here (fine for a single CMS instance). The
 * actual build is kicked by POSTing to the CI build webhook with a shared token;
 * CI then rebuilds only the affected sitemap shard and purges its cache tag.
 */
const DEBOUNCE_MS = 10 * 60 * 1000;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleBuild(shard: string): void {
  const existing = pending.get(shard);
  if (existing) clearTimeout(existing);
  pending.set(
    shard,
    setTimeout(() => {
      pending.delete(shard);
      void fireBuild(shard);
    }, DEBOUNCE_MS),
  );
}

async function fireBuild(shard: string): Promise<void> {
  const url = process.env.BUILD_WEBHOOK_URL;
  const token = process.env.BUILD_TRIGGER_TOKEN;
  if (!url || !token) {
    console.info(`[build-trigger] would rebuild shard "${shard}" (no webhook configured)`);
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ shard }),
    });
  } catch (error) {
    console.error(`[build-trigger] failed to trigger build for "${shard}":`, error);
  }
}

/**
 * Attach to any collection whose changes affect published pages. Maps the row to
 * its page family's shard via a `pageType` field when present, else the collection.
 */
export const triggerBuildOnChange: CollectionAfterChangeHook = ({ doc, collection }) => {
  const pageType = (doc as { pageType?: keyof typeof PAGE_TYPE_TO_SHARD }).pageType;
  const shard = pageType ? PAGE_TYPE_TO_SHARD[pageType] : collection.slug;
  scheduleBuild(shard);
  return doc;
};

/**
 * Global variant of the trigger. Globals have no `pageType`, so the shard is fixed
 * per global (e.g. the home-content global rebuilds the `core` shard the home page
 * lives in). Signature differs from the collection hook, hence a separate factory.
 */
export const triggerBuildForShard =
  (shard: string): GlobalAfterChangeHook =>
  ({ doc }) => {
    scheduleBuild(shard);
    return doc;
  };
