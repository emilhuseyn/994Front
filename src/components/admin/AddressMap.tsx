'use client';

import { useEffect, useState } from 'react';

/**
 * Free-text address → embedded OpenStreetMap with a marker.
 *
 * Workflow:
 *   1. On mount / when `address` changes, call Nominatim (free OSM geocoder,
 *      no API key required) to convert the free-text address into lat/lng.
 *      We bias the search to Azerbaijan (`countrycodes=az`) so partial inputs
 *      like "Yasamal" or "Bakı" land on the right country.
 *   2. With lat/lng in hand, render an `<iframe>` pointing at OSM's embed
 *      page centred on the marker.
 *   3. If geocoding fails, show a friendly fallback link that opens OSM in a
 *      new tab.
 *
 * Nominatim's usage policy asks for a recognisable User-Agent — we can't set
 * that from the browser (it's a forbidden header), but the policy explicitly
 * allows browser apps that include a meaningful Referer, which the browser
 * sets automatically.  At admin-tool traffic levels this is well below limits.
 */
interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export default function AddressMap({ address }: { address: string }) {
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!address?.trim()) {
      setLoading(false);
      setError('Ünvan boşdur.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    geocode(address)
      .then((r) => {
        if (cancelled) return;
        if (r) setResult(r);
        else setError('Bu ünvan xəritədə tapılmadı.');
      })
      .catch(() => {
        if (!cancelled) setError('Xəritə yüklənə bilmədi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
        Xəritə yüklənir…
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-4 text-xs text-amber-900">
        <p className="font-medium">{error ?? 'Ünvan tapılmadı.'}</p>
        <p className="mt-1 text-amber-800">
          Daxil edilən mətn: <span className="font-mono">{address}</span>
        </p>
        <a
          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-semibold text-amber-900 underline-offset-2 hover:underline"
        >
          OpenStreetMap-də əl ilə axtar →
        </a>
      </div>
    );
  }

  // OSM embed expects a bbox around the marker; we use a ~2km radius (about
  // 0.02° lat / 0.025° lng) so the marker sits in a reasonable city-block view.
  const dLat = 0.02;
  const dLng = 0.025;
  const bbox = [
    result.lng - dLng,
    result.lat - dLat,
    result.lng + dLng,
    result.lat + dLat,
  ].join(',');
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${result.lat},${result.lng}`;

  return (
    <div className="overflow-hidden rounded border border-neutral-200">
      <iframe
        title={`Xəritə: ${address}`}
        src={src}
        loading="lazy"
        className="block h-64 w-full"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-600">
        <span className="truncate">📍 {result.displayName}</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lng}#map=15/${result.lat}/${result.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 flex-shrink-0 font-semibold text-neutral-700 hover:text-black hover:underline"
        >
          Böyüt →
        </a>
      </div>
    </div>
  );
}

// ─── Geocoding ─────────────────────────────────────────────────────────────

/** Tiny in-memory cache so we don't hit Nominatim twice for the same string. */
const cache = new Map<string, GeocodeResult | null>();

async function geocode(address: string): Promise<GeocodeResult | null> {
  const key = address.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  // Bias toward Azerbaijan so single-word inputs like "Bakı" or "Yasamal"
  // resolve to the right country.  `format=json&limit=1` keeps the response
  // tiny.  Accept-Language helps Nominatim return the localised display name.
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?q=${encodeURIComponent(address)}` +
    '&format=json&limit=1&countrycodes=az&addressdetails=0';

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'az,en;q=0.8,ru;q=0.6' },
  });
  if (!res.ok) {
    cache.set(key, null);
    return null;
  }
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (!data.length) {
    cache.set(key, null);
    return null;
  }
  const result: GeocodeResult = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
  cache.set(key, result);
  return result;
}
