import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Fill a location's lat/lng from its name via the Google Geocoding API, so editors add a
 * city/locality without hand-entering coordinates ("for location we use Google Maps").
 *
 * Only runs when `GOOGLE_MAPS_API_KEY` is set and lat/lng are still blank — an editor can
 * always override by typing them. No key, or a failed lookup, simply leaves them blank
 * (the fields are optional). PostGIS-based "nearby areas" links use these when present.
 */
export const geocodeLocation: CollectionBeforeChangeHook = async ({ data }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || !data?.name) return data;
  if (data.lat != null && data.lng != null) return data;

  const query = `${data.name}, India`;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=in&key=${key}`,
    );
    const json = (await res.json()) as {
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
    };
    const loc = json.results?.[0]?.geometry?.location;
    if (loc) {
      data.lat = loc.lat;
      data.lng = loc.lng;
    }
  } catch {
    /* leave lat/lng blank — they're optional */
  }
  return data;
};
