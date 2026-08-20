'use client';

import { Suspense, useDeferredValue, useEffect, useMemo, useState } from 'react';
import FilterSidebar, { type Filters } from './FilterSidebar';
import SortBar from './SortBar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import type { Product } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';
import { useShopQuery } from './useShopQuery';

interface Props {
  products: Product[];
  currentPage: number;
  perPage?: number;
  basePath?: string;
}

/**
 * Storefront catalog view (used by `/shop`, `/shop/page/N`, and the category
 * pages).  All filter, sort, and search state lives in the URL via
 * `useShopQuery` — that way pagination links and a hard refresh preserve the
 * user's choices, and the URL is shareable.
 *
 * `useShopQuery` (and `Pagination`) call `useSearchParams()`, which forces a
 * client-side-render bailout.  Next.js requires such components to sit inside
 * a Suspense boundary or the production build fails to prerender the page —
 * hence the thin Suspense wrapper around the real implementation below.
 */
export default function ShopView(props: Props) {
  return (
    <Suspense fallback={<div className="container-shop py-8" />}>
      <ShopViewInner {...props} />
    </Suspense>
  );
}

/**
 * The search input is the one local-only piece of state: we mirror the URL
 * into a controlled input and only push back to the URL when the user pauses
 * typing (300 ms debounce).  Otherwise every keystroke would push a history
 * entry / trigger a re-render storm.
 */
function ShopViewInner({
  products,
  currentPage,
  perPage = 12,
  basePath = '/shop',
}: Props) {
  const { t } = useTranslation();
  const { query, updateQuery, reset } = useShopQuery(basePath);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Mirror the URL search into a local input value so typing feels instant.
  // We push back to the URL on a short debounce.
  const [searchInput, setSearchInput] = useState(query.search);
  // Keep the input in sync when the URL changes from outside (back button,
  // category change, "Sıfırla" button, etc.).
  useEffect(() => {
    setSearchInput(query.search);
  }, [query.search]);
  useEffect(() => {
    if (searchInput === query.search) return;
    const id = window.setTimeout(() => {
      updateQuery({ search: searchInput });
    }, 300);
    return () => window.clearTimeout(id);
    // updateQuery is stable per-render but referencing `query` would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);
  // The deferred value keeps the grid render from blocking each keystroke.
  const search = useDeferredValue(searchInput);

  // Adapter — the sidebar still uses the local `Filters` shape.  Memoised
  // so it's reference-stable across renders (otherwise the `useMemo` below
  // would re-filter on every render).
  const filters: Filters = useMemo(
    () => ({
      category: query.category,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      genders: query.genders,
      colors: query.colors,
      sizes: query.sizes,
    }),
    [
      query.category,
      query.priceMin,
      query.priceMax,
      query.genders,
      query.colors,
      query.sizes,
    ],
  );

  const filtered = useMemo(() => {
    let list = [...products];

    // Full-text search across name (all locales), brand and category.  Each
    // search token must hit somewhere in the haystack — so "wrangler crop"
    // matches a Wrangler Crop Top, not products containing only "crop".
    const needle = search.trim().toLowerCase();
    if (needle.length > 0) {
      const tokens = needle.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const haystack = [
          p.title,
          p.titleRu,
          p.titleEn,
          p.brand,
          p.brandSlug,
          p.category,
          p.categoryRu,
          p.categoryEn,
          p.categorySlug,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return tokens.every((tok) => haystack.includes(tok));
      });
    }
    if (filters.category) {
      list = list.filter((p) => p.categorySlug === filters.category);
    }
    const min = parseFloat(filters.priceMin);
    const max = parseFloat(filters.priceMax);
    if (!Number.isNaN(min)) list = list.filter((p) => p.price >= min);
    if (!Number.isNaN(max)) list = list.filter((p) => p.price <= max);
    if (filters.genders.length > 0) {
      list = list.filter((p) => filters.genders.includes(p.gender));
    }
    if (filters.colors.length > 0) {
      list = list.filter((p) =>
        p.colors.some((c) => filters.colors.includes(c)),
      );
    }
    if (filters.sizes.length > 0) {
      list = list.filter((p) =>
        p.sizes.some((s) => filters.sizes.includes(s)),
      );
    }

    switch (query.sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort((a, b) => Number(b.isNew ?? 0) - Number(a.isNew ?? 0));
        break;
      case 'popularity':
        list.sort(
          (a, b) => Number(b.isFeatured ?? 0) - Number(a.isFeatured ?? 0),
        );
        break;
      default:
        break;
    }
    return list;
  }, [products, filters, query.sort, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  // Count active filters for the mobile "Filterlər (N)" badge.  Each price
  // bound counts once; the category, gender list, colour list and size list
  // each contribute one notch.
  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    filters.genders.length +
    filters.colors.length +
    filters.sizes.length;

  return (
    <div className="container-shop py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar
          filters={filters}
          mobileOpen={filtersOpen}
          onCloseMobile={() => setFiltersOpen(false)}
          onChange={(next) => {
            updateQuery({
              category: next.category,
              priceMin: next.priceMin,
              priceMax: next.priceMax,
              genders: next.genders,
              colors: next.colors,
              sizes: next.sizes,
            });
          }}
          onApplyPrice={() => {
            // The min/max inputs are already in `filters` because we forward
            // them via onChange — Apply is now just a visual confirmation
            // (and resets to page 1 by re-issuing the same patch).
            updateQuery({
              priceMin: filters.priceMin,
              priceMax: filters.priceMax,
            });
          }}
          onReset={reset}
        />
        <div className="min-w-0 flex-1">
          {/* Search input + mobile filter trigger.  On large screens the
              filter button is hidden since the sidebar is always visible. */}
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative flex h-[42px] flex-shrink-0 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:border-black lg:hidden"
              aria-label={t('shop.filters.title')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M6 12h12M10 18h4" />
              </svg>
              <span className="hidden sm:inline">{t('shop.filters.title')}</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('shop.searchPlaceholder')}
                aria-label={t('shop.searchPlaceholder')}
                className="block w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm outline-none placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label={t('shop.searchClear')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {search.trim() && (
            <p className="mb-3 text-xs text-neutral-500">
              {total > 0
                ? t('shop.searchResults', { count: total, query: search.trim() })
                : t('shop.searchNoResults', { query: search.trim() })}
            </p>
          )}
          <SortBar
            value={query.sort}
            onChange={(s) => updateQuery({ sort: s })}
            total={total}
            currentPage={safePage}
            perPage={perPage}
          />
          <ProductGrid products={pageItems} />
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </div>
      </div>
    </div>
  );
}
