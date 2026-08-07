/**
 * Brand icon for compact admin contexts (admin.components.graphics.Icon).
 * The maroon location-pin tile, matching the favicon and the nav logo.
 */
export function BrandIcon(): React.JSX.Element {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-label="MrPackerMover">
      <rect width="32" height="32" rx="8" fill="#990010" />
      <path
        fill="#fff"
        d="M16 6a6.5 6.5 0 00-6.5 6.5C9.5 17.3 16 26 16 26s6.5-8.7 6.5-13.5A6.5 6.5 0 0016 6zm0 9a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      />
    </svg>
  );
}
