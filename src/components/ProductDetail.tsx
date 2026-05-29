'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useCart } from './CartProvider';
import { COLOR_SWATCHES } from '@/data/products';
import type { ApiProductVariant } from '@/lib/api-types';
import { pickByLocale, useTranslation } from '@/i18n/useTranslation';
import ImageLightbox from './ImageLightbox';
import WishlistButton from './WishlistButton';
import ShareButtons from './ShareButtons';
import { useSiteSettings } from './SiteSettingsProvider';

interface Props {
  product: Product;
  variants?: ApiProductVariant[];
}

export default function ProductDetail({ product, variants = [] }: Props) {
  const { t, locale } = useTranslation();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { get: getSetting } = useSiteSettings();
  // Admins can toggle the urgency message (amber "⚠ Stokda: N ədəd" line).
  // Defaults to enabled so existing shops don't suddenly lose the FOMO nudge.
  const stockUrgencyEnabled =
    !getSetting('feature.stockUrgency').trim().toLowerCase().startsWith('f');
  const [size, setSize] = useState(product.sizes[0] ?? '');
  const [color, setColor] = useState(product.colors[0] ?? '');
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle' | 'pending' | 'added' | 'error'>(
    'idle',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addItem } = useCart();

  const title = pickByLocale(locale, product.title, product.titleRu, product.titleEn);
  const description = pickByLocale(
    locale,
    product.description,
    product.descriptionRu,
    product.descriptionEn,
  );
  const category = pickByLocale(
    locale,
    product.category,
    product.categoryRu,
    product.categoryEn,
  );

  const colorIndex = Math.max(0, product.colors.indexOf(color));
  const displayedColor = pickByLocale(
    locale,
    color,
    product.colorsRu?.[colorIndex],
    product.colorsEn?.[colorIndex],
  );

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) => v.colorNameAz === color && v.sizeName === size && v.isActive,
      ),
    [variants, color, size],
  );

  const stockLeft = selectedVariant?.stockQuantity ?? null;
  const disabled =
    !product.inStock ||
    status === 'pending' ||
    (variants.length > 0 && (!selectedVariant || stockLeft === 0));

  async function handleAdd() {
    setStatus('pending');
    setErrorMsg(null);
    try {
      await addItem({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        image: product.images[0],
        size,
        color,
        quantity: qty,
        productVariantId: selectedVariant?.id,
      });
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1800);
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message || t('product.selectSizeColor'));
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const genderLabel =
    product.gender === 'men'
      ? t('shop.gender.men')
      : product.gender === 'women'
      ? t('shop.gender.women')
      : t('shop.gender.unisex');

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t('product.zoomImage')}
          className="group relative block aspect-square w-full overflow-hidden bg-neutral-100"
        >
          <Image
            src={product.images[activeImage]}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
          {/* Zoom hint badge — appears on hover */}
          <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`${t('common.image')} ${i + 1}`}
                className={`relative h-20 w-20 overflow-hidden border-2 ${
                  activeImage === i ? 'border-black' : 'border-transparent'
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
          {product.brand}
        </p>
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        <p className="mt-3 text-2xl font-semibold">
          {formatPrice(product.price)}
        </p>

        {product.colors.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider">
              {t('product.color')}: <span className="font-normal text-neutral-700">{displayedColor}</span>
            </p>
            <ul className="flex flex-wrap gap-2">
              {product.colors.map((c, i) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={pickByLocale(
                      locale,
                      c,
                      product.colorsRu?.[i],
                      product.colorsEn?.[i],
                    )}
                    aria-pressed={color === c}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      color === c ? 'border-black' : 'border-neutral-200'
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-neutral-300"
                      style={{ backgroundColor: COLOR_SWATCHES[c] ?? '#ccc' }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.sizes.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider">
              {t('product.size')}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {product.sizes.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`min-w-[44px] border px-3 py-2 text-sm ${
                      size === s
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 hover:border-black'
                    }`}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variant availability message — covers three distinct cases:
            • combo doesn't exist at all (white M when only black M is sold)
            • combo exists but stock is 0
            • combo exists with N units left
            Without an explicit message the disabled button looked broken. */}
        {variants.length > 0 && (
          !selectedVariant ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 2L1 21h22L12 2zm0 6l7.5 13h-15L12 8zm-1 3v5h2v-5h-2zm0 6v2h2v-2h-2z" />
              </svg>
              {t('product.comboUnavailable')}
            </p>
          ) : stockLeft === 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 2L1 21h22L12 2zm0 6l7.5 13h-15L12 8zm-1 3v5h2v-5h-2zm0 6v2h2v-2h-2z" />
              </svg>
              {t('product.outOfCombo')}
            </p>
          ) : stockLeft !== null && stockLeft <= 5 && stockUrgencyEnabled ? (
            // FOMO nudge — only shown when admins keep the toggle on AND
            // stock is genuinely low (≤5).
            <p className="mt-3 text-xs font-medium text-amber-700">
              ⚠ {t('product.stockLeft', { count: stockLeft })}
            </p>
          ) : stockLeft !== null && stockUrgencyEnabled ? (
            <p className="mt-3 text-xs text-neutral-500">
              {t('product.stockLeft', { count: stockLeft })}
            </p>
          ) : null
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-12 items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-full w-10 text-lg hover:bg-neutral-100"
              aria-label={t('product.qtyDecrease')}
            >
              −
            </button>
            <span className="w-10 text-center text-sm">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="h-full w-10 text-lg hover:bg-neutral-100"
              aria-label={t('product.qtyIncrease')}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className="btn-primary h-12 flex-1"
          >
            {status === 'pending' && t('product.adding')}
            {status === 'added' && t('product.added')}
            {(status === 'idle' || status === 'error') && t('product.addToCart')}
          </button>
          <WishlistButton
            variant="detail"
            product={{
              productId: Number(product.id),
              productName: product.title,
              productSlug: product.slug,
              effectivePrice: product.price,
              mainImageUrl: product.images[0] ?? null,
            }}
          />
        </div>
        {status === 'error' && errorMsg && (
          <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
        )}

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
            {t('product.description')}
          </h3>
          <p className="text-sm leading-relaxed text-neutral-700">
            {description}
          </p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-y-2 text-xs">
          <dt className="text-neutral-500">{t('product.brand')}</dt>
          <dd>{product.brand}</dd>
          <dt className="text-neutral-500">{t('product.category')}</dt>
          <dd>{category}</dd>
          <dt className="text-neutral-500">{t('product.gender')}</dt>
          <dd>{genderLabel}</dd>
          <dt className="text-neutral-500">{t('product.availability')}</dt>
          <dd>{product.inStock ? t('product.inStock') : t('product.outOfStock')}</dd>
        </dl>

        <ShareButtons productSlug={product.slug} productName={title} />
      </div>

      <ImageLightbox
        open={lightboxOpen}
        images={product.images}
        initialIndex={activeImage}
        alt={title}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
