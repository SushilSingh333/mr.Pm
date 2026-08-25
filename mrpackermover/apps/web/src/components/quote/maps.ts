/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Google Maps helpers for the quote widget: Places Autocomplete (the address dropdown)
 * and Distance Matrix (driving km). Everything is guarded by PUBLIC_GOOGLE_MAPS_API_KEY —
 * with no key set, autocomplete is a no-op and distance returns null, so the widget falls
 * back to the built-in haversine estimate (./pricing.ts). The site therefore works both
 * before and after you wire Google up, and none of this changes the widget's design.
 *
 * Requires (on the key): Maps JavaScript API, Places API, Distance Matrix API.
 */
const KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
export const hasMapsKey = Boolean(KEY);

let loader: Promise<boolean> | null = null;

/** Load the Maps JS API (with Places) once. Resolves false if there's no key or it fails. */
export function loadGoogleMaps(): Promise<boolean> {
  if (!KEY) return Promise.resolve(false);
  if (loader) return loader;
  loader = new Promise<boolean>((resolve) => {
    if ((window as any).google?.maps?.places) return resolve(true);
    const cb = '__mpmMapsReady';
    (window as any)[cb] = () => resolve(true);
    const s = document.createElement('script');
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}` +
      `&libraries=places&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return loader;
}

/**
 * Attach Places Autocomplete to an input (India-biased). Silently no-ops without a key.
 *
 * The Maps JS API + Places library is several hundred KB across several requests, so it
 * is fetched on FIRST FOCUS of the field rather than at page load. Calling this eagerly
 * used to pull that third-party payload into the critical path of every page carrying an
 * address field — the home hero included — which is a large mobile Lighthouse cost for a
 * feature most visitors never touch. Focus fires before the first keystroke, so the
 * dropdown is ready by the time there is anything to complete.
 */
export async function attachAutocomplete(input: HTMLInputElement | null): Promise<void> {
  if (!input || !KEY) return;

  const bind = async (): Promise<void> => {
    if (!(await loadGoogleMaps())) return;
    const g = (window as any).google;
    const ac = new g.maps.places.Autocomplete(input, {
      fields: ['formatted_address', 'geometry', 'name'],
      componentRestrictions: { country: 'in' },
    });
    ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      if (p?.formatted_address) input.value = p.formatted_address;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };

  input.addEventListener('focus', () => void bind(), { once: true });
}

/** The state (e.g. "Delhi", "Haryana") for a typed address. null when unavailable. */
export async function geocodeState(address: string): Promise<string | null> {
  if (!address.trim() || !(await loadGoogleMaps())) return null;
  const g = (window as any).google;
  return new Promise<string | null>((resolve) => {
    const geo = new g.maps.Geocoder();
    geo.geocode(
      { address, componentRestrictions: { country: 'in' } },
      (res: any, status: string) => {
        if (status !== 'OK' || !res?.[0]) return resolve(null);
        const comp = (res[0].address_components ?? []).find((c: any) =>
          (c.types ?? []).includes('administrative_area_level_1'),
        );
        resolve(comp?.long_name ?? null);
      },
    );
  });
}

/** Driving distance in km between two typed addresses. Returns null when unavailable. */
export async function drivingDistanceKm(origin: string, dest: string): Promise<number | null> {
  if (!origin.trim() || !dest.trim()) return null;
  if (!(await loadGoogleMaps())) return null;
  const g = (window as any).google;
  return new Promise<number | null>((resolve) => {
    const svc = new g.maps.DistanceMatrixService();
    svc.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [dest],
        travelMode: g.maps.TravelMode.DRIVING,
        unitSystem: g.maps.UnitSystem.METRIC,
      },
      (res: any, status: string) => {
        const el = res?.rows?.[0]?.elements?.[0];
        if (status === 'OK' && el?.status === 'OK' && el.distance?.value) {
          resolve(el.distance.value / 1000);
        } else {
          resolve(null);
        }
      },
    );
  });
}
