import type { Category, Locale } from '@/lib/types';

export const parentCategories = [
  { slug: 'geyimler', name: 'Geyimlər', key: 'clothing' as const },
  { slug: 'ayaqqabilar', name: 'Ayaqqabılar', key: 'shoes' as const },
  { slug: 'aksesuarlar', name: 'Aksesuarlar', key: 'accessories' as const },
];

export const categories: Category[] = [
  // Geyimlər
  { slug: 'godekceler', name: 'Gödəkçələr', nameRu: 'Куртки', nameEn: 'Jackets', parent: 'clothing' },
  { slug: 'jiletler', name: 'Jiletlər', nameRu: 'Жилеты', nameEn: 'Vests', parent: 'clothing' },
  { slug: 'hudiler', name: 'Hudilər', nameRu: 'Худи', nameEn: 'Hoodies', parent: 'clothing' },
  { slug: 'koynekler', name: 'Köynəklər', nameRu: 'Рубашки', nameEn: 'Shirts', parent: 'clothing' },
  { slug: 'sviterler', name: 'Sviterlər', nameRu: 'Свитеры', nameEn: 'Sweaters', parent: 'clothing' },
  { slug: 'pololar', name: 'Pololar', nameRu: 'Поло', nameEn: 'Polos', parent: 'clothing' },
  { slug: 'longslivler', name: 'Longslivlər', nameRu: 'Лонгсливы', nameEn: 'Long sleeves', parent: 'clothing' },
  { slug: 't-shirtler', name: 'T-shirtlər', nameRu: 'Футболки', nameEn: 'T-shirts', parent: 'clothing' },
  { slug: 'leggins', name: 'Leggins', nameRu: 'Леггинсы', nameEn: 'Leggings', parent: 'clothing' },
  { slug: 'yubka', name: 'Yubka', nameRu: 'Юбки', nameEn: 'Skirts', parent: 'clothing' },
  { slug: 'topik', name: 'Topik', nameRu: 'Топы', nameEn: 'Tops', parent: 'clothing' },
  { slug: 'sport-topikler', name: 'Sport topiklər', nameRu: 'Спортивные топы', nameEn: 'Sports tops', parent: 'clothing' },
  { slug: 'paltar', name: 'Paltar', nameRu: 'Платья', nameEn: 'Dresses', parent: 'clothing' },
  { slug: 'cinsler', name: 'Cinslər', nameRu: 'Джинсы', nameEn: 'Jeans', parent: 'clothing' },
  { slug: 'salvarlar', name: 'Şalvarlar', nameRu: 'Брюки', nameEn: 'Pants', parent: 'clothing' },
  { slug: 'sortlar', name: 'Şortlar', nameRu: 'Шорты', nameEn: 'Shorts', parent: 'clothing' },

  // Ayaqqabılar
  { slug: 'cekmeler', name: 'Çəkmələr', nameRu: 'Ботинки', nameEn: 'Boots', parent: 'shoes' },
  { slug: 'krossovkalar', name: 'Krossovkalar', nameRu: 'Кроссовки', nameEn: 'Sneakers', parent: 'shoes' },
  { slug: 'sendeller', name: 'Səndəllər', nameRu: 'Сандалии', nameEn: 'Sandals', parent: 'shoes' },
  { slug: 'idman-ayaqqabilari', name: 'İdman ayaqqabıları', nameRu: 'Спортивная обувь', nameEn: 'Sports shoes', parent: 'shoes' },
  { slug: 'sliponlar', name: 'Sliponlar', nameRu: 'Слипоны', nameEn: 'Slip-ons', parent: 'shoes' },

  // Aksesuarlar
  { slug: 'papaqlar', name: 'Papaqlar', nameRu: 'Головные уборы', nameEn: 'Hats', parent: 'accessories' },
  { slug: 'serfler', name: 'Şərflər', nameRu: 'Шарфы', nameEn: 'Scarves', parent: 'accessories' },
  { slug: 'cantalar', name: 'Çantalar', nameRu: 'Сумки', nameEn: 'Bags', parent: 'accessories' },
  { slug: 'bel-cantalar', name: 'Bel çantalar', nameRu: 'Поясные сумки', nameEn: 'Waist bags', parent: 'accessories' },
  { slug: 'pul-kiseleri', name: 'Pul kisələri', nameRu: 'Кошельки', nameEn: 'Wallets', parent: 'accessories' },
  { slug: 'corablar', name: 'Corablar', nameRu: 'Носки', nameEn: 'Socks', parent: 'accessories' },
  { slug: 'mayka', name: 'Mayka', nameRu: 'Майки', nameEn: 'Tank tops', parent: 'accessories' },
  { slug: 'kemerler', name: 'Kəmərlər', nameRu: 'Ремни', nameEn: 'Belts', parent: 'accessories' },
  { slug: 'cimerlik-cantalari', name: 'Çimərlik çantaları', nameRu: 'Пляжные сумки', nameEn: 'Beach bags', parent: 'accessories' },
];

/**
 * Category name for the active locale, falling back to the Azerbaijani name
 * when a translation is missing (so a new untranslated category still renders
 * something rather than nothing).
 */
export function localizedCategoryName(cat: Category, locale: Locale): string {
  if (locale === 'RUS') return cat.nameRu || cat.name;
  if (locale === 'ENG') return cat.nameEn || cat.name;
  return cat.name;
}

export function getCategoriesByParent(parent: Category['parent']): Category[] {
  return categories.filter((c) => c.parent === parent);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
