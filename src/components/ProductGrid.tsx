'use client';

import ProductCard from './ProductCard';
import type { Product } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  const { t } = useTranslation();
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        {t('shop.noProducts')}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
