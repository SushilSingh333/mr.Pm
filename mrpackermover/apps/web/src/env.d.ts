/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  /** Browser key for Places Autocomplete + Distance Matrix (see components/quote/maps.ts). */
  readonly PUBLIC_GOOGLE_MAPS_API_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
