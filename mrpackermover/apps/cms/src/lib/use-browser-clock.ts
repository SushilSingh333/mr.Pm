import { useEffect, useState } from 'react';

/**
 * Re-render once in the browser, for a cell that reads the clock.
 *
 * "12m ago" is worked out from `Date.now()`, and a list cell is rendered twice - on the
 * server, then again in the browser to hydrate. When a minute ticks over between the two,
 * the text differs and React throws the whole table away and rebuilds it client-side
 * ("Hydration failed because the server rendered text didn't match"). A time of day has
 * the same problem any time the server's clock and the reader's are not the same zone.
 *
 * So the cell renders with `suppressHydrationWarning` - "the server's version is fine to
 * start with" - and this hook renders it once more after mount, which swaps in the
 * browser's own now and zone. Neither pass is wrong for long, and nothing is rebuilt.
 */
export function useBrowserClock(): void {
  const [, rerender] = useState(0);
  useEffect(() => rerender(1), []);
}
