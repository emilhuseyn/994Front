'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { siteSettingsApi } from '@/lib/api/site-settings';
import { pickByLocale, useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/dictionaries';
import type { ApiSiteSetting } from '@/lib/api-types';

interface SiteSettingsContextValue {
  settings: Record<string, ApiSiteSetting>;
  loaded: boolean;
  /**
   * Resolve a piece of admin-editable content: prefer the SiteSettings row in
   * the current locale, otherwise fall back to the static i18n dictionary so
   * the UI is never empty.
   */
  content: (key: string, fallbackKey: TranslationKey) => string;
  /** Raw setting (any locale empty string is preserved). */
  get: (key: string) => string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useTranslation();
  const [settings, setSettings] = useState<Record<string, ApiSiteSetting>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    siteSettingsApi
      .list(true)
      .then((list) => {
        const map: Record<string, ApiSiteSetting> = {};
        for (const s of list ?? []) map[s.key] = s;
        setSettings(map);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo<SiteSettingsContextValue>(() => {
    const get = (key: string): string => {
      const s = settings[key];
      if (!s) return '';
      return pickByLocale(locale, s.valueAz, s.valueRu, s.valueEn);
    };
    const content = (key: string, fallbackKey: TranslationKey): string => {
      const v = get(key);
      return v.trim() ? v : t(fallbackKey);
    };
    return { settings, loaded, content, get };
  }, [settings, loaded, locale, t]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextValue {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx)
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}
