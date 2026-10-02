'use client';

import { useNav } from '@payloadcms/ui';
import { useEffect } from 'react';

/** The widths where the sidebar is a drawer over the page (see AdminTheme). */
const DRAWER = '(max-width: 1024px)';

/**
 * Closes the phone/tablet menu drawer when you tap outside it, or press Esc - the way
 * every app drawer behaves. Payload only closed it from its own X button, so the dimmed
 * page beside the drawer looked tappable and did nothing.
 *
 * The tap that closes the drawer is used up: it does not also go through to whatever was
 * under the dimming. Someone tapping the shade means "close this", not "press the button
 * I can barely see beneath it".
 *
 * Rendered inside the sidebar (SidebarNav), because Payload's nav state lives in the page
 * template - a provider sits above it and would get no state.
 */
export function NavDismiss(): null {
  const { navOpen, setNavOpen } = useNav();

  useEffect(() => {
    if (!navOpen) return;
    const isDrawer = (): boolean => window.matchMedia(DRAWER).matches;
    const outside = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      !target.closest('.nav') &&
      // The header's own menu button toggles the drawer itself; leave it to do that.
      !target.closest('.app-header__mobile-nav-toggler');

    const onClick = (e: MouseEvent): void => {
      if (!isDrawer() || !outside(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      setNavOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isDrawer()) setNavOpen(false);
    };
    // Capture phase, so the tap is caught before anything under the dimming reacts to it.
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [navOpen, setNavOpen]);

  return null;
}
