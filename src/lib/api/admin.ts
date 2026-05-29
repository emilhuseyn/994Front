import { apiFetch } from './client';
import type {
  ApiBrand,
  ApiCategory,
  ApiColor,
  ApiOrder,
  ApiProductDetail,
  ApiProductImage,
  ApiProductVariant,
  ApiSiteSetting,
  ApiSize,
  ApiSlider,
  PaginatedList,
} from '../api-types';

// ---- Products ---------------------------------------------------------------

export interface ProductWriteDto {
  nameAz: string;
  nameRu: string;
  nameEn?: string;
  slug?: string;
  descriptionAz?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  sku: string;
  basePrice: number;
  discountPrice?: number | null;
  gender: 0 | 1 | 2;
  brandId: number;
  categoryId: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ProductImageUpload {
  files: File[];
}

export interface VariantWriteDto {
  colorId: number;
  sizeId: number;
  stockQuantity: number;
  priceAdjustment: number;
  sku?: string;
  isActive?: boolean;
}

export interface VariantUpdateDto {
  stockQuantity: number;
  priceAdjustment: number;
  sku?: string;
  isActive?: boolean;
}

// ---- Categories -------------------------------------------------------------

export interface CategoryWriteDto {
  nameAz: string;
  nameRu: string;
  nameEn?: string;
  slug?: string;
  parentCategoryId?: number | null;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ---- Brands -----------------------------------------------------------------

export interface BrandWriteDto {
  name: string;
  slug?: string;
  logoUrl?: string;
  isActive?: boolean;
}

// ---- Colors -----------------------------------------------------------------

export interface ColorWriteDto {
  nameAz: string;
  nameRu: string;
  nameEn?: string;
  hexCode: string;
}

// ---- Sizes ------------------------------------------------------------------

export interface SizeWriteDto {
  name: string;
  sortOrder: number;
}

// ---- Sliders ----------------------------------------------------------------

export interface SliderWriteDto {
  titleAz: string;
  titleRu: string;
  titleEn?: string;
  subtitleAz?: string;
  subtitleRu?: string;
  subtitleEn?: string;
  imageUrl: string;
  buttonTextAz?: string;
  buttonTextRu?: string;
  buttonTextEn?: string;
  buttonUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ---- Users ------------------------------------------------------------------

export interface AdminUserApi {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: number;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserDto {
  fullName: string;
  phoneNumber?: string;
  role: number;
  isActive: boolean;
}

export interface CreateAdminDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

// ---- Dashboard --------------------------------------------------------------

export interface TopProductApi {
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string | null;
  unitsSold: number;
  revenue: number;
}

export interface DailyRevenuePointApi {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RecentOrderApi {
  id: number;
  orderNumber: string;
  customerFullName: string;
  totalAmount: number;
  status: number;
  createdAt: string;
}

export interface TopBrandApi {
  brandId: number;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
}

export interface TopCategoryApi {
  categoryId: number;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
}

export interface TopCustomerApi {
  customerFullName: string;
  customerEmail: string;
  orderCount: number;
  totalSpent: number;
}

export interface LowStockProductApi {
  productId: number;
  productName: string;
  productSlug: string;
  stockRemaining: number;
  variantsAtRisk: number;
}

export interface HourlyOrderPointApi {
  hour: number;
  orderCount: number;
  revenue: number;
}

export interface DayOfWeekPointApi {
  dayOfWeek: number;
  orderCount: number;
  revenue: number;
}

export interface TopColorApi {
  colorId: number;
  name: string;
  hexCode: string;
  unitsSold: number;
}

export interface HeatmapCellApi {
  dayOfWeek: number;
  hour: number;
  orderCount: number;
}

/** Stagnating product surfaced on the admin dashboard. */
export interface DeadProductApi {
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string | null;
  brandName: string;
  price: number;
  stockRemaining: number;
  daysSinceCreated: number;
  daysSinceLastSale: number | null;
  totalSold: number;
}

/** One bubble on the dashboard's Azerbaijan order map. */
export interface CityOrderApi {
  city: string;
  lat: number;
  lng: number;
  orderCount: number;
  revenue: number;
}

/** Narrated observation built server-side from raw analytics. */
export interface InsightApi {
  tone: 'positive' | 'warning' | 'info' | 'critical' | string;
  icon: string;
  title: string;
  description: string;
  metric?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
  priority: number;
}

export interface DashboardStatsApi {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersLast30Days: number;
  totalRevenue: number;
  revenue30Days: number;
  unreadMessages: number;
  lowStockVariants: number;
  totalCustomers: number;

