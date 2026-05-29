'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  stylistApi,
  type StylistItemApi,
  type StylistStyle,
  type StylistSuggestionApi,
} from '@/lib/api/stylist';
import { resolveImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/dictionaries';
import { useSiteSettings } from './SiteSettingsProvider';

/**
 * "Complete the outfit" AI stylist module that lives on the product page.
 *
 * The user picks a style preset (or leaves it on auto-detect), the backend
 * calls Gemini, and we render the resulting 4-card outfit.  The anchor
 * product is highlighted with a "Sənin seçimin" badge; the other 3 cards
 * link to the suggested products with a "Why?" reason tooltip.
 *
 * Behaviour notes:
 *   • The first load happens automatically (auto style).  Switching styles
 *     re-fetches.
 *   • Backend returns `aiPowered: false` when Gemini is unavailable; we
 *     still render the deterministic fallback so the UI never breaks.
 *   • The component never blocks the page — errors are silent (the section
 *     simply shows the empty / fallback state).
 */
interface Props {
  productId: number;
}

const STYLES: { value: StylistStyle; labelKey: TranslationKey; emoji: string }[] = [
  { value: 'auto',       labelKey: 'stylist.style.auto',       emoji: '✨' },
  { value: 'streetwear', labelKey: 'stylist.style.streetwear', emoji: '🛹' },
  { value: 'minimal',    labelKey: 'stylist.style.minimal',    emoji: '⬜' },
  { value: 'oldmoney',   labelKey: 'stylist.style.oldmoney',   emoji: '🥂' },
  { value: 'techwear',   labelKey: 'stylist.style.techwear',   emoji: '🛰️' },
  { value: 'y2k',        labelKey: 'stylist.style.y2k',        emoji: '💿' },
  { value: 'sporty',     labelKey: 'stylist.style.sporty',     emoji: '🏃' },
  { value: 'classic',    labelKey: 'stylist.style.classic',    emoji: '🎩' },
  { value: 'boho',       labelKey: 'stylist.style.boho',       emoji: '🌾' },
  { value: 'casual',     labelKey: 'stylist.style.casual',     emoji: '👕' },
];

const ROLE_KEYS: Record<string, TranslationKey> = {
  top:       'stylist.role.top',
  bottom:    'stylist.role.bottom',
  shoes:     'stylist.role.shoes',
  accessory: 'stylist.role.accessory',
};

export default function OutfitBuilder({ productId }: Props) {
  const { t, locale } = useTranslation();
  // Admin can toggle this feature off in /admin/features.  Missing setting
  // (or any value other than "false") is treated as enabled — back-compat.
  const { get: getSetting, loaded: settingsLoaded } = useSiteSettings();
  const featureEnabled =
    !settingsLoaded ||
    !getSetting('feature.aiStylist').trim().toLowerCase().startsWith('f');

  const [style, setStyle] = useState<StylistStyle>('auto');
  const [suggestion, setSuggestion] = useState<StylistSuggestionApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (next: StylistStyle) => {
    setLoading(true);
    setError(null);
    try {
      const result = await stylistApi.suggest({
        productId,
        style: next,
        locale,
      });
      setSuggestion(result);
    } catch (err) {
      setError((err as Error).message);
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  }, [productId, locale]);

  useEffect(() => {
    // Don't waste a Gemini call when the admin has disabled the feature.
    if (!featureEnabled) return;
    load(style);
  }, [load, style, featureEnabled]);

  // Feature disabled in admin → render nothing.  The product page just
  // collapses cleanly between description and "Related products".
  if (!featureEnabled) return null;

  return (
    <section className="mt-12 rounded-lg border border-neutral-200 bg-gradient-to-br from-fuchsia-50/40 via-white to-indigo-50/40 p-5">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <SparkleIcon />
            {t('stylist.title')}
            {suggestion?.aiPowered && (
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                AI
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {t('stylist.subtitle')}
          </p>
        </div>
      </header>

      {/* Style chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STYLES.map((s) => {
          const active = style === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              disabled={loading}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-black'
              } disabled:opacity-50`}
            >
              <span aria-hidden>{s.emoji}</span>
              <span>{t(s.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Outfit name */}
      {suggestion?.outfitName && !loading && (
        <p className="mb-3 text-sm font-medium italic text-neutral-700">
          “{suggestion.outfitName}”
        </p>
      )}

      {/* AI-off banner — fallback path is style-agnostic, so the user would
          otherwise see identical results for every chip and not know why. */}
      {!loading && suggestion && !suggestion.aiPowered && (
        <div className="mb-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span aria-hidden className="text-base leading-none">⚠️</span>
          <div>
            <p className="font-semibold">{t('stylist.aiOff')}</p>
            <p className="mt-0.5 text-amber-800">{t('stylist.aiOffHint')}</p>
          </div>
        </div>
      )}

      {/* Card grid */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-4 text-xs text-amber-900">
          {t('stylist.error')}
        </div>
      ) : !suggestion || suggestion.items.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 bg-white px-3 py-8 text-center text-xs text-neutral-500">
          {t('stylist.empty')}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {orderItems(suggestion.items).map((item) => (
            <OutfitCard key={item.role + item.productId} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Card
// =============================================================================

function OutfitCard({ item }: { item: StylistItemApi }) {
  const { t } = useTranslation();
  const roleLabel = ROLE_KEYS[item.role] ? t(ROLE_KEYS[item.role]) : item.role;
  const imageSrc = item.imageUrl ? resolveImageUrl(item.imageUrl) : null;

  return (
    <li>
      <Link
        href={`/product/${item.productSlug}`}
        className={`group relative block overflow-hidden rounded-md border ${
          item.isAnchor
            ? 'border-fuchsia-400 ring-2 ring-fuchsia-200'
            : 'border-neutral-200 hover:border-black'
        } bg-white transition-colors`}
      >
        {/* Role chip top-left */}
        <span className="absolute left-2 top-2 z-10 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          {roleLabel}
        </span>
        {/* Anchor badge top-right */}
        {item.isAnchor && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t('stylist.anchor')}
          </span>
        )}
        <div className="relative aspect-square w-full bg-neutral-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.productName}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </div>
        <div className="p-2.5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">
            {item.brandName}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium">
            {item.productName}
          </p>
          <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
          {item.reason && (
            <p className="mt-2 line-clamp-3 text-[11px] italic text-neutral-600">
              “{item.reason}”
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

// =============================================================================
// Helpers
// =============================================================================

const ROLE_ORDER: Record<string, number> = {
  top: 0,
  bottom: 1,
  shoes: 2,
  accessory: 3,
};

/** Render order: top → bottom → shoes → accessory, regardless of API order. */
function orderItems(items: StylistItemApi[]): StylistItemApi[] {
  return [...items].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99),
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="aspect-[3/4] animate-pulse rounded-md bg-neutral-100"
        />
      ))}
    </ul>
  );
}

function SparkleIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-sm"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 10l.9 2.7L21.6 16l-2.7.9L18 19.6l-.9-2.7L14.4 16l2.7-.9L18 12zM5 14l.7 2.1L7.8 17l-2.1.7L5 19.8l-.7-2.1L2.2 17l2.1-.7L5 14z" />
      </svg>
    </span>
  );
}
