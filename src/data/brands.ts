import type { Brand } from '@/lib/types';

// Ordered by the shop's priority: the flagship brands lead, the rest follow,
// and Lee / Wrangler sit last (per the owners' request). Slugs are unchanged
// so existing product links keep working; only the display order and a couple
// of labels moved.
export const brands: Brand[] = [
  // Flagship brands, front of house
  { slug: 'carhartt', name: 'Carhartt WIP' },
  { slug: 'vans', name: 'Vans' },
  { slug: 'dickies', name: 'Dickies' },
  { slug: 'napapijri', name: 'Napapijri' },
  { slug: 'stussy', name: 'Stüssy' },
  { slug: 'dr-martens', name: 'Dr.Martens' },
  // The rest
  { slug: 'asics', name: 'Asics' },
  { slug: 'cp-company', name: 'CP Company' },
  { slug: 'diadora', name: 'Diadora' },
  { slug: 'eastpak', name: 'Eastpak' },
  { slug: 'ellesse', name: 'Ellesse' },
  { slug: 'fila', name: 'Fila' },
  { slug: 'fred-perry', name: 'Fred Perry' },
  { slug: 'gstar', name: 'GStar' },
  { slug: 'kangol', name: 'Kangol' },
  { slug: 'jansport', name: 'Jansport' },
  { slug: 'new-balance', name: 'New Balance' },
  { slug: 'mizuno', name: 'Mizuno' },
  { slug: 'patagonia', name: 'Patagonia' },
  // Last, per request
  { slug: 'lee', name: 'Lee' },
  { slug: 'wrangler', name: 'Wrangler' },
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}
