'use client';

import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import ShopView from '@/components/ShopView';
import { productsApi } from '@/lib/api';
import { mapListItemToProduct } from '@/lib/api-mappers';
import type { Product } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';

export default function ShopPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productsApi
      .list({ page: 1, pageSize: 200 }, true)
      .then((res) => setProducts((res?.items ?? []).map(mapListItemToProduct)))
      .catch(() => undefined);
  }, []);

  return (
    <>
      <div className="container-shop pt-6">
        <Breadcrumb
          items={[
            { href: '/', label: t('shop.breadcrumb.home') },
            { label: t('shop.breadcrumb.shop') },
          ]}
        />
        <h1 className="mt-4 text-2xl font-semibold uppercase tracking-wider">
          {t('shop.title')}
        </h1>
      </div>
      <ShopView products={products} currentPage={1} />
    </>
  );
}
