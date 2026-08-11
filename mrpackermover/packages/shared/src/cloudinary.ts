/**
 * Cloudinary delivery helpers (shared by the manifest builder and the Astro site).
 *
 * Images uploaded through the CMS land on Cloudinary; Payload stores their plain
 * delivery URL, of the form:
 *   https://res.cloudinary.com/<cloud>/image/upload/<folder>/<file>
 *
 * We inject a transformation segment right after `/upload/` so the SAME source image
 * is delivered resized and in the best format the browser accepts (AVIF/WebP via
 * `f_auto`) at an automatic quality (`q_auto`) — no Cloudinary SDK ships to the
 * static site, it is only string manipulation. A non-Cloudinary URL (e.g. the static
 * `/images/hero/...` fallback) is returned unchanged, so callers can pass either kind
 * of URL and always get something renderable.
 */
const UPLOAD_MARKER = '/upload/';

export function isCloudinaryUrl(url: string | null | undefined): url is string {
  return (
    typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes(UPLOAD_MARKER)
  );
}

/** Insert a Cloudinary transformation into a delivery URL (no-op for other URLs). */
export function cldUrl(url: string, transform: string): string {
  if (!isCloudinaryUrl(url)) return url;
  const at = url.indexOf(UPLOAD_MARKER) + UPLOAD_MARKER.length;
  return `${url.slice(0, at)}${transform}/${url.slice(at)}`;
}

/**
 * Preset transformations for the places we render images.
 * - `hero`: wide, no forced crop — the CSS `background-size:cover` does the cropping,
 *   so we only need an optimized, large-enough source.
 * - `thumb`: square, smart-cropped (`g_auto`) for the city cards / picker at 2× DPR.
 */
export const CLD_TRANSFORM = {
  hero: 'f_auto,q_auto,w_1920',
  thumb: 'f_auto,q_auto,c_fill,g_auto,w_240,h_240',
  /** Blog cover — wide enough for the featured/post layouts; CSS object-fit crops per slot. */
  blog: 'f_auto,q_auto,w_1200',
} as const;
