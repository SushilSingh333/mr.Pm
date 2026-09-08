/**
 * Design tokens as typed values, for the rare cases where a token is needed in
 * JS/TS (e.g. an inline SVG stop-color, a canvas, a theme-color meta tag).
 * The CSS in `theme.css` remains the source of truth for the UI.
 */

export const color = {
  brand600: '#1d00b2', // Deep Royal Blue, primary
  brand500: '#4820d9',
  orange500: '#ff5500', // Safety Orange, accent
  orange600: '#db4600',
  accent500: '#12a150',
  warn500: '#c2620a',
  ink900: '#1a1c2e',
  ink700: '#464a60',
  ink500: '#6f7389',
  surface: '#ffffff',
} as const;

/** Used for the <meta name="theme-color"> tag. */
export const themeColor = color.brand600;

export type ColorToken = keyof typeof color;
