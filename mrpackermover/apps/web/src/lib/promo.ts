/**
 * The home page's promotional banner (19 Oct 2026, the owner: "Festive Dussehra Diwali
 * Moving Offer" artwork, "use it at home page banner"; it replaced the earlier
 * "A Brighter Start Begins at Home" artwork the same day).
 *
 * The artwork is a finished banner with its text in the picture, so the home hero shows
 * it whole instead of the photograph-and-headline banner. Its files come from
 * scripts/build-promo-banner.mjs (a wide version, and the text panel alone for phones),
 * which prints the sizes to copy into `wide` and `tall` below.
 *
 * It stays up until it is taken down by hand: the owner decided (19 Oct 2026) to run it
 * past Diwali and end it "some time after". To take it down, set HOME_PROMO to null and
 * deploy; the normal photo banner returns. An optional `until` date makes a promo end by
 * itself instead, at the first site build after that day.
 */
export interface HomePromo {
  /** Files: /images/promo/<name>-wide.webp, -wide-1280.webp, -wide.jpg, -tall.webp, -tall-480.webp */
  name: string;
  /** Pixel size of <name>-wide.webp and of <name>-tall.webp, so the space is reserved. */
  wide: [number, number];
  tall: [number, number];
  /** Everything the picture says, for screen readers and search engines. */
  alt: string;
  /** Where the banner (and its "Book your move" button) goes. */
  href: string;
  /** Optional last day it shows, inclusive, India time (YYYY-MM-DD). Absent: until removed by hand. */
  until?: string;
}

export const HOME_PROMO: HomePromo | null = {
  name: 'festive-dussehra-diwali-moving-offer',
  wide: [1920, 799],
  tall: [900, 707],
  alt: 'Dussehra and Diwali special moving offer from MrMoverPacker: 20% off on every move. Book your move before Dussehra or Diwali. Safe and secure relocation, trained professionals, quality packing, pan-India service. Limited time offer: plan early, save more.',
  href: '/get-quote',
  // No end date: it stays until the owner says to take it down.
};

/** The promo to show in a build made at `now`, or null once it has ended. */
export function activeHomePromo(now: Date = new Date()): HomePromo | null {
  if (!HOME_PROMO) return null;
  if (!HOME_PROMO.until) return HOME_PROMO;
  // Ends at midnight India time (UTC+5:30) after the `until` day.
  const end = new Date(`${HOME_PROMO.until}T23:59:59+05:30`).getTime();
  return now.getTime() <= end ? HOME_PROMO : null;
}
