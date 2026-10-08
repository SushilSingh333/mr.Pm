'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { MIcon } from '../icons/MIcon.js';
import type { MaterialIcon } from '../icons/material.js';

/**
 * One row of the sidebar's own section, drawn exactly like Payload's navigation rows so
 * the whole sidebar reads as one list (see ".nav .nav__link" in AdminTheme).
 *
 * A client component only for the highlight: knowing which page you are on needs the
 * browser's path, and a row that stays plain while you are on its page is a map with no
 * "you are here".
 *
 * `strong` is Gmail's unread treatment - the label and its count go bold when there is
 * something waiting, and fall back to regular weight when there is not.
 *
 * Leads and Schedule are the same page - Schedule is the Leads list filtered to
 * Scheduled - so the path alone cannot tell them apart. `activeParam` / `inactiveParam`
 * look at the filter in the URL as well, so exactly one of the two is lit.
 *
 * `fresh` loads the page anew when the link points at the page you are already on with
 * a different query. Payload's list keeps its filter in client state across in-app
 * navigation between two views of the same list, and a link with NO filter has nothing
 * to override it with: Schedule -> Leads showed every lead for a moment, then Payload
 * wrote `status=scheduled` back into the address bar and the Status menu stayed on
 * Scheduled. A fresh load starts the list from the URL alone.
 */
export function NavRow({
  href,
  icon,
  label,
  count,
  strong = false,
  activeOn,
  activeParam,
  inactiveParam,
  title,
  navKey,
  fresh = false,
}: {
  href: string;
  icon: MaterialIcon;
  label: string;
  count?: number;
  strong?: boolean;
  /** The path this row owns, for the "you are here" highlight. */
  activeOn?: string;
  /** Lit only when the URL's query also contains this text (decoded). */
  activeParam?: string;
  /** Never lit when the URL's query contains this text (decoded). */
  inactiveParam?: string;
  title?: string;
  /** A stable hook for tests and styling, e.g. "leads". */
  navKey?: string;
  /** Load the page anew when already on this path (see above). */
  fresh?: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  const search = decodeURIComponent(useSearchParams()?.toString() ?? '');
  const active = Boolean(
    activeOn &&
    pathname?.startsWith(activeOn) &&
    (!activeParam || search.includes(activeParam)) &&
    !(inactiveParam && search.includes(inactiveParam)),
  );
  return (
    <Link
      href={href}
      data-nav={navKey}
      className={`mpm-nav__row${active ? ' is-active' : ''}${strong ? ' is-strong' : ''}`}
      aria-current={active ? 'page' : undefined}
      title={title}
      prefetch={false}
      onClick={
        fresh
          ? (e) => {
              // Leave new-tab and modified clicks to the browser.
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              if (pathname !== href.split('?')[0]) return;
              e.preventDefault();
              window.location.assign(href);
            }
          : undefined
      }
    >
      <MIcon name={icon} size={20} className="mpm-nav__row-ico" />
      <span className="mpm-nav__row-label">{label}</span>
      {count !== undefined && count > 0 && <span className="mpm-nav__row-n">{count}</span>}
    </Link>
  );
}
