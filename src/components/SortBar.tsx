'use client';

import type { SortOption } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/dictionaries';

interface Props {
  value: SortOption;
  onChange: (v: SortOption) => void;
  total: number;
  currentPage: number;
  perPage: number;
}

const SORT_TRANSLATION_KEYS: Record<SortOption, TranslationKey> = {
  popularity: 'shop.sort.popularity',
  newest: 'shop.sort.newest',
  'price-asc': 'shop.sort.price_asc',
  'price-desc': 'shop.sort.price_desc',
  relevance: 'shop.sort.relevance',
};

export default function SortBar({
  value,
  onChange,
  total,
  currentPage,
  perPage,
}: Props) {
  const { t } = useTranslation();
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center">
      <p className="text-xs text-neutral-500">
        {total > 0
          ? t('shop.rangeOf', { from, to, total })
          : t('shop.noProducts')}
      </p>
      <label className="flex items-center gap-2 text-xs text-neutral-700">
        <span className="uppercase tracking-wider">{t('shop.sortBy')}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="input-field text-sm"
        >
          {(Object.keys(SORT_TRANSLATION_KEYS) as SortOption[]).map((k) => (
            <option key={k} value={k}>
              {t(SORT_TRANSLATION_KEYS[k])}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
