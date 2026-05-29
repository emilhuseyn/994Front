import type { Brand } from '@/lib/types';

export const brands: Brand[] = [
  { slug: 'asics', name: 'Asics' },
  { slug: 'carhartt', name: 'Carhartt' },
  { slug: 'cp-company', name: 'CP Company' },
  { slug: 'diadora', name: 'Diadora' },
  { slug: 'dickies', name: 'Dickies' },
  { slug: 'dr-martens', name: 'Dr.Martens' },
  { slug: 'eastpak', name: 'Eastpak' },
  { slug: 'ellesse', name: 'Ellesse' },
  { slug: 'fila', name: 'Fila' },
  { slug: 'fred-perry', name: 'Fred Perry' },
  { slug: 'gstar', name: 'GStar' },
  { slug: 'kangol', name: 'Kangol' },
  { slug: 'jansport', name: 'Jansport' },
  { slug: 'lee', name: 'Lee' },
  { slug: 'napapijri', name: 'Napapijri' },
  { slug: 'new-balance', name: 'New Balance' },
  { slug: 'mizuno', name: 'Mizuno' },
  { slug: 'patagonia', name: 'Patagonia' },
  { slug: 'vans', name: 'Vans' },
  { slug: 'wrangler', name: 'Wrangler' },
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}
