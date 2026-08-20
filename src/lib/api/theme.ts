import { apiFetch } from './client';
import type { Theme } from '../theme-types';

export const themeApi = {
  get(silent = false) {
    return apiFetch<Theme>('/api/theme', { cache: 'no-store', silent });
  },
  update(theme: Theme) {
    return apiFetch<Theme>('/api/admin/theme', { method: 'PUT', body: theme });
  },
  reset() {
    return apiFetch<Theme>('/api/admin/theme/reset', { method: 'POST' });
  },
};
