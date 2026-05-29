import { resolveImageUrl } from './api';
import type {
  ApiProductDetail,
  ApiProductListItem,
  ApiGender,
} from './api-types';
import type { Gender, Product } from './types';

function mapGender(value: ApiGender): Gender {
  if (value === 0) return 'men';
  if (value === 1) return 'women';
  return 'unisex';
}

function deriveParentCategory(slug: string): Product['parentCategory'] {
  const shoes = ['cekmeler', 'krossovkalar', 'sendeller', 'idman-ayaqqabilari', 'sliponlar'];
  const accessories = ['papaqlar', 'serfler', 'cantalar', 'bel-cantalar', 'pul-kiseleri', 'corablar', 'mayka', 'kemerler', 'cimerlik-cantalari'];
  if (shoes.includes(slug)) return 'shoes';
  if (accessories.includes(slug)) return 'accessories';
  return 'clothing';
}

export function mapListItemToProduct(dto: ApiProductListItem): Product {
  const main = resolveImageUrl(dto.mainImageUrl);
  const hover = resolveImageUrl(dto.hoverImageUrl ?? dto.mainImageUrl);
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.nameAz,
    titleRu: dto.nameRu,
    titleEn: dto.nameEn ?? undefined,
    brand: dto.brandName,
    brandSlug: dto.brandSlug,
    category: dto.categoryNameAz,
    // Backend ProductListItemDto doesn't carry the RU/EN category name — fall back to AZ
    categoryRu: dto.categoryNameAz,
    categoryEn: dto.categoryNameAz,
    categorySlug: dto.categorySlug,
    parentCategory: deriveParentCategory(dto.categorySlug),
    price: dto.effectivePrice,
    oldPrice:
      dto.discountPrice != null && dto.discountPrice < dto.basePrice ? dto.basePrice : undefined,
    images: [main, hover].filter(Boolean) as string[],
    // List endpoint returns the AZ color names + size names from active variants.
    colors: dto.colors ?? [],
    colorsRu: dto.colors ?? [],
    colorsEn: dto.colors ?? [],
    sizes: dto.sizes ?? [],
    gender: mapGender(dto.gender),
    description: '',
    descriptionRu: '',
    descriptionEn: '',
    inStock: true,
    isFeatured: dto.isFeatured,
  };
}

export function mapDetailToProduct(dto: ApiProductDetail): Product {
  const list = mapListItemToProduct(dto);
  const images = (dto.images?.length ? dto.images : [])
    .slice()
    .sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.sortOrder - b.sortOrder)
    .map((i) => resolveImageUrl(i.imageUrl));

  return {
    ...list,
    images: images.length > 0 ? images : list.images,
    description: dto.descriptionAz ?? '',
    descriptionRu: dto.descriptionRu ?? dto.descriptionAz ?? '',
    descriptionEn: dto.descriptionEn ?? dto.descriptionAz ?? '',
    colors: dto.availableColors?.map((c) => c.nameAz) ?? [],
    colorsRu: dto.availableColors?.map((c) => c.nameRu || c.nameAz) ?? [],
    colorsEn: dto.availableColors?.map((c) => c.nameEn || c.nameAz) ?? [],
    sizes:
      dto.availableSizes?.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((s) => s.name) ?? [],
    inStock: (dto.totalStock ?? 0) > 0,
  };
}
