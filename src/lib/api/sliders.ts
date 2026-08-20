import { apiFetch } from './client';
import type { ApiSlider } from '../api-types';

export const slidersApi = {
  list(silent = false) {
    return apiFetch<ApiSlider[]>('/api/sliders', {
      cache: 'no-store',
      silent,
    });
  },
};
