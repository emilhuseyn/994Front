'use client';

import { useMemo } from 'react';
import type { HeatmapCellApi } from '@/lib/api/admin';

interface Props {
  cells: HeatmapCellApi[];
}

const DAY_LABELS = ['B.', 'B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.'];

/**
 * 7×24 heatmap of order counts (last 30 days). Each cell's opacity scales with
 * the order count, so peaks "glow". Lightweight: pure HTML/CSS, no canvas.
 */
export default function HeatmapGrid({ cells }: Props) {
  const matrix = useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const c of cells) m[c.dayOfWeek][c.hour] = c.orderCount;
    return m;
  }, [cells]);

  const max = useMemo(() => {
    let m = 0;
    for (const row of matrix) for (const v of row) if (v > m) m = v;
    return m;
  }, [matrix]);

  if (max === 0) {
    return (
      <p className="py-8 text-center text-xs text-neutral-500">
        Hələ kifayət qədər məlumat yoxdur.
      </p>
    );
  }

  // Build a flat list of busiest cells for a small "hotspots" caption.
  const hotspots = cells
    .filter((c) => c.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-start gap-2">
        {/* Day labels column */}
        <div className="flex flex-col gap-[2px] pt-5 text-[10px] font-mono text-neutral-400">
          {DAY_LABELS.map((d) => (
            <div key={d} className="h-4 leading-4">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          {/* Hour ticks */}
          <div className="mb-1 flex gap-[2px] text-[10px] font-mono text-neutral-400">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex h-4 min-w-[16px] flex-1 items-center justify-center">
                {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
              </div>
            ))}
          </div>
          {/* Cells */}
          {matrix.map((row, d) => (
            <div key={d} className="mb-[2px] flex gap-[2px]">
              {row.map((v, h) => {
                const intensity = v / max;
                return (
                  <div
                    key={h}
                    title={`${DAY_LABELS[d]} ${String(h).padStart(2, '0')}:00 — ${v} sifariş`}
                    className="h-4 min-w-[16px] flex-1 rounded-sm transition-transform hover:scale-125 hover:ring-1 hover:ring-black"
                    style={{
                      backgroundColor:
                        v === 0
                          ? '#f3f4f6'
                          : `rgba(0,0,0,${0.15 + intensity * 0.85})`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      {hotspots.length > 0 && (
        <p className="mt-3 text-[11px] text-neutral-500">
          Ən qızğın saatlar:{' '}
          {hotspots.map((h, i) => (
            <span key={`${h.dayOfWeek}-${h.hour}`}>
              {i > 0 && ', '}
              <span className="font-semibold text-neutral-700">
                {DAY_LABELS[h.dayOfWeek]} {String(h.hour).padStart(2, '0')}:00
              </span>{' '}
              ({h.orderCount})
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
