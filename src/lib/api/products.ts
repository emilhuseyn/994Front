import { apiFetch } from './client';
import type {
  ApiProductDetail,
  ApiProductListItem,
  PaginatedList,
} from '../api-types';

export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: 0 | 1 | 2;
  color?: string;
  size?: string;
  sort?:
    | 'popular'
    | 'newest'
    | 'oldest'
    | 'price_asc'
    | 'price_desc'
    | 'name_asc'
    | 'name_desc'
    | 'stock_asc'
    | 'stock_desc'
    | 'relevant';
  search?: string;
  isFeatured?: boolean;
}

export const productsApi = {
  list(query: ProductListQuery = {}, silent = false) {
    return apiFetch<PaginatedList<ApiProductListItem>>('/api/products', {
      query: { ...query },
      silent,
    });
  },
  bySlug(slug: string, silent = false) {
    return apiFetch<ApiProductDetail>(`/api/products/${encodeURIComponent(slug)}`, {
      silent,
    });
  },
};
