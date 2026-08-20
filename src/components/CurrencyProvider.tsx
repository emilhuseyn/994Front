'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { currencyApi } from '@/lib/api/currency';
import { useLanguage } from './LanguageProvider';
import {
  CURRENCY_ORDER,
  defaultCurrencyForLocale,
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
} from '@/lib/currency';

const STORAGE_KEY = 'code994.currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  /** Units of `currency` per 1 AZN. */
  rate: number;
  ready: boolean;
  /** "cbar" | "er-api" | "cache" | "none" */
  source: string;
  updatedAt: string | null;
  /** True while the base currency (AZN) is selected — nothing is converted. */
  isBase: boolean;
  convert: (azn: number) => number;
  /** Converted + formatted; prefixed with ≈ when it isn't the base currency. */
  format: (azn: number) => string;
  /** Always the real AZN amount — what the shop actually charges. */
  formatAzn: (azn: number) => string;
  available: CurrencyCode[];
}

const Ctx = createContext<CurrencyContextValue | null>(null);

/**
 * Display-only currency switching. Prices live in AZN everywhere (DB, orders,
 * admin); this converts them for the visitor and always keeps the real manat
 * figure in reach. A currency is only offered once we actually hold a rate for
 * it, so a failed rate fetch degrades to plain AZN rather than wrong numbers.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [rates, setRates] = useState<Record<string, number>>({ AZN: 1 });
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState('none');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  // Set only when the visitor picks by hand; otherwise the language decides.
  const [manual, setManual] = useState<CurrencyCode | null>(null);

  useEffect(() => {
    try {
      const s = window.localStorage.getItem(STORAGE_KEY);
      if (isCurrencyCode(s)) setManual(s);
    } catch {
      /* private mode / blocked storage — just follow the language */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    currencyApi
      .rates()
      .then((r) => {
        if (cancelled || !r?.rates) return;
        setRates({ AZN: 1, ...r.rates });
        setSource(r.source ?? 'none');
        setUpdatedAt(r.updatedAt ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const preferred = manual ?? defaultCurrencyForLocale(locale);
    const available = CURRENCY_ORDER.filter(
      (c) => c === 'AZN' || typeof rates[c] === 'number',
    );
    const currency: CurrencyCode = available.includes(preferred) ? preferred : 'AZN';
    const rate = currency === 'AZN' ? 1 : rates[currency] ?? 1;
    const isBase = currency === 'AZN';

    const convert = (azn: number) => azn * rate;
    const format = (azn: number) =>
      isBase ? formatMoney(azn, 'AZN') : `≈ ${formatMoney(convert(azn), currency)}`;
    const formatAzn = (azn: number) => formatMoney(azn, 'AZN');
    const setCurrency = (c: CurrencyCode) => {
      setManual(c);
      try {
        window.localStorage.setItem(STORAGE_KEY, c);
      } catch {
        /* ignore */
      }
    };

    return {
      currency,
      setCurrency,
      rate,
      ready,
      source,
      updatedAt,
      isBase,
      convert,
      format,
      formatAzn,
      available,
    };
  }, [manual, locale, rates, ready, source, updatedAt]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
