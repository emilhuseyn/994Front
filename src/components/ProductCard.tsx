'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { pickByLocale, useTranslation } from '@/i18n/useTranslation';
import WishlistButton from './WishlistButton';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { t, locale } = useTranslation();
  const primary = product.images[0];
  const hover = product.images[1] ?? product.images[0];

  const title = pickByLocale(
    locale,
    product.title,
    product.titleRu,
    product.titleEn,
  );

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={primary}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-0"
        />
        <Image
          src={hover}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {product.isNew && (
          <span className="absolute left-2 top-2 bg-black px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            {t('product.badge.new')}
          </span>
        )}
        {product.oldPrice && (
          <span className="absolute right-2 top-2 bg-red-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            {t('product.badge.sale')}
          </span>
        )}
        {/* Wishlist heart (top-right corner, below sale badge when both present) */}
        <div className={`absolute right-2 ${product.oldPrice ? 'top-9' : 'top-2'}`}>
          <WishlistButton
            product={{
              productId: Number(product.id),
              productName: product.title,
              productSlug: product.slug,
              effectivePrice: product.price,
              mainImageUrl: product.images[0] ?? null,
            }}
          />
        </div>
      </div>
      <div className="pt-3 text-center">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-black group-hover:underline">
          {title}
        </h3>
        <p className="mt-1 text-sm">
          {product.oldPrice ? (
            <>
              <span className="text-neutral-400 line-through">
                {formatPrice(product.oldPrice)}
              </span>{' '}
              <span className="font-semibold text-red-600">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(product.price)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
