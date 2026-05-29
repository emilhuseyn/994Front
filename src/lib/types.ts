export type Gender = 'men' | 'women' | 'unisex';

export type Locale = 'AZ' | 'RUS' | 'ENG';

export interface Product {
  id: string;
  slug: string;
  /** Az title — kept for backward compat with the old local data. */
  title: string;
  titleRu?: string;
  titleEn?: string;
  brand: string;
  brandSlug: string;
  /** Az category name. */
  category: string;
  categoryRu?: string;
  categoryEn?: string;
  categorySlug: string;
  parentCategory: 'clothing' | 'shoes' | 'accessories';
  price: number;
  oldPrice?: number;
  images: string[];
  /** AZ color names — index aligned with colorsRu/En. */
  colors: string[];
  colorsRu?: string[];
  colorsEn?: string[];
  sizes: string[];
  gender: Gender;
  /** Az description. */
  description: string;
  descriptionRu?: string;
  descriptionEn?: string;
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface Category {
  slug: string;
  name: string;
  parent: 'clothing' | 'shoes' | 'accessories';
}

export interface Brand {
  slug: string;
  name: string;
}

export type SortOption =
  | 'popularity'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'relevance';