  averageOrderValue: number;
  inventoryValue: number;
  newCustomers30Days: number;
  averageItemsPerOrder: number;
  repeatCustomers: number;
  activeCarts: number;

  previousPeriodRevenue: number;
  previousPeriodOrders: number;
  previousPeriodNewCustomers: number;

  variantsInStock: number;
  variantsLowStock: number;
  variantsOutOfStock: number;

  ordersByStatus: Record<string, number>;
  ordersByGender: Record<string, number>;
  ordersByPaymentMethod: Record<string, number>;

  topProducts: TopProductApi[];
  topBrands: TopBrandApi[];
  topCategories: TopCategoryApi[];
  topCustomers: TopCustomerApi[];
  topColors: TopColorApi[];
  lowStockProducts: LowStockProductApi[];

  revenue30DaysChart: DailyRevenuePointApi[];
  hourlyDistribution: HourlyOrderPointApi[];
  dayOfWeekDistribution: DayOfWeekPointApi[];
  hourDayHeatmap: HeatmapCellApi[];
  recentOrders: RecentOrderApi[];

  /**
   * Heuristic-generated narrated observations ("Smart Insights").
   * Optional because older backend builds don't include this field yet —
   * the dashboard guards against `undefined` on every access.
   */
  insights?: InsightApi[];

  /**
   * Order counts grouped by detected AZ city (for the map heatmap).
   * Optional because older backend builds don't include this field yet.
   */
  ordersByCity?: CityOrderApi[];

