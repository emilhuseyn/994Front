'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CityOrderApi } from '@/lib/api/admin';

/**
 * Real Azerbaijan order heatmap powered by Leaflet + OpenStreetMap tiles.
 *
 * This file uses the browser-only Leaflet bits, so it MUST be loaded via
 * `next/dynamic({ ssr: false })` — see `AzerbaijanMap.tsx` for the wrapper.
 *
 * For each city we render a `CircleMarker` whose radius scales with the
 * square-root of the order count (so **area** is proportional to volume —
 * the visually-honest way to chart counts).  Hover shows a tooltip with the
 * full breakdown.
 */

const AZERBAIJAN_CENTER: LatLngTuple = [40.5, 47.7];
const AZERBAIJAN_BOUNDS: LatLngBoundsExpression = [
  [38.3, 44.4], // SW corner
  [42.0, 50.7], // NE corner
];

export default function AzerbaijanMapInner({
  cities,
}: {
  cities: CityOrderApi[];
}) {
  const maxOrders = useMemo(
    () => Math.max(1, ...cities.map((c) => c.orderCount)),
    [cities],
  );

  /** sqrt-scaled radius: 6px (1 order) → 32px (max). */
  const radius = (count: number) => {
    const min = 6;
    const max = 32;
    if (maxOrders <= 1) return min;
    return min + (max - min) * Math.sqrt(count / maxOrders);
  };

  return (
    <MapContainer
      center={AZERBAIJAN_CENTER}
      zoom={7}
      maxBounds={AZERBAIJAN_BOUNDS}
      maxBoundsViscosity={0.7}
      minZoom={6}
      maxZoom={12}
      scrollWheelZoom={false}
      style={{ height: '460px', width: '100%', borderRadius: '6px' }}
    >
      {/* Carto's "Voyager" tile set — clean, modern look that pairs well
          with the rest of the admin chrome.  Free, no API key required. */}
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
      />

      {cities.map((c) => {
        const r = radius(c.orderCount);
        return (
          <CircleMarker
            key={c.city}
            center={[c.lat, c.lng]}
            radius={r}
            pathOptions={{
              color: '#f59e0b',       // amber-500 stroke
              weight: 2,
              fillColor: '#fbbf24',   // amber-400 fill
              fillOpacity: 0.65,
            }}
          >
            <Tooltip direction="top" offset={[0, -r]} opacity={1} permanent={false}>
              <div className="px-1 py-0.5">
                <div className="text-sm font-semibold text-amber-700">
                  {c.city}
                </div>
                <div className="text-[11px] text-neutral-700">
                  {c.orderCount} sifariş · {formatMoney(c.revenue)}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

function formatMoney(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K ₼`;
  return `${n.toFixed(0)} ₼`;
}
