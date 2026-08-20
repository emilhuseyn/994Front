import { apiFetch } from './client';
import type { ApiOrder } from '../api-types';

export interface CreateOrderPayload {
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod?: 0 | 1 | 2;
  notes?: string;
  items?: { productVariantId: number; quantity: number }[];
}

export const ordersApi = {
  create(body: CreateOrderPayload) {
    return apiFetch<ApiOrder>('/api/orders', {
      method: 'POST',
      body,
      withSession: true,
    });
  },
  mine() {
    return apiFetch<ApiOrder[]>('/api/orders/my', { cache: 'no-store' });
  },
};
