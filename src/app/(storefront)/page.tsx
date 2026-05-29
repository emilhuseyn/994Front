'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductGrid from '@/components/ProductGrid';
import HeroCarousel from '@/components/HeroCarousel';
import { brands } from '@/data/brands';
import { parentCategories } from '@/data/categories';
import { productsApi, slidersApi } from '@/lib/api';
import { mapListItemToProduct } from '@/lib/api-mappers';
import type { Product } from '@/lib/types';
import type { ApiSlider } from '@/lib/api-types';
import { useTranslation } from '@/i18n/useTranslation';

// Fallback slide used while the API call is in flight, or if the backend has
// no active sliders. Matches the original hardcoded hero so the page never
// flashes blank.
const DEFAULT_SLIDE: ApiSlider = {
  id: 0,
  titleAz: 'Yeni kolleksiya — Wrangler, Lee, Carhartt',
  titleRu: 'Новая коллекция — Wrangler, Lee, Carhartt',
  titleEn: 'New collection — Wrangler, Lee, Carhartt',
  subtitleAz:
    '100 ₼-dən yuxarı sifarişlər üçün mağazandan götürə bilərsiz və ya pulsuz çatdırılma.',
  subtitleRu:
    'Для заказов свыше 100 ₼ возможен самовывоз или бесплатная доставка.',
  subtitleEn: 'Free delivery or in-store pickup for orders over 100 ₼.',
  imageUrl:
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80',
  buttonTextAz: 'Mağazaya keç',
  buttonTextRu: 'В магазин',
  buttonTextEn: 'Shop now',
  buttonUrl: '/shop',
  sortOrder: 0,
  isActive: true,
};

export default function HomePage() {
  const { t, locale } = useTranslation();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [slides, setSlides] = useState<ApiSlider[]>([DEFAULT_SLIDE]);

  useEffect(() => {
    Promise.all([
      productsApi.list({ isFeatured: true, pageSize: 8, sort: 'popular' }, true),
      productsApi.list({ sort: 'newest', pageSize: 8 }, true),
      slidersApi.list(true),
    ])
      .then(([f, n, s]) => {
        setFeatured((f?.items ?? []).map(mapListItemToProduct));
        setNewest((n?.items ?? []).map(mapListItemToProduct));
        const list = s ?? [];
        if (list.length > 0) {
          setSlides(list.slice().sort((a, b) => a.sortOrder - b.sortOrder));
        }
      })
      .catch(() => {
        /* swallow — page still renders with empty sections / default slide */
      });
  }, []);

  const localizedParent = (slug: string, fallback: string) => {
    if (locale === 'AZ') return fallback;
    if (slug === 'geyimler') return t('nav.clothing');
    if (slug === 'ayaqqabilar') return t('nav.shoes');
    if (slug === 'aksesuarlar') return t('nav.accessories');
    return fallback;
  };

  return (
    <>
      <HeroCarousel slides={slides} />

      <section className="container-shop py-12">
        <h2 className="mb-6 text-center text-xl font-semibold uppercase tracking-wider">
          {t('home.sectionsTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {parentCategories.map((p, i) => (
            <Link
              key={p.slug}
              href={`/category/${p.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden bg-neutral-100"
            >
              <Image
                src={
                  i === 0
                    ? 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80'
                    : i === 1
                    ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
                    : 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'
                }
                alt={p.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
                <span className="text-lg font-semibold uppercase tracking-wider text-white">
                  {localizedParent(p.slug, p.name)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-shop py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold uppercase tracking-wider">
              {t('home.featuredTitle')}
            </h2>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-wider text-neutral-600 hover:text-black"
            >
              {t('home.viewAll')}
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {newest.length > 0 && (
        <section className="container-shop py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold uppercase tracking-wider">
              {t('home.newestTitle')}
            </h2>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-wider text-neutral-600 hover:text-black"
            >
              {t('home.viewAll')}
            </Link>
          </div>
          <ProductGrid products={newest} />
        </section>
      )}

      <section className="bg-neutral-50 py-12">
        <div className="container-shop">
          <h2 className="mb-6 text-center text-xl font-semibold uppercase tracking-wider">
            {t('home.brandsTitle')}
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm uppercase tracking-wider text-neutral-700">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/brand/${b.slug}`}
                  className="transition-colors hover:text-black"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
