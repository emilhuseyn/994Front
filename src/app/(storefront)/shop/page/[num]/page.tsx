'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import ShopView from '@/components/ShopView';
import { productsApi } from '@/lib/api';
import { mapListItemToProduct } from '@/lib/api-mappers';
import type { Product } from '@/lib/types';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  params: { num: string };
}

const PER_PAGE = 12;

export default function ShopPaginationPage({ params }: Props) {
  const { t } = useTranslation();
  const page = parseInt(params.num, 10);
  if (!Number.isFinite(page) || page < 1) notFound();

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
            { href: '/shop', label: t('shop.breadcrumb.shop') },
            { label: `${t('shop.page')} ${page}` },
          ]}
        />
        <h1 className="mt-4 text-2xl font-semibold uppercase tracking-wider">
          {t('shop.title')}
        </h1>
      </div>
      <ShopView products={products} currentPage={page} perPage={PER_PAGE} />
    </>
  );
}
