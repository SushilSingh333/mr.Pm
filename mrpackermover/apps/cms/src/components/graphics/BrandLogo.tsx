import lockup from './brand/logo-lockup.png';
import lockupInverse from './brand/logo-lockup-inverse.png';

/**
 * The brand on the login screen and the other full-page admin screens
 * (admin.components.graphics.Logo) - the approved lockup with its tagline, "No surprises.
 * Just safe moves.", from the same files the website serves.
 *
 * It used to be a pin tile beside the name typed out in the admin's font, which is the
 * one thing the brand guideline rules out: the logo is artwork, not a font. The lockup
 * carries the tagline, and the guideline sets its minimum width at 240px so the tagline
 * stays legible - the stylesheet holds it there (see ".mpm-brand--lockup").
 *
 * Blue wordmark on the light theme, white on the dark one; the theme picks.
 */
export function BrandLogo(): React.JSX.Element {
  return (
    <span
      className="mpm-brand mpm-brand--lockup"
      role="img"
      aria-label="MrMoverPacker - No surprises. Just safe moves."
    >
      <img
        className="mpm-brand__light"
        src={lockup.src}
        width={lockup.width}
        height={lockup.height}
        alt=""
      />
      <img
        className="mpm-brand__dark"
        src={lockupInverse.src}
        width={lockupInverse.width}
        height={lockupInverse.height}
        alt=""
      />
    </span>
  );
}
