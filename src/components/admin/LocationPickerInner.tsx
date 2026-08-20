'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Interactive "pick your store on the map" control (admin).
 *
 * The admin can:
 *   • click anywhere on the map (the pin moves there),
 *   • type an address and search it, or
 *   • paste a Google Maps link / coordinates.
 *
 * The chosen point is reported back as an "lat, lng" string that gets stored in
 * the `store.mapQuery` site-setting. Browser-only (Leaflet touches `window`),
 * so it's loaded via `next/dynamic({ ssr: false })` — see LocationPicker.tsx.
 */

const BAKU: LatLngTuple = [40.3777, 49.892];

function inRange(lat: number, lng: number): boolean {
  return (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseCoords(v: string): LatLngTuple | null {
  const m = v
    .trim()
    .match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return inRange(lat, lng) ? [lat, lng] : null;
}

/**
 * Pull coordinates out of a full Google Maps URL. Handles the three common
 * shapes (in priority order):
 *   • the place's real coords:  …!3d<lat>!4d<lng>…
 *   • the map-view centre:      …/@<lat>,<lng>,<zoom>z…
 *   • a query param:            ?q=<lat>,<lng> / &ll= / &destination= …
 * Short share links (maps.app.goo.gl / goo.gl/maps) are redirects with no coords
 * in them, so they can't be parsed here — the caller handles that separately.
 */
function parseGoogleMapsUrl(input: string): LatLngTuple | null {
  let m = input.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) m = input.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (!m)
    m = input.match(
      /[?&](?:q|query|ll|center|daddr|destination)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)\s*(-?\d{1,3}(?:\.\d+)?)/i,
    );
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return inRange(lat, lng) ? [lat, lng] : null;
}

const isShortGoogleLink = (s: string) =>
  /(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(s);

const fmt = (p: LatLngTuple) => `${p[0].toFixed(6)}, ${p[1].toFixed(6)}`;

/** Captures map clicks and reports the clicked point. */
function ClickCapture({ onPick }: { onPick: (p: LatLngTuple) => void }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/** Flies the map to `point` whenever `trigger` changes (used after a search). */
function Recenter({ point, trigger }: { point: LatLngTuple; trigger: number }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    // A useEffect always runs once on mount regardless of its deps; skip that
    // run so the initial `zoom` prop is respected. Only act on later searches
    // (when `trigger` increments).
    if (first.current) {
      first.current = false;
      return;
    }
    map.setView(point, Math.max(map.getZoom(), 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

/**
 * When the map first mounts inside a modal its container may still be sizing,
 * which leaves Leaflet with the wrong dimensions (grey tiles). Recompute once
 * on the next tick.
 */
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function LocationPickerInner({
  value,
  onChange,
}: {
  value: string;
  onChange: (coords: string) => void;
}) {
  const initialCoords = parseCoords(value);
  const [point, setPoint] = useState<LatLngTuple>(initialCoords ?? BAKU);
  // If the stored value is a free-text address (not coords), prefill the box with it.
  const [search, setSearch] = useState(initialCoords ? '' : value);
  const [recenter, setRecenter] = useState(0);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function pick(p: LatLngTuple) {
    setPoint(p);
    onChange(fmt(p));
  }

  async function applySearch() {
    const term = search.trim();
    if (!term) return;
    setNote(null);

    // 1) Raw coordinates "lat, lng"
    const direct = parseCoords(term);
    if (direct) {
      pick(direct);
      setRecenter((x) => x + 1);
      return;
    }

    // 2) A full Google Maps URL we can read coordinates out of
    const fromUrl = parseGoogleMapsUrl(term);
    if (fromUrl) {
      pick(fromUrl);
      setRecenter((x) => x + 1);
      return;
    }

    // 2b) Short share links are redirects with no coords — can't read them here.
    if (isShortGoogleLink(term)) {
      setNote(
        'Qısa Google linki birbaşa oxunmur. Google Maps-da yeri açıb ünvan çubuğundakı TAM linki (içində @40…,49… olan) kopyalayın — və ya sadəcə xəritəyə klikləyin.',
      );
      return;
    }

    // 3) Free-text address → Nominatim (free OSM geocoder)
    setSearching(true);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search' +
          `?q=${encodeURIComponent(term)}&format=json&limit=1&countrycodes=az`,
        { headers: { 'Accept-Language': 'az,en;q=0.8,ru;q=0.6' } },
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data?.length) {
        pick([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setRecenter((x) => x + 1);
      } else {
        setNote('Bu ünvan tapılmadı — xəritədən birbaşa nöqtəni seçin.');
      }
    } catch {
      setNote('Axtarış alınmadı — xəritədən nöqtəni seçin.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applySearch();
            }
          }}
          placeholder="Ünvan, koordinat və ya Google Maps linki"
          className="block w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <button
          type="button"
          onClick={applySearch}
          disabled={searching}
          className="flex-shrink-0 rounded border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {searching ? '…' : 'Tap'}
        </button>
      </div>

      <p className="mb-2 text-[11px] text-neutral-500">
        Xəritəyə klikləyin, ünvan yazıb <b>Tap</b>-a basın, və ya Google Maps-dan
        tam linki (yaxud <span className="font-mono">40.37, 49.83</span> kimi
        koordinat) yapışdırın.
      </p>

      {note && <p className="mb-2 text-[11px] text-amber-700">{note}</p>}

      <MapContainer
        center={point}
        zoom={initialCoords ? 16 : 12}
        scrollWheelZoom
        style={{ height: '360px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />
        <CircleMarker
          center={point}
          radius={10}
          pathOptions={{
            color: '#111',
            weight: 2,
            fillColor: '#f59e0b',
            fillOpacity: 0.85,
          }}
        />
        <ClickCapture onPick={pick} />
        <Recenter point={point} trigger={recenter} />
        <InvalidateOnMount />
      </MapContainer>

      <p className="mt-2 text-[11px] text-neutral-500">
        Seçilmiş nöqtə:{' '}
        <span className="font-mono text-neutral-700">{fmt(point)}</span>
      </p>
    </div>
  );
}
