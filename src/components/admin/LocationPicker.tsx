'use client';

import dynamic from 'next/dynamic';

/**
 * SSR-safe wrapper for the Leaflet-based store-location picker. Leaflet touches
 * `window` at module load, so the actual map lives in LocationPickerInner and
 * is loaded with `ssr: false`.
 */
const Inner = dynamic(() => import('./LocationPickerInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full animate-pulse rounded-lg bg-neutral-100" />
  ),
});

export default function LocationPicker(props: {
  value: string;
  onChange: (coords: string) => void;
}) {
  return <Inner {...props} />;
}
