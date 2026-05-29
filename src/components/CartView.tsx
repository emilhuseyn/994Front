'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { formatPrice } from '@/lib/format';
import { ordersApi } from '@/lib/api/orders';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';
import FreeShippingBar from './FreeShippingBar';
import { useSiteSettings } from './SiteSettingsProvider';

export default function CartView() {
  const { t } = useTranslation();
  const { items, subtotal, updateQuantity, removeItem, clear, loading, error, refresh } =
    useCart();
  const { get: getSetting } = useSiteSettings();
  // Free-shipping threshold lives in SiteSettings so admins can change it
  // without a deploy.  Falls back to the legacy 100 ₼ default.
  const freeShippingThreshold = (() => {
    const raw = getSetting('freeShipping.threshold');
    const n = parseFloat(raw.replace(',', '.').trim());
    return Number.isFinite(n) && n > 0 ? n : 100;
  })();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [checkout, setCheckout] = useState({
    open: false,
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    itemCount: number;
    createdAt: string;
  } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusyKey(key);
    try {
      await fn();
    } finally {
      setBusyKey(null);
    }
  }

  async function placeOrder() {
    setSubmitting(true);
    setOrderError(null);
    setPlacedOrder(null);
    try {
      const order = await ordersApi.create({
        customerFullName: checkout.fullName,
        customerEmail: checkout.email,
        customerPhone: checkout.phone,
        deliveryAddress: checkout.address,
        paymentMethod: 0,
        notes: checkout.notes,
      });
      setPlacedOrder({
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemCount: order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0,
        createdAt: order.createdAt,
      });
      setCheckout((c) => ({ ...c, open: false }));
      await refresh();
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <p className="mt-8 py-6 text-center text-sm text-neutral-500">
        {t('common.loading')}
      </p>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="mt-8 border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <p className="mt-2 text-xs text-red-700/70">{t('cart.loadError')}</p>
      </div>
    );
  }

  // ── Success view: shown after a successful order is placed. ──────────────
  if (placedOrder && items.length === 0) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Hero banner */}
          <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-10 text-center text-white">
            <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('cart.success.title')}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/90">
              {t('cart.success.body')}
            </p>
          </div>

          {/* Order details */}
          <div className="px-8 py-6">
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                {t('cart.success.orderNumber')}
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-wider">
                {placedOrder.orderNumber}
              </p>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t('cart.success.total')}
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatPrice(placedOrder.totalAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t('cart.col.qty')}
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {placedOrder.itemCount}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t('cart.success.placedAt')}
                </dt>
                <dd className="mt-1 text-sm">
                  {new Date(placedOrder.createdAt).toLocaleString('az-AZ', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/shop" className="btn-primary">
                {t('cart.success.continueShopping')}
              </Link>
              <Link href="/" className="btn-outline">
                {t('cart.success.goHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 border border-neutral-200 p-10 text-center">
        <p className="text-sm text-neutral-600">{t('cart.empty')}</p>
        <Link href="/shop" className="btn-primary mt-4 inline-flex">
          {t('cart.goShop')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
      <section>
        {items.length > 0 && <FreeShippingBar subtotal={subtotal} />}
        {items.length > 0 && (
          <>
            <div className="hidden border-b border-neutral-200 pb-2 text-xs uppercase tracking-wider text-neutral-500 sm:grid sm:grid-cols-[80px_1fr_100px_120px_80px_24px] sm:items-center sm:gap-4">
              <span />
              <span>{t('cart.col.product')}</span>
              <span>{t('cart.col.price')}</span>
              <span>{t('cart.col.qty')}</span>
              <span className="text-right">{t('cart.col.total')}</span>
              <span />
            </div>
            <ul className="divide-y divide-neutral-100">
              {items.map((it) => {
                const lineTotal = it.price * it.quantity;
                const key = `${it.productId}|${it.size}|${it.color}`;
                const isBusy = busyKey === key;
                return (
                  <li
                    key={key}
                    className={`grid grid-cols-[80px_1fr] items-center gap-4 py-4 sm:grid-cols-[80px_1fr_100px_120px_80px_24px] ${
                      isBusy ? 'opacity-60' : ''
                    }`}
                  >
                    <Link
                      href={`/product/${it.slug}`}
                      className="relative block aspect-square w-20 overflow-hidden bg-neutral-100"
                    >
                      {it.image ? (
                        <Image
                          src={it.image}
                          alt={it.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : null}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/product/${it.slug}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {it.title}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {it.size} · {it.color}
                      </p>
                      <p className="mt-1 text-sm sm:hidden">
                        {formatPrice(it.price)} ×
                        <span className="ml-1 inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              withBusy(key, () =>
                                updateQuantity(
                                  it.productId,
                                  it.size,
                                  it.color,
                                  it.quantity - 1,
                                ),
                              )
                            }
                            className="h-6 w-6 border border-neutral-200"
                          >
                            −
                          </button>
                          {it.quantity}
                          <button
                            onClick={() =>
                              withBusy(key, () =>
                                updateQuantity(
                                  it.productId,
                                  it.size,
                                  it.color,
                                  it.quantity + 1,
                                ),
                              )
                            }
                            className="h-6 w-6 border border-neutral-200"
                          >
                            +
                          </button>
                        </span>
                      </p>
                      <p className="mt-1 text-sm font-medium sm:hidden">
                        {t('cart.col.total')}: {formatPrice(lineTotal)}
                      </p>
                      <button
                        onClick={() =>
                          withBusy(key, () =>
                            removeItem(it.productId, it.size, it.color),
                          )
                        }
                        className="mt-2 text-xs text-neutral-500 underline hover:text-black sm:hidden"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                    <span className="hidden text-sm sm:block">
                      {formatPrice(it.price)}
                    </span>
                    <div className="hidden items-center border border-neutral-200 sm:inline-flex">
                      <button
                        onClick={() =>
                          withBusy(key, () =>
                            updateQuantity(
                              it.productId,
                              it.size,
                              it.color,
                              it.quantity - 1,
                            ),
                          )
                        }
                        aria-label={t('product.qtyDecrease')}
                        className="h-9 w-9 hover:bg-neutral-100"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{it.quantity}</span>
                      <button
                        onClick={() =>
                          withBusy(key, () =>
                            updateQuantity(
                              it.productId,
                              it.size,
                              it.color,
                              it.quantity + 1,
                            ),
                          )
                        }
                        aria-label={t('product.qtyIncrease')}
                        className="h-9 w-9 hover:bg-neutral-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="hidden text-right text-sm font-medium sm:block">
                      {formatPrice(lineTotal)}
                    </span>
                    <button
                      onClick={() =>
                        withBusy(key, () => removeItem(it.productId, it.size, it.color))
                      }
                      aria-label={t('common.delete')}
                      className="hidden text-neutral-400 hover:text-black sm:block"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-outline">
                {t('cart.continue')}
              </Link>
              <button onClick={() => clear()} className="text-xs text-neutral-500 underline">
                {t('cart.clear')}
              </button>
            </div>
          </>
        )}
      </section>

      {items.length > 0 && (
        <aside className="h-fit border border-neutral-200 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
            {t('cart.summary')}
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">{t('cart.subtotal')}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">{t('cart.shipping')}</dt>
              <dd>{subtotal >= freeShippingThreshold ? t('cart.shippingFree') : '5,00 ₼'}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
              <dt>{t('cart.grandTotal')}</dt>
              <dd>{formatPrice(subtotal + (subtotal >= freeShippingThreshold ? 0 : 5))}</dd>
            </div>
          </dl>

          {!checkout.open ? (
            <button
              className="btn-primary mt-6 w-full"
              type="button"
              onClick={() => setCheckout((c) => ({ ...c, open: true }))}
            >
              {t('cart.checkout')}
            </button>
          ) : (
            <div className="mt-6 space-y-2">
              <input
                className="input-field"
                placeholder={t('cart.checkoutForm.fullName')}
                value={checkout.fullName}
                onChange={(e) =>
                  setCheckout((c) => ({ ...c, fullName: e.target.value }))
                }
              />
              <input
                className="input-field"
                type="email"
                placeholder={t('cart.checkoutForm.email')}
                value={checkout.email}
                onChange={(e) => setCheckout((c) => ({ ...c, email: e.target.value }))}
              />
              <input
                className="input-field"
                placeholder={t('cart.checkoutForm.phone')}
                value={checkout.phone}
                onChange={(e) => setCheckout((c) => ({ ...c, phone: e.target.value }))}
              />
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder={t('cart.checkoutForm.address')}
                value={checkout.address}
                onChange={(e) =>
                  setCheckout((c) => ({ ...c, address: e.target.value }))
                }
              />
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder={t('cart.checkoutForm.notes')}
                value={checkout.notes}
                onChange={(e) =>
                  setCheckout((c) => ({ ...c, notes: e.target.value }))
                }
              />
              {orderError && (
                <p className="text-xs text-red-600">{orderError}</p>
              )}
              <button
                onClick={placeOrder}
                disabled={
                  submitting ||
                  !checkout.fullName ||
                  !checkout.email ||
                  !checkout.phone ||
                  !checkout.address
                }
                className="btn-primary w-full"
              >
                {submitting
                  ? t('cart.checkoutForm.submitting')
                  : t('cart.checkoutForm.confirm')}
              </button>
              <button
                onClick={() => setCheckout((c) => ({ ...c, open: false }))}
                className="block w-full text-xs text-neutral-500 underline"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-neutral-500">
            {t('cart.freeShippingNote')}
          </p>
        </aside>
      )}
    </div>
  );
}
