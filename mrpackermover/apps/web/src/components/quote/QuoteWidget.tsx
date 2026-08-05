import { useEffect, useMemo, useState } from 'preact/hooks';
import type { RateBand } from '@mpm/shared';

/**
 * Porter-style horizontal booking bar: Pickup · Drop · Phone · Shifting Date ·
 * Check Price. On city pages a Porter-style city chip sits as a tab on top of the
 * bar; clicking it opens the shared "Choose your city" modal, and picking a city
 * navigates to that city. It also shows a live indicative price the moment pickup +
 * drop are filled. The only interactive island below the header. Submits to POST /quote.
 */

interface Props {
  prefillCity?: string;
  prefillService?: string;
  prefillOrigin?: string;
  prefillDestination?: string;
  bands?: RateBand[];
  roadKm?: number;
  turnstileSiteKey?: string;
  /** When set, shows the city chip/tab; picking a city navigates to it. */
  cityLabel?: string;
}

function openCityModal(): void {
  const modal = document.getElementById('city-modal') as HTMLDialogElement | null;
  modal?.showModal();
}

export default function QuoteWidget(props: Props) {
  const [pickup, setPickup] = useState(props.prefillOrigin ?? props.prefillCity ?? '');
  const [drop, setDrop] = useState(props.prefillDestination ?? '');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const estimate = useMemo(
    () => estimateBand({ bands: props.bands, roadKm: props.roadKm }),
    [props.bands, props.roadKm],
  );
  const showEstimate = pickup.trim().length > 1 && drop.trim().length > 0 && Boolean(estimate);
  const valid = pickup.trim().length > 1 && /^[+0-9 ()-]{8,}$/.test(phone);

  // Picking a city in the shared modal navigates to that city's page.
  useEffect(() => {
    const onSelect = (event: Event) => {
      const slug = (event as CustomEvent<{ slug?: string }>).detail?.slug;
      if (slug) window.location.href = `/packers-and-movers/${slug}`;
    };
    document.addEventListener('mpm:city-select', onSelect);
    return () => document.removeEventListener('mpm:city-select', onSelect);
  }, []);

  async function submit(event: Event) {
    event.preventDefault();
    if (!valid) {
      setError('Please add a pickup location and a valid phone number.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = readTurnstileToken();
      const res = await fetch('/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          service: props.prefillService ?? 'Home Shifting',
          pickup,
          drop,
          date,
          size: '',
          name: '',
          phone,
          turnstileToken: token,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setDone(true);
    } catch {
      setError('Could not send just now. Please try again, or WhatsApp us.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div class="booking-done" role="status">
        <strong>Thanks — a coordinator will call you shortly.</strong>
        {estimate && (
          <span>Indicative for your move: {estimate}. Your written quote will be fixed.</span>
        )}
      </div>
    );
  }

  return (
    <div class="booking-shell">
      {props.cityLabel && (
        <button
          type="button"
          class="booking-city"
          onClick={openCityModal}
          aria-haspopup="dialog"
          aria-controls="city-modal"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 21s7-6.4 7-11a7 7 0 10-14 0c0 4.6 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <strong>{props.cityLabel}</strong>
          <svg
            class="chev"
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
      <form class="booking-bar" onSubmit={submit} aria-label="Get a fixed quote">
        <div class="bar-fields">
          <label class="bar-field">
            <span class="bar-label">
              Pickup Location <b>*</b>
            </span>
            <input
              value={pickup}
              onInput={(e) => setPickup((e.target as HTMLInputElement).value)}
              placeholder="Sending from"
              autocomplete="off"
            />
          </label>
          <label class="bar-field">
            <span class="bar-label">
              Drop Location <b>*</b>
            </span>
            <input
              value={drop}
              onInput={(e) => setDrop((e.target as HTMLInputElement).value)}
              placeholder="Sending to"
              autocomplete="off"
            />
          </label>
          <label class="bar-field">
            <span class="bar-label">
              Phone Number <b>*</b>
            </span>
            <input
              value={phone}
              onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
              placeholder="Enter Contact Details"
              inputmode="tel"
              autocomplete="tel"
            />
          </label>
          <label class="bar-field">
            <span class="bar-label">
              Shifting Date <b>*</b>
            </span>
            <input
              type="date"
              value={date}
              onInput={(e) => setDate((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <button type="submit" class="btn btn-primary bar-cta" disabled={submitting}>
          {submitting ? 'Checking…' : 'Check Price'}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        {props.turnstileSiteKey && (
          <div class="cf-turnstile bar-turnstile" data-sitekey={props.turnstileSiteKey} />
        )}

        {showEstimate && (
          <p class="bar-estimate" aria-live="polite">
            Indicative price for this move: <strong>{estimate}</strong> — shown before you share
            anything else.
          </p>
        )}
        {error && (
          <p class="bar-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

function estimateBand({ bands, roadKm }: { bands?: RateBand[]; roadKm?: number }): string | null {
  const band = bands?.find((b) => b.band.startsWith('2')) ?? bands?.[0];
  if (!band) return null;
  const distanceAdd = roadKm && band.perKm ? band.perKm * roadKm : 0;
  const low = band.base + distanceAdd;
  const high = Math.round((band.base + (band.packing ?? 0) + distanceAdd) * 1.25);
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  return `${fmt(low)} – ${fmt(high)}`;
}

function readTurnstileToken(): string | undefined {
  const el = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
  return el?.value || undefined;
}
