/**
 * Design tokens as typed values, for the rare cases where a token is needed in
 * JS/TS (e.g. an inline SVG stop-color, a canvas, a theme-color meta tag).
 * The CSS in `theme.css` remains the source of truth for the UI.
 */

export const color = {
  brand600: '#1a3fe0',
  brand500: '#2f5bff',
  accent500: '#12a150',
  warn500: '#d97706',
  ink900: '#0d1117',
  ink700: '#303743',
  ink500: '#5b6472',
  surface: '#ffffff',
} as const;

/** Used for the <meta name="theme-color"> tag. */
export const themeColor = color.brand600;

export type ColorToken = keyof typeof color;
