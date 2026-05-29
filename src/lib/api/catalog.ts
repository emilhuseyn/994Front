import { apiFetch } from './client';
import type { ApiBrand, ApiCategory, ApiColor, ApiSize } from '../api-types';

export interface CategoryTreeNode extends ApiCategory {
  children: CategoryTreeNode[];
}

export const catalogApi = {
  brands() {
    return apiFetch<ApiBrand[]>('/api/brands', { cache: 'no-store' });
  },
  categoriesTree() {
    return apiFetch<CategoryTreeNode[]>('/api/categories/tree', { cache: 'no-store' });
  },
  colors() {
    return apiFetch<ApiColor[]>('/api/colors', { cache: 'no-store', silent: true });
  },
  sizes() {
    return apiFetch<ApiSize[]>('/api/sizes', { cache: 'no-store', silent: true });
  },
};
