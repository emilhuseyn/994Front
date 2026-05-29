'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { useWishlist } from '@/components/WishlistProvider';
import { useAuth } from '@/components/AuthProvider';
import { useSiteSettings } from '@/components/SiteSettingsProvider';
import { resolveImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Customer-facing wishlist page.
 *
 * Layout:
 *   • Breadcrumb + title with count
 *   • Empty state if nothing saved
 *   • Responsive grid of product cards — each shows image, name, price,
 *     and a "Sil" (remove) button + "Bax" (view) link
 *   • Auth nudge at the bottom for guest users — explains that signing in
 *     keeps the wishlist across devices
 *
 * Works for both guest users (localStorage-backed) and signed-in users
 * (server-backed via /api/wishlist).
 */
export default function WishlistPage() {
  const { t } = useTranslation();
  const { items, count, loading, remove, clear } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { get: getSetting, loaded: settingsLoaded } = useSiteSettings();
  const [removingId, setRemovingId] = useState<number | null>(null);

  // If admin disabled the wishlist feature, show a polite "not available"
  // page instead of the gallery.  We still render breadcrumbs so the user
  // has navigation, but the body is replaced with a guard message.
  const featureEnabled =
    !settingsLoaded ||
    !getSetting('feature.wishlist').trim().toLowerCase().startsWith('f');

  async function handleRemove(productId: number) {
    setRemovingId(productId);
    try {
      await remove(productId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="container-shop py-8">
      <Breadcrumb
        items={[
          { href: '/', label: t('shop.breadcrumb.home') },
          { label: t('wishlist.title') },
        ]}
      />

      {!featureEnabled && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
            <span className="text-3xl" aria-hidden>🚫</span>
          </div>
          <h1 className="text-lg font-semibold">{t('wishlist.featureOffTitle')}</h1>
          <p className="max-w-md text-sm text-neutral-500">
            {t('wishlist.featureOffHint')}
          </p>
          <Link href="/shop" className="btn-primary mt-2">
            {t('wishlist.goShop')}
          </Link>
        </div>
      )}

      {featureEnabled && (
      <>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold uppercase tracking-wider">
            <HeartIcon /> {t('wishlist.title')}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t('wishlist.subtitle')}
          </p>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">
              {t('wishlist.count', { count })}
            </span>
            <button
              type="button"
              onClick={() => clear()}
              className="text-xs text-neutral-500 underline-offset-2 hover:text-black hover:underline"
            >
              {t('cart.clear')}
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded bg-neutral-100"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WishlistCard
                key={item.productId}
                item={item}
                removing={removingId === item.productId}
                onRemove={() => handleRemove(item.productId)}
              />
            ))}
          </div>

          {!isAuthenticated && (
            <AuthNudge />
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}

// =============================================================================

function WishlistCard({
  item,
  removing,
  onRemove,
}: {
  item: ReturnType<typeof useWishlist>['items'][number];
  removing: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const image = item.mainImageUrl ? resolveImageUrl(item.mainImageUrl) : null;

  return (
    <article className="group flex flex-col">
      <Link
        href={`/product/${item.productSlug ?? ''}`}
        className="relative block aspect-square overflow-hidden bg-neutral-100"
      >
        {image ? (
          <Image
            src={image}
            alt={item.productName ?? ''}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label={t('wishlist.remove')}
          disabled={removing}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm backdrop-blur-sm transition hover:bg-rose-600 hover:text-white disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Link>
      <div className="mt-3 text-center">
        <Link
          href={`/product/${item.productSlug ?? ''}`}
          className="block text-sm font-medium hover:underline"
        >
          {item.productName ?? '—'}
        </Link>
        <p className="mt-1 text-sm font-semibold">
          {item.effectivePrice !== undefined ? formatPrice(item.effectivePrice) : ''}
        </p>
      </div>
    </article>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="mt-16 flex flex-col items-center gap-3 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
        <HeartIcon size={42} className="text-rose-300" />
      </div>
      <h2 className="text-lg font-semibold">{t('wishlist.empty')}</h2>
      <p className="max-w-md text-sm text-neutral-500">
        {t('wishlist.emptyHint')}
      </p>
      <Link href="/shop" className="btn-primary mt-2">
        {t('wishlist.goShop')}
      </Link>
    </div>
  );
}

function AuthNudge() {
  return (
    <div className="mt-12 flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-6 text-center sm:flex-row sm:gap-4 sm:text-left">
      <span className="text-3xl">🔐</span>
      <div className="flex-1">
        <p className="font-medium">
          Hesabla daxil olun — istək siyahınız bütün cihazlarınızda sinxronlaşacaq
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Hal-hazırda bu siyahı yalnız bu brauzerdə saxlanır.
        </p>
      </div>
      <Link
        href="/admin/login"
        className="rounded border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
      >
        Daxil ol
      </Link>
    </div>
  );
}

function HeartIcon({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s-7.5-4.7-9.5-9.4C1 7.6 4 4 7.5 4c1.9 0 3.6 1 4.5 2.5C12.9 5 14.6 4 16.5 4 20 4 23 7.6 21.5 11.6 19.5 16.3 12 21 12 21z" />
    </svg>
  );
}
