'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { DailyRevenuePointApi } from '@/lib/api/admin';

interface Props {
  points: DailyRevenuePointApi[];
}

export default function RevenueChart({ points }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = useMemo(
    () => Math.max(1, ...points.map((p) => p.revenue)),
    [points],
  );

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-neutral-500">
        Hələ kifayət qədər məlumat yoxdur.
      </p>
    );
  }

  const total = points.reduce((s, p) => s + p.revenue, 0);
  const orderTotal = points.reduce((s, p) => s + p.orderCount, 0);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs text-neutral-500">Son 30 günün gəliri</p>
        <p className="text-sm font-semibold">
          {formatPrice(total)}{' '}
          <span className="text-xs font-normal text-neutral-500">
            · {orderTotal} sifariş
          </span>
        </p>
      </div>
      <div className="relative">
        <div className="flex h-32 items-end gap-[2px]">
          {points.map((p, i) => {
            const heightPct = (p.revenue / max) * 100;
            return (
              <div
                key={i}
                className="group relative flex-1"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  style={{ height: `${Math.max(heightPct, p.revenue > 0 ? 4 : 1)}%` }}
                  className={`w-full rounded-t transition-colors ${
                    p.revenue > 0 ? 'bg-black hover:bg-neutral-700' : 'bg-neutral-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
        {hover !== null && points[hover] && (
          <div
            className="pointer-events-none absolute bottom-full left-0 mb-2 rounded bg-black px-2 py-1 text-xs text-white shadow-lg"
            style={{
              left: `${(hover / Math.max(1, points.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-mono">
              {new Date(points[hover].date).toLocaleDateString('az-AZ', {
                month: '2-digit',
                day: '2-digit',
              })}
            </p>
            <p className="font-semibold">
              {formatPrice(points[hover].revenue)}
            </p>
            <p className="text-[10px] text-white/70">
              {points[hover].orderCount} sifariş
            </p>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
        <span>
          {new Date(points[0].date).toLocaleDateString('az-AZ', {
            month: '2-digit',
            day: '2-digit',
          })}
        </span>
        <span>
          {new Date(points[points.length - 1].date).toLocaleDateString('az-AZ', {
            month: '2-digit',
            day: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
