'use client';

import { useState } from 'react';
import { useWishlist, type WishlistEntry } from './WishlistProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { useSiteSettings } from './SiteSettingsProvider';

/**
 * Heart-icon toggle button.
 *
 * Three visual flavors via the `variant` prop:
 *   • `"card"` — small floating circle on product cards (default)
 *   • `"detail"` — larger pill next to the add-to-cart button
 *   • `"icon"` — bare icon only, for compact contexts
 *
 * Heart fills + animates briefly when toggled.  Click event is stopped so
 * the underlying `<Link>` (on product cards) doesn't navigate.
 */
interface Props {
  product: WishlistEntry;
  variant?: 'card' | 'detail' | 'icon';
  className?: string;
}

export default function WishlistButton({
  product,
  variant = 'card',
  className = '',
}: Props) {
  const { t } = useTranslation();
  const { has, toggle } = useWishlist();
  const { get: getSetting, loaded } = useSiteSettings();
  const [busy, setBusy] = useState(false);
  const [bump, setBump] = useState(false);

  // Hide the heart entirely when the admin has switched off the wishlist.
  const enabled =
    loaded &&
    !getSetting('feature.wishlist').trim().toLowerCase().startsWith('f');
  const isInWishlist = has(product.productId);
  if (!enabled) return null;

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setBump(true);
    try {
      await toggle(product);
    } catch {
      /* error already surfaced via API client message */
    } finally {
      setBusy(false);
      setTimeout(() => setBump(false), 300);
    }
  }

  const ariaLabel = isInWishlist
    ? t('product.removeFromWishlist')
    : t('product.addToWishlist');

  if (variant === 'detail') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isInWishlist}
        aria-label={ariaLabel}
        disabled={busy}
        className={`flex h-12 min-w-12 items-center justify-center gap-2 border px-4 text-sm transition-colors ${
          isInWishlist
            ? 'border-rose-500 bg-rose-50 text-rose-600'
            : 'border-neutral-300 hover:border-black'
        } ${className}`}
      >
        <HeartIcon filled={isInWishlist} bump={bump} />
        <span className="hidden sm:inline">
          {isInWishlist ? t('product.inWishlist') : t('product.addToWishlist')}
        </span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isInWishlist}
        aria-label={ariaLabel}
        disabled={busy}
        className={`text-neutral-700 transition-colors hover:text-rose-600 ${
          isInWishlist ? 'text-rose-600' : ''
        } ${className}`}
      >
        <HeartIcon filled={isInWishlist} bump={bump} />
      </button>
    );
  }

  // Default: floating card overlay
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isInWishlist}
      aria-label={ariaLabel}
      disabled={busy}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-rose-600 ${
        isInWishlist ? 'text-rose-600' : ''
      } ${className}`}
    >
      <HeartIcon filled={isInWishlist} bump={bump} />
    </button>
  );
}

function HeartIcon({ filled, bump }: { filled: boolean; bump: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      className={`transition-transform duration-300 ${
        bump ? 'scale-125' : 'scale-100'
      }`}
      aria-hidden="true"
    >
      <path
        d="M12 21s-7.5-4.7-9.5-9.4C1 7.6 4 4 7.5 4c1.9 0 3.6 1 4.5 2.5C12.9 5 14.6 4 16.5 4 20 4 23 7.6 21.5 11.6 19.5 16.3 12 21 12 21z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
