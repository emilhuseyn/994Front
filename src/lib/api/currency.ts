import { apiFetch } from './client';
import type { ApiCurrencyRates } from '../api-types';

export const currencyApi = {
  /** AZN-based rates; the backend caches them for 6h, so this is cheap. */
  rates(silent = true) {
    return apiFetch<ApiCurrencyRates>('/api/currency/rates', { silent });
  },
};
