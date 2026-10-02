/**
 * How dates read in the admin: day first, the Indian way.
 *
 * A Payload date field with no format of its own falls back to American order - a
 * date-only field shows `MM/dd/yyyy`, so a move on 3 October read "10/03/2026", which
 * anyone here reads as the 10th of March. Every date field takes one of these two
 * instead, so the order is the same on every screen.
 *
 * Display only: the value is stored as a timestamp either way, so switching a field's
 * format never touches the database.
 */

/** A day with no time: a move date, a review date. Typed and shown as 03/10/2026. */
export const DAY_ONLY = { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } as const;

/** A moment: when something happened or is due. Shown as 3 Oct 2026, 11:00 AM. */
export const DAY_AND_TIME = {
  pickerAppearance: 'dayAndTime',
  displayFormat: 'd MMM yyyy, h:mm a',
} as const;

/** Lists, version history and other places Payload prints a date itself. */
export const LIST_DATE_FORMAT = 'd MMM yyyy, h:mm a';

/**
 * Catches a year nobody means before it reaches the database.
 *
 * Typing into a date that still holds its old value can produce "03/10/202605/11/2026",
 * which parses to the year 20205 - and Postgres cannot store a five-digit year, so the
 * save failed with a server error instead of a message on the field. Moves and callbacks
 * all fall in this century; anything outside it is a typo.
 */
export const checkYear = (value: unknown): true | string => {
  if (!value) return true;
  const year = new Date(String(value)).getUTCFullYear();
  if (Number.isNaN(year)) return 'That is not a date - pick one from the calendar.';
  return year >= 2000 && year <= 2100 ? true : `The year reads ${year} - check the date.`;
};
