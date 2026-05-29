'use client';

import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import ShopView from '@/components/ShopView';
import { categories, parentCategories } from '@/data/categories';
import { productsApi } from '@/lib/api';
import { mapListItemToProduct } from '@/lib/api-mappers';
import type { Product } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  params: { slug: string };
}

export default function CategoryPage({ params }: Props) {
  const { t, locale } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productsApi
      .list({ categorySlug: params.slug, pageSize: 200 }, true)
      .then((res) => setProducts((res?.items ?? []).map(mapListItemToProduct)))
      .catch(() => undefined);
  }, [params.slug]);

  const parent = parentCategories.find((p) => p.slug === params.slug);
  const cat = categories.find((c) => c.slug === params.slug);

  const localizedParent = (slug: string, fallback: string) => {
    if (locale === 'AZ') return fallback;
    if (slug === 'geyimler') return t('nav.clothing');
    if (slug === 'ayaqqabilar') return t('nav.shoes');
    if (slug === 'aksesuarlar') return t('nav.accessories');
    return fallback;
  };

  const displayName = parent
    ? localizedParent(parent.slug, parent.name)
    : cat?.name ?? params.slug;
  const parentInfo = cat ? parentCategories.find((p) => p.key === cat.parent) : null;

  return (
    <>
      <div className="container-shop pt-6">
        <Breadcrumb
          items={[
            { href: '/', label: t('shop.breadcrumb.home') },
            { href: '/shop', label: t('shop.breadcrumb.shop') },
            ...(parentInfo
              ? [
                  {
                    href: `/category/${parentInfo.slug}`,
                    label: localizedParent(parentInfo.slug, parentInfo.name),
                  },
                ]
              : []),
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
        basePath={`/category/${params.slug}`}
      />
    </>
  );
}
