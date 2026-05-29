'use client';

import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import ShopView from '@/components/ShopView';
import { getBrandBySlug } from '@/data/brands';
import { productsApi } from '@/lib/api';
import { mapListItemToProduct } from '@/lib/api-mappers';
import type { Product } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  params: { slug: string };
}

export default function BrandPage({ params }: Props) {
  const { t } = useTranslation();
  const brand = getBrandBySlug(params.slug);
  const displayName = brand?.name ?? params.slug;
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productsApi
      .list({ brandSlug: params.slug, pageSize: 200 }, true)
      .then((res) => setProducts((res?.items ?? []).map(mapListItemToProduct)))
      .catch(() => undefined);
  }, [params.slug]);

  return (
    <>
      <div className="container-shop pt-6">
        <Breadcrumb
          items={[
            { href: '/', label: t('shop.breadcrumb.home') },
            { href: '/shop', label: t('shop.breadcrumb.shop') },
            { label: displayName },
          ]}
        />
        <h1 className="mt-4 text-2xl font-semibold uppercase tracking-wider">
          {displayName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t('shop.itemsCount', { count: products.length })}
        </p>
      </div>
      <ShopView
        products={products}
        currentPage={1}
        basePath={`/brand/${params.slug}`}
      />
    </>
  );
}
