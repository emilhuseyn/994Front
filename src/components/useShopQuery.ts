'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Gender, SortOption } from '@/lib/types';

/**
 * Strongly-typed, URL-persisted state for the shop / category catalog.
 *
 * Why URL params instead of `useState`?
 *   1. `ShopView` is re-mounted whenever the user clicks a pagination link
 *      (because the page route changes — e.g. `/shop` → `/shop/page/3`).
 *      Anything kept in local state would be wiped.
 *   2. Shareable / bookmarkable URLs (a customer can send a friend a link
 *      pre-filtered to "Wrangler, kişi, ucuzdan bahaya").
 *   3. Browser back/forward works naturally — each filter change is a
 *      history-friendly `replace`, but the path itself only changes when
 *      pagination changes.
 *
 * The hook returns:
 *   • `query` — the current, fully-decoded shop state
 *   • `updateQuery(patch)` — apply changes; **always navigates back to the
 *     base path** (page 1) so users don't end up stuck on an out-of-range
 *     page after narrowing the result set
 *   • `currentQueryString` — handy for building paginate links elsewhere
 */
export interface ShopQuery {
  sort: SortOption;
  category: string;
  priceMin: string;
  priceMax: string;
  genders: Gender[];
  colors: string[];
  sizes: string[];
  search: string;
}

const DEFAULT_QUERY: ShopQuery = {
  sort: 'popularity',
  category: '',
  priceMin: '',
  priceMax: '',
  genders: [],
  colors: [],
  sizes: [],
  search: '',
};

const VALID_SORTS: SortOption[] = [
  'popularity',
  'newest',
  'price-asc',
  'price-desc',
  'relevance',
];

const VALID_GENDERS: Gender[] = ['men', 'women', 'unisex'];

/**
 * Shape of the patch accepted by `updateQuery` — each key maps to the same
 * field on `ShopQuery`, but values can be set or cleared.
 */
export type ShopQueryPatch = {
  [K in keyof ShopQuery]?: ShopQuery[K];
};

export function useShopQuery(basePath: string) {
  const params = useSearchParams();
  const router = useRouter();

  const query: ShopQuery = useMemo(() => {
    const sortRaw = (params?.get('sort') ?? '') as SortOption;
    return {
      sort: VALID_SORTS.includes(sortRaw) ? sortRaw : DEFAULT_QUERY.sort,
      category: params?.get('cat') ?? '',
      priceMin: params?.get('min') ?? '',
      priceMax: params?.get('max') ?? '',
      genders: (params?.get('gender') ?? '')
        .split(',')
        .filter((g): g is Gender => VALID_GENDERS.includes(g as Gender)),
      colors: (params?.get('color') ?? '').split(',').filter(Boolean),
      sizes: (params?.get('size') ?? '').split(',').filter(Boolean),
      search: params?.get('q') ?? '',
    };
  }, [params]);

  const updateQuery = useCallback(
    (patch: ShopQueryPatch) => {
      const merged: ShopQuery = { ...query, ...patch };
      const usp = new URLSearchParams();
      if (merged.sort && merged.sort !== DEFAULT_QUERY.sort) {
        usp.set('sort', merged.sort);
      }
      if (merged.category) usp.set('cat', merged.category);
      if (merged.priceMin) usp.set('min', merged.priceMin);
      if (merged.priceMax) usp.set('max', merged.priceMax);
      if (merged.genders.length > 0) usp.set('gender', merged.genders.join(','));
      if (merged.colors.length > 0) usp.set('color', merged.colors.join(','));
      if (merged.sizes.length > 0) usp.set('size', merged.sizes.join(','));
      if (merged.search) usp.set('q', merged.search);

      const qs = usp.toString();
      // Filter / sort / search changes always reset to page 1 so we don't
      // strand the user on an out-of-range page after narrowing results.
      const href = qs ? `${basePath}?${qs}` : basePath;
      router.replace(href, { scroll: false });
    },
    [query, router, basePath],
  );

  const reset = useCallback(() => {
    router.replace(basePath, { scroll: false });
  }, [router, basePath]);

  const currentQueryString = params?.toString() ?? '';

  return { query, updateQuery, reset, currentQueryString };
}
