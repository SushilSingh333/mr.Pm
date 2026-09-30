'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
 */
export function NavRow({
  href,
  icon,
  label,
  count,
  strong = false,
  activeOn,
  title,
}: {
  href: string;
  icon: MaterialIcon;
  label: string;
  count?: number;
  strong?: boolean;
  /** The path this row owns, for the "you are here" highlight. */
  activeOn?: string;
  title?: string;
}): React.JSX.Element {
  const pathname = usePathname();
  const active = Boolean(activeOn && pathname?.startsWith(activeOn));
  return (
    <Link
      href={href}
      className={`mpm-nav__row${active ? ' is-active' : ''}${strong ? ' is-strong' : ''}`}
      aria-current={active ? 'page' : undefined}
      title={title}
      prefetch={false}
    >
      <MIcon name={icon} size={20} className="mpm-nav__row-ico" />
      <span className="mpm-nav__row-label">{label}</span>
      {count !== undefined && count > 0 && <span className="mpm-nav__row-n">{count}</span>}
    </Link>
  );
}
