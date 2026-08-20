'use client';

/**
 * Store-location map for the storefront (About page).
 *
 * `query` is either "lat,lng" coordinates (precise pin) or a free-text address;
 * Google geocodes it either way. Uses Google Maps' key-free embed
 * (`output=embed`) — a real Google map, no API key, no billing — plus a
 * deep-link that opens the location in the Google Maps app / site.
 */
export default function StoreMap({
  query,
  label,
}: {
  query: string;
  label?: string;
}) {
  const q = query.trim();
  if (!q) return null;

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <iframe
        title={label ? `Google Maps: ${label}` : 'Google Maps'}
        src={embedSrc}
        loading="lazy"
        className="block h-72 w-full"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
        <span className="truncate">📍 {label || q}</span>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-shrink-0 items-center gap-1 font-semibold text-neutral-700 hover:text-black hover:underline"
        >
          Google Maps
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
            <path
              d="M14 4h6v6M20 4l-8 8M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
