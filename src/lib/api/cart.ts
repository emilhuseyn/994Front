import { apiFetch } from './client';
import type { ApiCart } from '../api-types';

export const cartApi = {
  get() {
    return apiFetch<ApiCart>('/api/cart', { withSession: true, cache: 'no-store' });
  },
  addItem(productVariantId: number, quantity: number) {
    return apiFetch<ApiCart>('/api/cart/items', {
      method: 'POST',
      body: { productVariantId, quantity },
      withSession: true,
    });
  },
  updateItem(itemId: number, quantity: number) {
    return apiFetch<ApiCart>(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      body: { quantity },
      withSession: true,
    });
  },
  removeItem(itemId: number) {
    return apiFetch<ApiCart>(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      withSession: true,
    });
  },
  clear() {
    return apiFetch<null>('/api/cart/clear', {
      method: 'DELETE',
      withSession: true,
    });
  },
};
