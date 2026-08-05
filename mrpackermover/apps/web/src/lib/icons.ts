/**
 * Inline icon set (24×24, stroke-based) as SVG inner markup, rendered via set:html
 * inside an <svg stroke="currentColor">. Multi-shape so the icons read clearly.
 * Original geometry — no external icon library required.
 */
export const ICONS: Record<string, string> = {
  // ── Services ──────────────────────────────────────────────────────────────
  'home-shifting':
    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
  'office-shifting':
    '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2"/>',
  'car-transport':
    '<path d="M5 13l1.7-4.8A2 2 0 0 1 8.6 6.9h6.8a2 2 0 0 1 1.9 1.3L19 13"/><rect x="3" y="13" width="18" height="5" rx="1.6"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/>',
  'bike-transport':
    '<circle cx="6" cy="16" r="3.2"/><circle cx="18" cy="16" r="3.2"/><path d="M6 16l4-6h3.5l2.5 4"/><path d="M9 10h5"/>',
  'loading-unloading':
    '<path d="M12 3v9"/><path d="M8.5 8.5 12 12l3.5-3.5"/><path d="M4 13v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4"/>',
  'packing-unpacking':
    '<path d="M21 8 12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  'storage-warehousing':
    '<path d="M3 21V9l9-4 9 4v12"/><path d="M3 21h18"/><rect x="7.5" y="13" width="9" height="8"/><path d="M7.5 17h9"/>',
  'international-relocation':
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',

  // ── Feature / trust icons ─────────────────────────────────────────────────
  'fixed-quote':
    '<path d="M12.6 2H5a2 2 0 0 0-2 2v7.6a2 2 0 0 0 .6 1.4l7.4 7.4a2 2 0 0 0 2.8 0l6.6-6.6a2 2 0 0 0 0-2.8L14 2.6A2 2 0 0 0 12.6 2z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  'verified-crew':
    '<path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6z"/><path d="M8.7 12l2.2 2.2L15.3 10"/>',
  claims:
    '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8.5 14l2 2 4-4"/>',
  insurance:
    '<path d="M12 3v2"/><path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v6a2.5 2.5 0 0 0 5 0"/>',

  // ── General UI icons (company / legal / contact / blog) ───────────────────
  shield: '<path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6z"/>',
  'shield-check':
    '<path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6z"/><path d="M8.7 12l2.2 2.2L15.3 10"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  phone:
    '<path d="M5 4h3.6l1.4 4-2 1.3a11 11 0 0 0 4.7 4.7L18 16l1.4 1.4V21a1 1 0 0 1-1 1A15 15 0 0 1 3 6a1 1 0 0 1 1-1z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  headset:
    '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1.4"/><rect x="17" y="13" width="4" height="6" rx="1.4"/><path d="M20 19a4 4 0 0 1-4 4h-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  users:
    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.6a3 3 0 0 1 0 5.6"/><path d="M15 13.6A6 6 0 0 1 21 20"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.5l1.2-6L3.4 9.3l6-.7z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  'map-pin': '<path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  rupee: '<path d="M8 5h8"/><path d="M8 9h8"/><path d="M8 13h4a4 4 0 0 0 0-8"/><path d="M8 13l6 6"/>',
  truck:
    '<rect x="2.5" y="7" width="11.5" height="9" rx="1.2"/><path d="M14 10.5h3.6l3 3V16H14z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>',
  growth: '<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/><path d="M17 8h3v3"/>',
  badge:
    '<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5"/>',
  scale:
    '<path d="M12 3v18"/><path d="M6 21h12"/><path d="M4 7h16"/><path d="M4 7l-2 5a3 3 0 0 0 5 0z"/><path d="M20 7l-2 5a3 3 0 0 0 5 0z"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  camera:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.2"/>',
  handshake:
    '<path d="M8 12l2.5 2.5a1.6 1.6 0 0 0 2.3 0L20 8"/><path d="M4 8l3-2h4l3 2"/><path d="M4 8v6l4 3"/><path d="M20 8v6l-3 2"/>',
};

export const iconSvg = (name: string): string => ICONS[name] ?? '<path d="M4 12h16"/>';
