import { apiFetch } from './client';
import type { ApiSiteSetting } from '../api-types';

export const siteSettingsApi = {
  list(silent = false) {
    return apiFetch<ApiSiteSetting[]>('/api/site-settings', {
      cache: 'no-store',
      silent,
    });
  },
};
