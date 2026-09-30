'use client';
import { useAuth } from '@payloadcms/ui';
import { usePathname } from 'next/navigation';
import { personCase } from '../dashboard/lead-status.js';

/**
 * Who is signed in, at the right-hand end of the header (admin.avatar).
 *
 * Payload's default is a grey silhouette - the same for everybody, so it answers nothing,
 * and on a shared office machine "whose session is this?" is a real question. This is
 * the person's initials in a blue circle, Google-style, with their name and role in the
 * tooltip. It sits inside Payload's own link to the account page, so it is still the
 * way to your profile and to signing out.
 *
 * Role words are the ones the Users screen uses, so nobody meets a second name for the
 * same thing.
 */
const ROLE: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  ops: 'Ops',
  handler: 'Handler',
  sales: 'Sales',
};

export function AccountAvatar(): React.JSX.Element {
  const { user } = useAuth();
  const pathname = usePathname();
  const u = user as { name?: string; email?: string; role?: string } | null;
  const name = personCase(u?.name?.trim() || u?.email?.split('@')[0] || '');
  const initials =
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '?';
  const role = ROLE[u?.role ?? ''] ?? '';
  const onAccount = pathname?.endsWith('/account') ?? false;

  return (
    // Google's account button is the avatar and nothing else; the name and role are in
    // the tooltip, where Google puts them too.
    <span
      className={`mpm-me${onAccount ? ' is-on' : ''}`}
      title={`${name}${role ? ` · ${role}` : ''} - your account`}
    >
      <span className="mpm-me__disc" aria-hidden="true">
        {initials}
      </span>
    </span>
  );
}
