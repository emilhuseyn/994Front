'use client';

import { useEffect } from 'react';
import { categories, parentCategories } from '@/data/categories';
import { COLOR_OPTIONS, COLOR_SWATCHES, SIZE_OPTIONS } from '@/data/products';
import type { Gender } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/dictionaries';

export interface Filters {
  category: string;
  priceMin: string;
  priceMax: string;
  genders: Gender[];
  colors: string[];
  sizes: string[];
}

export const defaultFilters: Filters = {
  category: '',
  priceMin: '',
  priceMax: '',
  genders: [],
  colors: [],
  sizes: [],
};

const GENDER_OPTIONS: { v: Gender; key: TranslationKey }[] = [
  { v: 'men', key: 'shop.gender.men' },
  { v: 'women', key: 'shop.gender.women' },
  { v: 'unisex', key: 'shop.gender.unisex' },
];

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onApplyPrice: () => void;
  onReset?: () => void;
  /**
   * Mobile drawer state.  Desktop (`lg+`) ignores both — the sidebar is
   * always visible there.  Below the lg breakpoint the component becomes a
   * left-side drawer with a backdrop, controlled by the parent.
   */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Catalog filter rail.
 *
 * • **Desktop (≥ lg)**: rendered inline as a 256 px sticky sidebar.
 * • **Mobile / tablet (< lg)**: hidden until the parent opens it; then it
 *   slides in from the left with a dim backdrop.  ESC closes it, body
 *   scroll is locked, and clicking outside dismisses it.
 *
 * The same DOM is used in both modes — Tailwind responsive classes flip
 * the layout — so React state inside the inputs survives breakpoint
 * changes (e.g. rotating a tablet from portrait to landscape).
 */
export default function FilterSidebar({
  filters,
  onChange,
  onApplyPrice,
  onReset,
  mobileOpen = false,
  onCloseMobile,
}: Props) {
  const { t, locale } = useTranslation();

  // Lock body scroll + listen for ESC while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseMobile?.();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen, onCloseMobile]);

  const localizedParent = (slug: string, fallback: string) => {
    if (locale === 'AZ') return fallback;
    if (slug === 'geyimler') return t('nav.clothing');
    if (slug === 'ayaqqabilar') return t('nav.shoes');
    if (slug === 'aksesuarlar') return t('nav.accessories');
    return fallback;
  };

  function toggle<T extends string>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  // The inner content is the same in both layouts.
  const content = (
    <>
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 lg:hidden">
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {t('shop.filters.title')}
        </h2>
        <button
          type="button"
          aria-label={t('nav.close')}
          onClick={onCloseMobile}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-black"
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
      </div>

      <div className="px-4 pt-4 lg:px-0 lg:pt-0">
        {/* Desktop heading (mobile gets the close-row above) */}
        <h2 className="mb-4 hidden text-sm font-semibold uppercase tracking-wider lg:block">
          {t('shop.filters.title')}
        </h2>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
            {t('shop.filters.category')}
          </label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="input-field"
          >
            <option value="">{t('shop.filters.allCategories')}</option>
            {parentCategories.map((p) => (
              <optgroup key={p.slug} label={localizedParent(p.slug, p.name)}>
                {categories
                  .filter((c) => c.parent === p.key)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
            {t('shop.filters.price')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t('shop.filters.min')}
              value={filters.priceMin}
              onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
              className="input-field"
            />
            <span className="text-neutral-400">—</span>
            <input
              type="number"
              placeholder={t('shop.filters.max')}
              value={filters.priceMax}
              onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
              className="input-field"
            />
          </div>
          <button
            type="button"
            onClick={onApplyPrice}
            className="mt-2 w-full border border-black px-3 py-2 text-xs font-medium uppercase tracking-wider hover:bg-black hover:text-white"
          >
            {t('shop.filters.apply')}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">
            {t('shop.filters.gender')}
          </h3>
          <ul className="space-y-1.5 text-sm">
            {GENDER_OPTIONS.map((g) => (
              <li key={g.v}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.genders.includes(g.v)}
                    onChange={() =>
                      onChange({
                        ...filters,
                        genders: toggle(filters.genders, g.v),
                      })
                    }
                    className="h-4 w-4 accent-black"
                  />
                  <span>{t(g.key)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">
            {t('shop.filters.color')}
          </h3>
          <ul className="flex flex-wrap gap-2 text-xs">
            {COLOR_OPTIONS.map((c) => {
              const active = filters.colors.includes(c);
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...filters, colors: toggle(filters.colors, c) })
                    }
                    className={`flex items-center gap-1 border px-2 py-1 ${
                      active
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 bg-white hover:border-black'
                    }`}
                  >
                    <span
                      className="inline-block h-3 w-3 border border-neutral-300"
                      style={{ backgroundColor: COLOR_SWATCHES[c] ?? '#ccc' }}
                    />
                    <span>{c}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">
            {t('shop.filters.size')}
          </h3>
          <ul className="flex flex-wrap gap-1.5 text-xs">
            {SIZE_OPTIONS.map((s) => {
              const active = filters.sizes.includes(s);
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...filters, sizes: toggle(filters.sizes, s) })
                    }
                    className={`min-w-[36px] border px-2 py-1 text-center ${
                      active
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 bg-white hover:border-black'
                    }`}
                  >
                    {s}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 lg:border-0 lg:pt-0">
          <button
            type="button"
            onClick={() => (onReset ? onReset() : onChange(defaultFilters))}
            className="text-xs uppercase tracking-wider text-neutral-500 hover:text-black"
          >
            {t('shop.filters.reset')}
          </button>
          {/* Mobile-only "view results" button — closes the drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden inline-flex items-center justify-center border border-black bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            {t('shop.filters.viewResults')}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: inline sidebar */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">{content}</aside>

      {/* Mobile drawer: portal-like, but stays within the layout flow.
          A fixed wrapper covers the viewport when `mobileOpen` is true. */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label={t('nav.close')}
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          tabIndex={mobileOpen ? 0 : -1}
        />
        {/* Sliding panel */}
        <div
          className={`absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-xl transition-transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={t('shop.filters.title')}
        >
          <div className="flex h-full flex-col overflow-y-auto">{content}</div>
        </div>
      </div>
    </>
  );
}
