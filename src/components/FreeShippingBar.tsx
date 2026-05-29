'use client';

import { useSiteSettings } from './SiteSettingsProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice } from '@/lib/format';

/**
 * Free-shipping progress bar shown at the top of the cart.
 *
 * Conversions: showing the customer how close they are to free shipping
 * (and how little extra they'd need to spend) is one of the most reliable
 * AOV boosters in e-commerce — typical +15-20% basket size on tested
 * stores.
 *
 * Driven by two admin-controlled values:
 *   • `feature.freeShippingBar` — on/off toggle (site setting)
 *   • `freeShipping.threshold`  — money amount in AZN
 *
 * If the toggle is off we render nothing.  If the threshold isn't set we
 * fall back to 100 ₼ (matches the legacy hard-coded behaviour).
 */
export default function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { t } = useTranslation();
  const { get: getSetting, loaded } = useSiteSettings();

  // Defensive: until settings load, hide the bar so we don't flash an
  // incorrect "you still need X more" message.
  if (!loaded) return null;

  const enabled =
    !getSetting('feature.freeShippingBar')
      .trim()
      .toLowerCase()
      .startsWith('f');
  if (!enabled) return null;

  const threshold = parseThreshold(getSetting('freeShipping.threshold'));
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  const reached = remaining <= 0;

  return (
    <div
      className={`mb-6 overflow-hidden rounded-lg border ${
        reached
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50'
          : 'border-neutral-200 bg-neutral-50'
      } p-4`}
      role="status"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {reached ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <span aria-hidden className="text-lg">🎉</span>
            {t('cart.freeShipping.reached')}
          </p>
        ) : (
          <p className="text-sm text-neutral-700">
            {t('cart.freeShipping.remaining', {
              amount: formatPrice(remaining),
            })}
          </p>
        )}
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">
          {t('cart.freeShipping.thresholdLabel', { amount: formatPrice(threshold) })}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{ width: `${pct}%` }}
          className={`h-full transition-all duration-300 ${
            reached
              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
        />
      </div>
    </div>
  );
}

/** Parses a raw setting string into a positive threshold; defaults to 100. */
function parseThreshold(raw: string): number {
  const n = parseFloat(raw.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : 100;
}
