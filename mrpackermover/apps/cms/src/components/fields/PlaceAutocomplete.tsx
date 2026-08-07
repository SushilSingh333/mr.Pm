'use client';

/**
 * Custom admin field for a Location's name: a text input with Google Places Autocomplete.
 * As an editor types "Bengal…", Google suggests "Bengaluru, Karnataka, India"; picking one
 * fills the name AND the lat/lng fields directly — so coordinates are never hand-typed.
 *
 * Guarded by NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser key, Maps JavaScript + Places APIs).
 * With no key it degrades to a plain text box (the server-side geocode hook still fills
 * lat/lng on save). Admin-only — never affects the public site.
 */
import React, { useEffect, useId, useRef } from 'react';
import { useField } from '@payloadcms/ui';
import './place-autocomplete.css';

declare global {
  interface Window {
    google?: unknown;
    __mpmCmsMapsReady?: () => void;
  }
}

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let loader: Promise<boolean> | null = null;
function loadMaps(): Promise<boolean> {
  if (!KEY) return Promise.resolve(false);
  if (loader) return loader;
  loader = new Promise<boolean>((resolve) => {
    const g = window.google as { maps?: { places?: unknown } } | undefined;
    if (g?.maps?.places) return resolve(true);
    window.__mpmCmsMapsReady = () => resolve(true);
    const s = document.createElement('script');
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}` +
      `&libraries=places&loading=async&callback=__mpmCmsMapsReady`;
    s.async = true;
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return loader;
}

type Props = {
  path?: string;
  field?: { name?: string; label?: unknown; required?: boolean };
};

const PlaceAutocomplete: React.FC<Props> = ({ path, field }) => {
  const fieldPath = path ?? field?.name ?? 'name';
  const { value, setValue, showError, errorMessage } = useField<string>({ path: fieldPath });
  const { setValue: setLat } = useField<number>({ path: 'lat' });
  const { setValue: setLng } = useField<number>({ path: 'lng' });
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    let cancelled = false;
    void loadMaps().then((ok) => {
      const g = window.google as
        | {
            maps?: {
              places?: { Autocomplete: new (el: HTMLInputElement, opts: unknown) => unknown };
            };
          }
        | undefined;
      const Auto = g?.maps?.places?.Autocomplete;
      if (!ok || cancelled || !ref.current || !Auto) return;
      const instance = new Auto(ref.current, {
        fields: ['name', 'geometry'],
        componentRestrictions: { country: 'in' },
      }) as {
        getPlace: () => {
          name?: string;
          geometry?: { location?: { lat: () => number; lng: () => number } };
        };
        addListener: (evt: string, cb: () => void) => void;
      };
      instance.addListener('place_changed', () => {
        const p = instance.getPlace();
        if (p?.name) setValue(p.name);
        const loc = p?.geometry?.location;
        if (loc) {
          setLat(loc.lat());
          setLng(loc.lng());
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const label = typeof field?.label === 'string' ? field.label : 'Name';

  return (
    <div className="field-type text mpm-place">
      <label className="field-label" htmlFor={id}>
        {label}
        {field?.required ? <span className="required"> *</span> : null}
      </label>
      <input
        id={id}
        ref={ref}
        type="text"
        className="mpm-place-input"
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        placeholder={KEY ? 'Start typing a city or area…' : 'Type the location name'}
        autoComplete="off"
      />
      {showError ? <p className="mpm-place-error">{errorMessage}</p> : null}
      {!KEY ? (
        <p className="mpm-place-hint">
          Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to apps/cms/.env for Google suggestions.
        </p>
      ) : null}
    </div>
  );
};

export { PlaceAutocomplete };
export default PlaceAutocomplete;
