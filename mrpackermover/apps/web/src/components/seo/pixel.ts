/**
 * The Meta pixel id, in one place.
 *
 * Analytics.astro puts the base code on every page; the thank-you page needs the same id
 * again to attach advanced matching before it tracks a conversion. Two copies of an id
 * is exactly the kind of thing that drifts, and the failure is silent - events keep
 * firing, into a pixel nobody is watching.
 *
 * PUBLIC_META_PIXEL_ID overrides it for a staging property. A blank env line counts as
 * unset rather than as an empty id, or the site would ship with no pixel and no error.
 */
const PIXEL_ENV = (import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined)?.trim();

export const PIXEL_ID = PIXEL_ENV || '1093567959717564';
