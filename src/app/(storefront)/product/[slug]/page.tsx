'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import ProductDetail from '@/components/ProductDetail';
import ProductGrid from '@/components/ProductGrid';
import OutfitBuilder from '@/components/OutfitBuilder';
import { productsApi } from '@/lib/api';
import { mapDetailToProduct, mapListItemToProduct } from '@/lib/api-mappers';
import type { ApiProductDetail } from '@/lib/api-types';
import type { Product } from '@/lib/types';
import { pickByLocale, useTranslation } from '@/i18n/useTranslation';

interface Props {
  params: { slug: string };
}

export default function ProductPage({ params }: Props) {
  const { t, locale } = useTranslation();
  const [dto, setDto] = useState<ApiProductDetail | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .bySlug(params.slug, true)
      .then(async (d) => {
        if (cancelled) return;
        if (!d) {
          setNotFoundFlag(true);
          setLoaded(true);
          return;
        }
        setDto(d);
        const relRes = await productsApi.list(
          { categorySlug: d.categorySlug, pageSize: 5 },
          true,
        );
        if (cancelled) return;
        setRelated(
          (relRes?.items ?? [])
            .filter((p) => p.slug !== d.slug)
            .slice(0, 4)
            .map(mapListItemToProduct),
        );
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFoundFlag(true);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (notFoundFlag) notFound();
  if (!loaded || !dto) {
    return (
      <div className="container-shop py-12 text-center text-sm text-neutral-500">
        {t('common.loading')}
      </div>
    );
  }

  const product = mapDetailToProduct(dto);
  const title = pickByLocale(locale, product.title, product.titleRu, product.titleEn);
  const category = pickByLocale(
    locale,
    product.category,
    product.categoryRu,
    product.categoryEn,
  );

  return (
    <div className="container-shop py-6">
      <Breadcrumb
        items={[
          { href: '/', label: t('shop.breadcrumb.home') },
          { href: '/shop', label: t('shop.breadcrumb.shop') },
          { href: `/category/${product.categorySlug}`, label: category },
          { label: title },
        ]}
      />
      <div className="mt-6">
        <ProductDetail product={product} variants={dto.variants} />
      </div>

      {/* AI stylist — between description and related products */}
      <OutfitBuilder productId={dto.id} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-lg font-semibold uppercase tracking-wider">
            {t('product.relatedTitle')}
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
