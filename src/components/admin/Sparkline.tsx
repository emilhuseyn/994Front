'use client';

interface Props {
  values: number[];
  width?: number;
  height?: number;
  /** CSS colour or `currentColor`. */
  stroke?: string;
  fill?: string;
}

/**
 * Tiny inline SVG sparkline — meant to sit inside a KPI card so the eye picks
 * up the trend at a glance without a full chart.
 */
export default function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = 'currentColor',
  fill,
}: Props) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      {fill && <path d={areaD} fill={fill} opacity={0.25} />}
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last-point dot */}
      <circle
        cx={(values.length - 1) * step}
        cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2}
        r={2}
        fill={stroke}
      />
    </svg>
  );
}
