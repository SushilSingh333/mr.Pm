'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Remembers how the Leads list is filtered and sorted, so the ‹ › buttons on an open lead
 * (LeadPager) walk the same list the person was just looking at - "the next Quoted lead",
 * not the next lead in the whole table.
 *
 * Session storage, not local: it belongs to this tab's piece of work. A second tab with a
 * different filter keeps its own, and nothing outlives the browser session.
 */
export const LIST_MEMORY_KEY = 'mpm:leads:list';

export function LeadListMemory(): null {
  const params = useSearchParams();
  const query = params.toString();
  useEffect(() => {
    try {
      sessionStorage.setItem(LIST_MEMORY_KEY, query);
    } catch {
      /* storage off (private mode): the pager falls back to newest first */
    }
  }, [query]);
  return null;
}
