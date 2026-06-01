'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { useAuth } from '@/components/AuthProvider';
import { ordersApi } from '@/lib/api/orders';
import { ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatusValue,
} from '@/lib/orders';
import { useTranslation } from '@/i18n/useTranslation';
import type { ApiOrder } from '@/lib/api-types';

/** Badge colour per order status. */
const STATUS_BADGE: Record<OrderStatusValue, string> = {
  0: 'bg-amber-100 text-amber-800',
  1: 'bg-sky-100 text-sky-800',
  2: 'bg-sky-100 text-sky-800',
  3: 'bg-indigo-100 text-indigo-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-red-100 text-red-800',
};

export default function AccountPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect guests to login (preserving intent to return here).
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const list = await ordersApi.mine();
      setOrders(list ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadOrders();
  }, [isAuthenticated, loadOrders]);

  function handleLogout() {
    logout();
    router.replace('/');
  }

  // While auth resolves or redirect is pending, render nothing heavy.
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="container-shop py-16 text-center text-sm text-neutral-500">
        {t('common.loading')}
      </div>
    );
  }

  const localeTag = locale === 'RUS' ? 'ru-RU' : locale === 'ENG' ? 'en-US' : 'az-AZ';

  return (
    <div className="container-shop py-8">
      <Breadcrumb
        items={[
          { href: '/', label: t('shop.breadcrumb.home') },
          { label: t('account.title') },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-wider">
            {t('account.greeting', { name: user.fullName })}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{t('account.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:border-black"
        >
          {t('account.logout')}
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Profile card */}
        <aside>
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
              {t('account.profile')}
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t('auth.fullName')}
                </dt>
                <dd>{user.fullName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t('auth.email')}
                </dt>
                <dd className="break-all">{user.email}</dd>
              </div>
              {user.phoneNumber && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                    {t('auth.phone')}
                  </dt>
                  <dd>{user.phoneNumber}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t('account.memberSince')}
                </dt>
                <dd>{new Date(user.createdAt).toLocaleDateString(localeTag)}</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Orders */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
            {t('account.myOrders')}
          </h2>

          {loadingOrders ? (
            <p className="py-12 text-center text-sm text-neutral-500">
              {t('common.loading')}
            </p>
          ) : error ? (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center">
              <span className="text-3xl">🛍️</span>
              <p className="text-sm font-medium">{t('account.noOrders')}</p>
              <Link href="/shop" className="btn-primary mt-1">
                {t('account.startShopping')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                    <div>
                      <span className="font-mono text-sm font-semibold">
                        {o.orderNumber}
                      </span>
                      <span className="ml-2 text-xs text-neutral-500">
                        {new Date(o.createdAt).toLocaleDateString(localeTag)}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        STATUS_BADGE[o.status as OrderStatusValue] ?? 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[o.status as OrderStatusValue] ?? o.status}
                    </span>
                  </header>
                  <div className="px-4 py-3">
                    <ul className="divide-y divide-neutral-100">
                      {o.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{it.productName}</p>
                            <p className="text-[11px] text-neutral-500">
                              {it.colorName} · {it.sizeName} × {it.quantity}
                            </p>
                          </div>
                          <span className="whitespace-nowrap">
                            {formatPrice(it.totalPrice)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                      <span className="text-neutral-500">
                        {PAYMENT_METHOD_LABELS[o.paymentMethod] ?? ''}
                      </span>
                      <span className="font-semibold">
                        {t('cart.grandTotal')}: {formatPrice(o.totalAmount)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
