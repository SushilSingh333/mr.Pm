import { MATERIAL, MATERIAL_VIEWBOX, type MaterialIcon } from './material.js';

/**
 * A Google Material Symbol, inline. Takes the text colour, so it follows whatever it sits
 * in - a grey row, a blue button, the dark drawer. No state and no hooks: it renders the
 * same on the server and in the browser.
 */
export function MIcon({
  name,
  size = 20,
  className,
}: {
  name: MaterialIcon;
  size?: number;
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      className={`m-icon${className ? ` ${className}` : ''}`}
      viewBox={MATERIAL_VIEWBOX}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={MATERIAL[name]} />
    </svg>
  );
}
