'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { CityOrderApi } from '@/lib/api/admin';

/**
 * Dashboard widget that plots non-cancelled orders on a real OpenStreetMap
 * view of Azerbaijan.  The actual Leaflet rendering happens in
 * `AzerbaijanMapInner.tsx` — that file is loaded via `next/dynamic({ ssr:
 * false })` because Leaflet touches `window` at module load time and would
 * otherwise crash during server-side rendering.
 *
 * This wrapper provides:
 *   • loading skeleton (while Next.js streams the inner chunk)
 *   • empty state (no orders matched any AZ city)
 *   • compact legend footer (totals + bubble-size key)
 */

// Lazy-loaded Leaflet view — SSR disabled because Leaflet needs window/document.
const AzerbaijanMapInner = dynamic(() => import('./AzerbaijanMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] items-center justify-center rounded bg-neutral-100 text-xs text-neutral-500">
      Xəritə yüklənir…
    </div>
  ),
});

export default function AzerbaijanMap({
  cities,
  loading,
}: {
  cities: CityOrderApi[] | undefined;
  loading?: boolean;
}) {
  const totalOrders = useMemo(
    () => (cities ?? []).reduce((s, c) => s + c.orderCount, 0),
    [cities],
  );

  if (loading) {
    return (
      <div className="h-[460px] animate-pulse rounded bg-neutral-100" />
    );
  }

  // No cities matched → friendly empty state instead of an empty map.
  if (!cities || cities.length === 0) {
    return (
      <div className="flex h-[460px] flex-col items-center justify-center gap-2 rounded border border-dashed border-neutral-300 bg-neutral-50 text-center">
        <span className="text-3xl">🗺️</span>
        <p className="text-sm font-medium text-neutral-700">
          Hələ heç bir sifariş Azərbaycan şəhərlərindən qeydə alınmayıb
        </p>
        <p className="max-w-md text-xs text-neutral-500">
          Müştəri sifariş verəndə çatdırılma ünvanında şəhər adı (məsələn
          &quot;Bakı&quot;, &quot;Gəncə&quot;) varsa, burada xəritədə görsənəcək.
        </p>
      </div>
    );
  }

  return (
    <div>
      <AzerbaijanMapInner cities={cities} />

      {/* Compact legend / totals strip */}
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-neutral-500">
        <span>
          {totalOrders} sifariş · {cities.length} şəhər ·{' '}
          xəritə üzərində kursoru gəzdirin
        </span>
        <span className="flex items-center gap-3">
          <LegendBubble size={6} label="az" />
          <LegendBubble size={14} label="orta" />
          <LegendBubble size={24} label="çox" />
        </span>
      </footer>
    </div>
  );
}

function LegendBubble({ size, label }: { size: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="block rounded-full bg-amber-400 ring-2 ring-amber-500/40"
        style={{ width: size, height: size }}
      />
      <span>{label}</span>
    </span>
  );
}
