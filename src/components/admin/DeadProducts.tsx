'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { DeadProductApi } from '@/lib/api/admin';
import { resolveImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/format';

/**
 * Dashboard section that surfaces "dead inventory" — active products that
 * haven't sold in the last 45 days.  Admins can jump straight to the product
 * edit page to put it on sale, refresh the photos, or deactivate it.
 *
 * Sorted server-side by days-since-last-sale (longest-cold first), with a
 * secondary sort on tied-up capital (price × stock) so high-value dead stock
 * floats to the top.
 */
export default function DeadProducts({
  products,
  loading,
}: {
  products: DeadProductApi[] | undefined;
  loading?: boolean;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded border border-neutral-200 bg-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
            <span aria-hidden>💀</span> Ölü məhsullar
          </h2>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            45 gündən artıqdır satılmayan aktiv məhsullar · endirim, yenidən
            fotolama və ya passivləşdirmə tövsiyə olunur
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-xs text-neutral-500 hover:text-black"
        >
          Bütün məhsullar →
        </Link>
      </header>

      {loading ? (
        <p className="px-4 py-12 text-center text-xs text-neutral-500">
          Yüklənir…
        </p>
      ) : !products || products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <span className="text-3xl">🎉</span>
          <p className="text-sm font-medium text-neutral-700">
            Yaxşı xəbər: ölü məhsul yoxdur!
          </p>
          <p className="text-xs text-neutral-500">
            Bütün aktiv məhsullar son 45 gündə ən azı bir dəfə satılıb.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {products.map((p) => (
            <DeadRow key={p.productId} product={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DeadRow({ product: p }: { product: DeadProductApi }) {
  // Visual signal: how "cold" is this product?
  const coldness = coldnessLevel(p.daysSinceLastSale, p.daysSinceCreated);

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
      {/* Image */}
      <Link
        href={`/admin/products/${p.productId}`}
        className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-neutral-100"
      >
        {p.imageUrl ? (
          <Image
            src={resolveImageUrl(p.imageUrl)}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : null}
      </Link>

      {/* Name + brand */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/products/${p.productId}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {p.productName}
        </Link>
        <p className="truncate text-[11px] text-neutral-500">
          {p.brandName} · {formatPrice(p.price)} · {p.stockRemaining} ədəd stokda
        </p>
      </div>

      {/* Coldness chip */}
      <div className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${coldness.cls}`}>
        <span aria-hidden>{coldness.icon}</span>
        {p.daysSinceLastSale === null ? (
          <span>Heç satılmayıb · {p.daysSinceCreated} gün</span>
        ) : (
          <span>{p.daysSinceLastSale} gün</span>
        )}
      </div>

      {/* Total sold pill */}
      <div className="hidden flex-shrink-0 text-right sm:block">
        <p className="text-[10px] uppercase tracking-wider text-neutral-400">
          ömürlük
        </p>
        <p className="text-sm font-semibold text-neutral-700">
          {p.totalSold} satıldı
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-shrink-0 gap-1.5">
        <Link
          href={`/admin/products/${p.productId}`}
          className="rounded border border-neutral-200 px-2.5 py-1 text-[11px] font-medium hover:border-black"
          title="Endirim et və ya redaktə et"
        >
          Redaktə
        </Link>
        <Link
          href={`/product/${p.productSlug}`}
          target="_blank"
          className="rounded border border-neutral-200 px-2.5 py-1 text-[11px] font-medium hover:border-black"
          title="Saytdakı görünüşü"
        >
          Bax
        </Link>
      </div>
    </li>
  );
}

/**
 * Map cold-days to a chip style.  >120d = critical; 90-120d = severe; 60-90d
 * = warning; everything else = mild.
 */
function coldnessLevel(daysSinceLastSale: number | null, daysSinceCreated: number) {
  const d = daysSinceLastSale ?? daysSinceCreated;
  if (d >= 120) {
    return { icon: '🥶', cls: 'bg-red-100 text-red-800' };
  }
  if (d >= 90) {
    return { icon: '❄️', cls: 'bg-orange-100 text-orange-800' };
  }
  if (d >= 60) {
    return { icon: '🧊', cls: 'bg-amber-100 text-amber-800' };
  }
  return { icon: '⏳', cls: 'bg-neutral-100 text-neutral-700' };
}
