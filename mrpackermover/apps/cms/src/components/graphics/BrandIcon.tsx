import logo from './brand/logo.png';
import logoInverse from './brand/logo-inverse.png';

/**
 * The brand mark in the admin header (admin.components.graphics.Icon) - the real
 * MrMoverPacker wordmark, the same file the website's header uses.
 *
 * It replaces a blue location-pin tile that was drawn for the admin and matched nothing
 * a customer or a new hire has ever seen. The brand guideline forbids rebuilding the
 * logo in another typeface, so this is the approved artwork itself, copied byte for byte
 * from apps/web/public - not a redrawing.
 *
 * Both colourways ship and the theme picks one (see AdminTheme, ".mpm-brand"): the
 * blue wordmark on light, the white one on dark, as the website does on its header and
 * footer. The orange is the same in both.
 */
export function BrandIcon(): React.JSX.Element {
  return (
    <span className="mpm-brand mpm-brand--mark" role="img" aria-label="MrMoverPacker">
      <img
        className="mpm-brand__light"
        src={logo.src}
        width={logo.width}
        height={logo.height}
        alt=""
      />
      <img
        className="mpm-brand__dark"
        src={logoInverse.src}
        width={logoInverse.width}
        height={logoInverse.height}
        alt=""
      />
    </span>
  );
}
