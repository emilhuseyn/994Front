'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { dictionaries, type TranslationKey } from './dictionaries';

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k]),
  );
}

export function useTranslation() {
  const { locale } = useLanguage();
  const dict = dictionaries[locale];

  const t = useCallback(
    (key: TranslationKey, vars?: Vars): string => {
      const value = dict[key];
      return interpolate(value, vars);
    },
    [dict],
  );

  return { t, locale };
}

// Pick a localised value from a trilingual record with sensible fallbacks:
// ENG → falls back to RU → AZ; RU → falls back to AZ; AZ → as-is.
export function pickByLocale(
  locale: 'AZ' | 'RUS' | 'ENG',
  az: string | null | undefined,
  ru: string | null | undefined,
  en?: string | null,
): string {
  if (locale === 'ENG') return (en?.trim() || ru?.trim() || az?.trim() || '') as string;
  if (locale === 'RUS') return (ru?.trim() || az?.trim() || '') as string;
  return (az?.trim() || '') as string;
}
