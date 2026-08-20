import type { Locale } from './types';

export type CurrencyCode = 'AZN' | 'USD' | 'EUR' | 'RUB';

export const CURRENCY_ORDER: CurrencyCode[] = ['AZN', 'USD', 'EUR', 'RUB'];

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  AZN: '₼',
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === 'string' && (CURRENCY_ORDER as string[]).includes(v);
}

/** The site language picks the starting currency; the visitor can override it. */
export function defaultCurrencyForLocale(locale: Locale): CurrencyCode {
  if (locale === 'RUS') return 'RUB';
  if (locale === 'ENG') return 'USD';
  return 'AZN';
}

/**
 * Money formatting per currency:
 *   AZN  →  100,00 ₼   (same shape as the admin/base formatter)
 *   USD  →  $58.82
 *   EUR  →  €51.30
 *   RUB  →  4 559 ₽    (whole roubles — kopeks would read as noise)
 */
export function formatMoney(amount: number, code: CurrencyCode): string {
  const v = Number.isFinite(amount) ? amount : 0;
  switch (code) {
    case 'USD':
      return `$${v.toFixed(2)}`;
    case 'EUR':
      return `€${v.toFixed(2)}`;
    case 'RUB':
      return `${Math.round(v).toLocaleString('ru-RU')} ₽`;
    case 'AZN':
    default:
      return `${v.toFixed(2).replace('.', ',')} ₼`;
  }
}
