'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import { AdminSelect } from '@/components/admin/AdminInput';
import { useToast } from '@/components/admin/ToastProvider';
import AddressMap from '@/components/admin/AddressMap';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  PAYMENT_METHOD_LABELS,
  type OrderStatusValue,
  type PaymentStatusValue,
} from '@/lib/orders';
import type { ApiOrder, ApiOrderItem } from '@/lib/api-types';

interface Props {
  params: { id: string };
}

export default function AdminOrderDetailPage({ params }: Props) {
  const id = Number(params.id);
  const toast = useToast();

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const o = await adminApi.orders.get(id);
      setOrder(o);
      setStatus(o.status);
      setPaymentStatus(o.paymentStatus);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveStatus() {
    setSaving(true);
    try {
      const updated = await adminApi.orders.updateStatus(id, {
        status,
        paymentStatus,
      });
      setOrder(updated);
      toast.success('Status yeniləndi.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<ApiOrderItem>[] = [
    {
      key: 'product',
      header: 'Məhsul',
      cell: (i) => (
        <div>
          <p className="text-sm font-medium">{i.productName}</p>
          <p className="text-[11px] text-neutral-500">
            {i.colorName} · {i.sizeName}
          </p>
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'Say',
      align: 'right',
      width: '80px',
      cell: (i) => i.quantity,
    },
    {
      key: 'unit',
      header: 'Vahid',
      align: 'right',
      width: '120px',
      cell: (i) => formatPrice(i.unitPrice),
    },
    {
      key: 'total',
      header: 'Cəm',
      align: 'right',
      width: '120px',
      cell: (i) => <span className="font-semibold">{formatPrice(i.totalPrice)}</span>,
    },
  ];

  if (loading) {
    return <p className="py-12 text-center text-sm text-neutral-500">Yüklənir…</p>;
  }

  if (error || !order) {
    return (
      <>
        <PageHeader title="Sifariş tapılmadı" />
        <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? 'Bu sifariş mövcud deyil.'}
        </p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-block text-xs text-neutral-500 hover:text-black"
        >
          ← Siyahıya qayıt
        </Link>
      </>
    );
  }

  const dirty = status !== order.status || paymentStatus !== order.paymentStatus;

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={`Sifariş #${order.id} · ${new Date(order.createdAt).toLocaleString('az-AZ')}`}
        actions={
          <Link
            href="/admin/orders"
            className="text-xs text-neutral-500 hover:text-black"
          >
            ← Siyahıya qayıt
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="rounded border border-neutral-200 bg-white">
            <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Məhsullar
              </h2>
              <span className="text-xs text-neutral-500">
                {order.items.length} sətir
              </span>
            </header>
            <div className="p-3">
              <AdminTable
                columns={columns}
                rows={order.items}
                rowKey={(i) => i.id}
                empty="Sifarişdə məhsul yoxdur."
              />
              <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3 text-sm">
                <div className="text-right">
                  <p className="text-neutral-600">Cəm məbləğ</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
              Müştəri
            </h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Ad Soyad
                </dt>
                <dd>{order.customerFullName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  E-poçt
                </dt>
                <dd>
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-neutral-700 hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Telefon
                </dt>
                <dd>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-neutral-700 hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Ödəniş üsulu
                </dt>
                <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Çatdırılma ünvanı
                </dt>
                <dd className="whitespace-pre-line">{order.deliveryAddress}</dd>
                {order.deliveryAddress?.trim() && (
                  <div className="mt-3">
                    <AddressMap address={order.deliveryAddress} />
                  </div>
                )}
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
                    Qeyd
                  </dt>
                  <dd className="whitespace-pre-line">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
              Cari status
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge tone={ORDER_STATUS_TONE[order.status as OrderStatusValue]}>
                {ORDER_STATUS_LABELS[order.status as OrderStatusValue]}
              </AdminBadge>
              <AdminBadge tone={PAYMENT_STATUS_TONE[order.paymentStatus as PaymentStatusValue]}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatusValue]}
              </AdminBadge>
            </div>
          </div>

          <div className="rounded border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
              Status dəyiş
            </h2>
            <div className="space-y-3">
              <AdminSelect
                label="Sifariş statusu"
                value={String(status)}
                onChange={(e) => setStatus(Number(e.target.value))}
              >
                {(Object.keys(ORDER_STATUS_LABELS) as unknown as OrderStatusValue[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {ORDER_STATUS_LABELS[k]}
                    </option>
                  ),
                )}
              </AdminSelect>
              <AdminSelect
                label="Ödəniş statusu"
                value={String(paymentStatus)}
                onChange={(e) => setPaymentStatus(Number(e.target.value))}
              >
                {(Object.keys(PAYMENT_STATUS_LABELS) as unknown as PaymentStatusValue[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {PAYMENT_STATUS_LABELS[k]}
                    </option>
                  ),
                )}
              </AdminSelect>
              <AdminButton
                onClick={saveStatus}
                loading={saving}
                disabled={!dirty}
                className="w-full"
              >
                {dirty ? 'Yadda saxla' : 'Dəyişiklik yoxdur'}
              </AdminButton>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
