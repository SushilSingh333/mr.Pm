'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Google's app bars have no edge at rest and grow one the moment something scrolls under
 * them, so a heading never slides out of sight beneath a flat bar that looks like part of
 * the page. This flags each surface that scrolls while it is off its top - the page
 * (`html[data-mpm-scrolled]`) and the sidebar (`html[data-mpm-nav-scrolled]`) - and
 * AdminTheme draws each one's edge from its own flag.
 *
 * One capturing listener sees both: scroll events do not bubble, but they do pass through
 * the capture phase, so the sidebar's own scrolling reaches the document too.
 */
export function ScrollEdge(): null {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const mark = (): void => {
      root.toggleAttribute('data-mpm-scrolled', window.scrollY > 0);
      // The sidebar's rows scroll inside Payload's .nav__scroll.
      const rows = document.querySelector<HTMLElement>('.nav__scroll');
      root.toggleAttribute('data-mpm-nav-scrolled', (rows?.scrollTop ?? 0) > 0);
    };
    let frame = 0;
    const onScroll = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        mark();
      });
    };
    mark();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      cancelAnimationFrame(frame);
    };
    // A new page starts at the top, so the edge is re-read on every navigation.
  }, [pathname]);

  return null;
}
