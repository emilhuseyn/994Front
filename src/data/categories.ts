import type { Category } from '@/lib/types';

export const parentCategories = [
  { slug: 'geyimler', name: 'Geyimlər', key: 'clothing' as const },
  { slug: 'ayaqqabilar', name: 'Ayaqqabılar', key: 'shoes' as const },
  { slug: 'aksesuarlar', name: 'Aksesuarlar', key: 'accessories' as const },
];

export const categories: Category[] = [
  // Geyimlər
  { slug: 'godekceler', name: 'Gödəkçələr', parent: 'clothing' },
  { slug: 'jiletler', name: 'Jiletlər', parent: 'clothing' },
  { slug: 'hudiler', name: 'Hudilər', parent: 'clothing' },
  { slug: 'koynekler', name: 'Köynəklər', parent: 'clothing' },
  { slug: 'sviterler', name: 'Sviterlər', parent: 'clothing' },
  { slug: 'pololar', name: 'Pololar', parent: 'clothing' },
  { slug: 'longslivler', name: 'Longslivlər', parent: 'clothing' },
  { slug: 't-shirtler', name: 'T-shirtlər', parent: 'clothing' },
  { slug: 'leggins', name: 'Leggins', parent: 'clothing' },
  { slug: 'yubka', name: 'Yubka', parent: 'clothing' },
  { slug: 'topik', name: 'Topik', parent: 'clothing' },
  { slug: 'sport-topikler', name: 'Sport topiklər', parent: 'clothing' },
  { slug: 'paltar', name: 'Paltar', parent: 'clothing' },
  { slug: 'cinsler', name: 'Cinslər', parent: 'clothing' },
  { slug: 'salvarlar', name: 'Şalvarlar', parent: 'clothing' },
  { slug: 'sortlar', name: 'Şortlar', parent: 'clothing' },

  // Ayaqqabılar
  { slug: 'cekmeler', name: 'Çəkmələr', parent: 'shoes' },
  { slug: 'krossovkalar', name: 'Krossovkalar', parent: 'shoes' },
  { slug: 'sendeller', name: 'Səndəllər', parent: 'shoes' },
  { slug: 'idman-ayaqqabilari', name: 'İdman ayaqqabıları', parent: 'shoes' },
  { slug: 'sliponlar', name: 'Sliponlar', parent: 'shoes' },

  // Aksesuarlar
  { slug: 'papaqlar', name: 'Papaqlar', parent: 'accessories' },
  { slug: 'serfler', name: 'Şərflər', parent: 'accessories' },
  { slug: 'cantalar', name: 'Çantalar', parent: 'accessories' },
  { slug: 'bel-cantalar', name: 'Bel çantalar', parent: 'accessories' },
  { slug: 'pul-kiseleri', name: 'Pul kisələri', parent: 'accessories' },
  { slug: 'corablar', name: 'Corablar', parent: 'accessories' },
  { slug: 'mayka', name: 'Mayka', parent: 'accessories' },
  { slug: 'kemerler', name: 'Kəmərlər', parent: 'accessories' },
  { slug: 'cimerlik-cantalari', name: 'Çimərlik çantaları', parent: 'accessories' },
];

export function getCategoriesByParent(parent: Category['parent']): Category[] {
  return categories.filter((c) => c.parent === parent);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
