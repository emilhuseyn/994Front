import { apiFetch } from './client';

/**
 * One product saved by the current user to their wishlist.  The backend
 * shape matches `WishlistItemDto` from ECommerce.Application.DTOs.
 */
export interface WishlistItemApi {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  effectivePrice: number;
  mainImageUrl?: string | null;
  createdAt: string;
}

/**
 * Wishlist endpoints — all require authentication.  The provider handles
 * guest users via localStorage and only calls these helpers when the user
 * has a valid token.
 */
export const wishlistApi = {
  list() {
    return apiFetch<WishlistItemApi[]>('/api/wishlist', { cache: 'no-store' });
  },
  add(productId: number) {
    return apiFetch<null>(`/api/wishlist/${productId}`, { method: 'POST' });
  },
  remove(productId: number) {
    return apiFetch<null>(`/api/wishlist/${productId}`, { method: 'DELETE' });
  },
};
