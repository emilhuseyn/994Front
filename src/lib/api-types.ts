// Types matching the backend (ECommerce.API) DTOs.
// Property names follow the camelCase JSON contract used by the API.

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
}

export interface PaginatedList<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Backend Gender enum: 0 = Men, 1 = Women, 2 = Unisex
export type ApiGender = 0 | 1 | 2;

export interface ApiProductListItem {
  id: number;
  nameAz: string;
  nameRu: string;
  nameEn?: string | null;
  slug: string;
  sku: string;
  basePrice: number;
  discountPrice?: number | null;
  effectivePrice: number;
  gender: ApiGender;
  brandId: number;
  brandName: string;
  brandSlug: string;
  categoryId: number;
  categoryNameAz: string;
  categorySlug: string;
  mainImageUrl?: string | null;
  hoverImageUrl?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  /** AZ color names from active variants. */
  colors: string[];
  /** Size names from active variants. */
  sizes: string[];
}

export interface ApiProductImage {
  id: number;
  imageUrl: string;
  altText?: string | null;
  isMain: boolean;
  sortOrder: number;
}

export interface ApiColor {
  id: number;
  nameAz: string;
  nameRu: string;
  nameEn?: string | null;
  hexCode: string;
}

export interface ApiSize {
  id: number;
  name: string;
  sortOrder: number;
}

export interface ApiProductVariant {
  id: number;
  colorId: number;
  colorNameAz: string;
  colorHex: string;
  sizeId: number;
  sizeName: string;
  stockQuantity: number;
  priceAdjustment: number;
  sku: string;
  isActive: boolean;
}

export interface ApiProductDetail extends ApiProductListItem {
  descriptionAz?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  availableColors: ApiColor[];
  availableSizes: ApiSize[];
  totalStock: number;
}

export interface ApiCategory {
  id: number;
  nameAz: string;
  nameRu: string;
  nameEn?: string | null;
  slug: string;
  parentCategoryId?: number | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface ApiBrand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  productCount: number;
}

export interface ApiCartItem {
  id: number;
  productVariantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  colorName: string;
  sizeName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockAvailable: number;
}

export interface ApiCart {
  id: number;
  userId?: number | null;
  sessionId?: string | null;
  items: ApiCartItem[];
  subtotal: number;
  totalItems: number;
}

export interface ApiUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: ApiUser;
}

export interface ApiOrderItem {
  id: number;
  productVariantId: number;
  productName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ApiOrder {
  id: number;
  orderNumber: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  status: number;
  paymentStatus: number;
  paymentMethod: number;
  notes?: string | null;
  createdAt: string;
  items: ApiOrderItem[];
}

export interface ApiSlider {
  id: number;
  titleAz: string;
  titleRu: string;
  titleEn?: string | null;
  subtitleAz?: string | null;
  subtitleRu?: string | null;
  subtitleEn?: string | null;
  imageUrl: string;
  buttonTextAz?: string | null;
  buttonTextRu?: string | null;
  buttonTextEn?: string | null;
  buttonUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ApiSiteSetting {
  id: number;
  key: string;
  valueAz?: string | null;
  valueRu?: string | null;
  valueEn?: string | null;
}

export interface ApiFilters {
  categories: ApiCategory[];
  brands: ApiBrand[];
  colors: ApiColor[];
  sizes: ApiSize[];
  genders: { value: ApiGender; nameAz: string; nameRu: string }[];
  minPrice: number;
  maxPrice: number;
}
