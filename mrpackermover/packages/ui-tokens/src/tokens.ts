/**
 * Design tokens as typed values, for the rare cases where a token is needed in
 * JS/TS (e.g. an inline SVG stop-color, a canvas, a theme-color meta tag).
 * The CSS in `theme.css` remains the source of truth for the UI.
 */

export const color = {
  brand600: '#990010',
  brand500: '#bd1325',
  accent500: '#12a150',
  warn500: '#c2620a',
  ink900: '#1c2637',
  ink700: '#434e60',
  ink500: '#6b7488',
  surface: '#ffffff',
} as const;

/** Used for the <meta name="theme-color"> tag. */
export const themeColor = color.brand600;

export type ColorToken = keyof typeof color;
