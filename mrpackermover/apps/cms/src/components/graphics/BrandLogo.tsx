/**
 * Brand logo for the admin nav header + login screen (admin.components.graphics.Logo).
 * Reuses the site favicon's maroon location-pin for a consistent identity.
 */
export function BrandLogo(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
      <svg width="34" height="34" viewBox="0 0 32 32" role="img" aria-label="MrPackerMover">
        <rect width="32" height="32" rx="8" fill="#990010" />
        <path
          fill="#fff"
          d="M16 6a6.5 6.5 0 00-6.5 6.5C9.5 17.3 16 26 16 26s6.5-8.7 6.5-13.5A6.5 6.5 0 0016 6zm0 9a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
        />
      </svg>
      <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--theme-elevation-1000)' }}>
        Mr<span style={{ fontWeight: 800, color: '#990010' }}>PackerMover</span>
      </span>
    </div>
  );
}