  /**
   * Active products that haven't sold in the last 45 days.
   * Optional because older backend builds don't include this field yet.
   */
  deadProducts?: DeadProductApi[];
}

// ---- Contact messages -------------------------------------------------------

export interface AdminContactMessage {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ---- Orders -----------------------------------------------------------------

export interface OrderStatusUpdate {
  status: number;
  paymentStatus?: number;
}

// =============================================================================

export const adminApi = {
  products: {
    get(id: number) {
      return apiFetch<ApiProductDetail>(`/api/admin/products/${id}`, {
        cache: 'no-store',
      });
    },
    create(body: ProductWriteDto) {
      return apiFetch<ApiProductDetail>('/api/admin/products', {
        method: 'POST',
        body: { ...body, variants: [], images: [] },
      });
    },
    update(id: number, body: ProductWriteDto) {
      return apiFetch<ApiProductDetail>(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: { ...body, variants: [], images: [] },
      });
    },
    remove(id: number) {
      return apiFetch<null>(`/api/admin/products/${id}`, { method: 'DELETE' });
    },
    uploadImages(productId: number, files: File[]) {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      return apiFetch<ApiProductImage[]>(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: fd,
      });
    },
    deleteImage(imageId: number) {
      return apiFetch<null>(`/api/admin/product-images/${imageId}`, {
        method: 'DELETE',
      });
    },
    setMainImage(imageId: number) {
      return apiFetch<ApiProductImage>(`/api/admin/product-images/${imageId}/main`, {
        method: 'PUT',
      });
    },
    addVariant(productId: number, body: VariantWriteDto) {
      return apiFetch<ApiProductVariant>(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        body,
      });
    },
    updateVariant(variantId: number, body: VariantUpdateDto) {
      return apiFetch<ApiProductVariant>(`/api/admin/product-variants/${variantId}`, {
        method: 'PUT',
        body,
      });
    },
    deleteVariant(variantId: number) {
      return apiFetch<null>(`/api/admin/product-variants/${variantId}`, {
        method: 'DELETE',
      });
    },
  },
  categories: {
    create(body: CategoryWriteDto) {
      return apiFetch<ApiCategory>('/api/admin/categories', {
        method: 'POST',
        body,
      });
    },
    update(id: number, body: CategoryWriteDto) {
      return apiFetch<ApiCategory>(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body,
      });
    },
    remove(id: number) {
      return apiFetch<null>(`/api/admin/categories/${id}`, { method: 'DELETE' });
    },
  },
  brands: {
    create(body: BrandWriteDto) {
      return apiFetch<ApiBrand>('/api/admin/brands', { method: 'POST', body });
    },
    update(id: number, body: BrandWriteDto) {
      return apiFetch<ApiBrand>(`/api/admin/brands/${id}`, { method: 'PUT', body });
    },
    remove(id: number) {
      return apiFetch<null>(`/api/admin/brands/${id}`, { method: 'DELETE' });
    },
  },
  colors: {
    create(body: ColorWriteDto) {
      return apiFetch<ApiColor>('/api/admin/colors', { method: 'POST', body });
    },
    update(id: number, body: ColorWriteDto) {
      return apiFetch<ApiColor>(`/api/admin/colors/${id}`, { method: 'PUT', body });
    },
    remove(id: number) {
      return apiFetch<null>(`/api/admin/colors/${id}`, { method: 'DELETE' });
    },
  },
  sizes: {
    create(body: SizeWriteDto) {
      return apiFetch<ApiSize>('/api/admin/sizes', { method: 'POST', body });
    },
    update(id: number, body: SizeWriteDto) {
      return apiFetch<ApiSize>(`/api/admin/sizes/${id}`, { method: 'PUT', body });
    },
    remove(id: number) {
      return apiFetch<null>(`/api/admin/sizes/${id}`, { method: 'DELETE' });
    },
  },
  orders: {
    list(params?: { page?: number; pageSize?: number; status?: number; search?: string }) {
      return apiFetch<PaginatedList<ApiOrder>>('/api/admin/orders', {
        query: { ...params },
        cache: 'no-store',
      });
    },
    get(id: number) {
      return apiFetch<ApiOrder>(`/api/admin/orders/${id}`, { cache: 'no-store' });
    },
    updateStatus(id: number, body: OrderStatusUpdate) {
      return apiFetch<ApiOrder>(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        body,
      });
    },
  },
  contactMessages: {
    list(params?: { page?: number; pageSize?: number; isRead?: boolean }) {
      return apiFetch<PaginatedList<AdminContactMessage>>('/api/admin/contact-messages', {
        query: { ...params },
        cache: 'no-store',
      });
    },
    markRead(id: number) {
      return apiFetch<null>(`/api/admin/contact-messages/${id}/read`, {
        method: 'PUT',
      });
    },
  },
  sliders: {
    list() {
      return apiFetch<ApiSlider[]>('/api/admin/sliders', { cache: 'no-store' });
    },
    create(body: SliderWriteDto) {
      return apiFetch<ApiSlider>('/api/admin/sliders', { method: 'POST', body });
    },
    update(id: number, body: SliderWriteDto) {
      return apiFetch<ApiSlider>(`/api/admin/sliders/${id}`, { method: 'PUT', body });
    },
    remove(id: number) {
      return apiFetch<null>(`/api/admin/sliders/${id}`, { method: 'DELETE' });
    },
  },
  siteSettings: {
    list() {
      return apiFetch<ApiSiteSetting[]>('/api/site-settings', { cache: 'no-store' });
    },
    update(key: string, body: { valueAz?: string; valueRu?: string; valueEn?: string }) {
      return apiFetch<ApiSiteSetting>(`/api/admin/site-settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body,
      });
    },
  },
  translate(
    text: string,
    source: 'az' | 'ru' | 'en',
    target: 'az' | 'ru' | 'en',
  ) {
    return apiFetch<{ translatedText: string }>('/api/admin/translate', {
      method: 'POST',
      body: { text, sourceLang: source, targetLang: target },
    });
  },
  /**
   * Generic file upload. Saves the file under `wwwroot/uploads/{folder}/...`
   * on the backend and returns the public URL.
   */
  uploadFile(file: File, folder = 'misc') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return apiFetch<{ url: string }>('/api/admin/uploads', {
      method: 'POST',
      body: fd,
    });
  },
  dashboard: {
    stats() {
      return apiFetch<DashboardStatsApi>('/api/admin/dashboard/stats', {
        cache: 'no-store',
      });
    },
  },
  users: {
    list(params?: { page?: number; pageSize?: number; search?: string; role?: number }) {
      return apiFetch<PaginatedList<AdminUserApi>>('/api/admin/users', {
        query: { ...params },
        cache: 'no-store',
      });
    },
    get(id: number) {
      return apiFetch<AdminUserApi>(`/api/admin/users/${id}`, { cache: 'no-store' });
    },
    update(id: number, body: UpdateUserDto) {
      return apiFetch<AdminUserApi>(`/api/admin/users/${id}`, {
        method: 'PUT',
        body,
      });
    },
    createAdmin(body: CreateAdminDto) {
      return apiFetch<AdminUserApi>('/api/admin/users/admins', {
        method: 'POST',
        body,
      });
    },
    deactivate(id: number) {
      return apiFetch<null>(`/api/admin/users/${id}`, { method: 'DELETE' });
    },
  },
};
