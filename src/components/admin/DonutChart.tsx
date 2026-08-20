'use client';

import { useMemo } from 'react';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Big number rendered in the centre. */
  centerLabel?: string;
  /** Sub-label rendered below the big number. */
  centerSub?: string;
}

export default function DonutChart({
  slices,
  size = 160,
  thickness = 22,
  centerLabel,
  centerSub,
}: Props) {
  const total = useMemo(
    () => slices.reduce((s, x) => s + x.value, 0),
    [slices],
  );

  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  // Build cumulative offsets so each slice paints onto the stroke as a dash.
  let offset = 0;
  const segments = slices.map((s) => {
    const portion = total > 0 ? s.value / total : 0;
    const seg = {
      dash: `${portion * c} ${c - portion * c}`,
      dashOffset: -offset,
      color: s.color,
      label: s.label,
      value: s.value,
      portion,
    };
    offset += portion * c;
    return seg;
  });

  if (total === 0) {
    return (
      <p className="py-8 text-center text-xs text-neutral-500">
        Hələ kifayət qədər məlumat yoxdur.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={seg.dash}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      {/* Center label is positioned absolutely using a relative parent */}
      {(centerLabel || centerSub) && (
        <div className="pointer-events-none relative -ml-[180px] flex h-[160px] w-[160px] flex-col items-center justify-center text-center">
          {centerLabel && (
            <p className="text-xl font-semibold">{centerLabel}</p>
          )}
          {centerSub && (
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              {centerSub}
            </p>
          )}
        </div>
      )}

      <ul className="flex-1 space-y-1.5 text-xs">
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 truncate">
                <span
                  className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="whitespace-nowrap text-neutral-600">
                <span className="font-semibold text-neutral-900">{s.value}</span>{' '}
                <span className="text-neutral-400">({pct.toFixed(0)}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
