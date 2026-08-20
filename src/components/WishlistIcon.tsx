'use client';

import Link from 'next/link';
import { useWishlist } from './WishlistProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { useSiteSettings } from './SiteSettingsProvider';

/**
 * Header wishlist icon with a count badge — visual twin of `CartIcon`.
 * Links to `/wishlist`.  Hidden when the admin has disabled the wishlist
 * feature via `/admin/features`.
 */
export default function WishlistIcon() {
  const { count } = useWishlist();
  const { t } = useTranslation();
  const { get: getSetting, loaded } = useSiteSettings();
  // While site settings load we keep the icon hidden — otherwise it would
  // flicker for users in a "disabled wishlist" store on every page nav.
  const enabled =
    loaded &&
    !getSetting('feature.wishlist').trim().toLowerCase().startsWith('f');
  if (!enabled) return null;

  return (
    <Link
      href="/wishlist"
      aria-label={t('nav.wishlist')}
      className="relative text-black transition-colors hover:text-rose-600"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path
          d="M12 21s-7.5-4.7-9.5-9.4C1 7.6 4 4 7.5 4c1.9 0 3.6 1 4.5 2.5C12.9 5 14.6 4 16.5 4 20 4 23 7.6 21.5 11.6 19.5 16.3 12 21 12 21z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
