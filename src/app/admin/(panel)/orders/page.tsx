'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminButton from '@/components/admin/AdminButton';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import { AdminInput, AdminSelect } from '@/components/admin/AdminInput';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  type OrderStatusValue,
  type PaymentStatusValue,
} from '@/lib/orders';
import type { ApiOrder } from '@/lib/api-types';

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const toast = useToast();

  const [items, setItems] = useState<ApiOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.orders.list({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter === '' ? undefined : Number(statusFilter),
      });
      setItems(res?.items ?? []);
      setTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search filter — backend doesn't support customer search yet
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(s) ||
        o.customerFullName.toLowerCase().includes(s) ||
        o.customerEmail.toLowerCase().includes(s) ||
        o.customerPhone.toLowerCase().includes(s),
    );
  }, [items, search]);

  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  }

  const columns: Column<ApiOrder>[] = [
    {
      key: 'orderNumber',
      header: 'Nömrə',
      cell: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          className="font-mono text-xs font-semibold hover:underline"
        >
          {o.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Müştəri',
      cell: (o) => (
        <div>
          <p className="text-sm font-medium">{o.customerFullName}</p>
          <p className="text-[11px] text-neutral-500">
            {o.customerEmail} · {o.customerPhone}
          </p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Məhsullar',
      align: 'right',
      cell: (o) => (
        <span className="text-xs text-neutral-600">
          {o.items?.length ?? 0} sətir
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Cəm',
      align: 'right',
      cell: (o) => <span className="font-semibold">{formatPrice(o.totalAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (o) => (
        <div className="flex flex-col gap-1">
          <AdminBadge tone={ORDER_STATUS_TONE[o.status as OrderStatusValue]}>
            {ORDER_STATUS_LABELS[o.status as OrderStatusValue]}
          </AdminBadge>
          <AdminBadge tone={PAYMENT_STATUS_TONE[o.paymentStatus as PaymentStatusValue]}>
            {PAYMENT_STATUS_LABELS[o.paymentStatus as PaymentStatusValue]}
          </AdminBadge>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tarix',
      cell: (o) => (
        <span className="text-xs text-neutral-600">
          {new Date(o.createdAt).toLocaleString('az-AZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      cell: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          className="rounded border border-neutral-200 px-3 py-1 text-xs hover:border-black hover:bg-neutral-50"
        >
          Detallar
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sifarişlər"
        subtitle={`Cəmi ${totalCount} sifariş`}
      />

      <div className="mb-4 grid gap-3 rounded border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminInput
          label="Axtarış (cari səhifədə)"
          placeholder="ORD-2026-..., ad, e-poçt, telefon"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AdminSelect
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Hamısı</option>
          {(Object.keys(ORDER_STATUS_LABELS) as unknown as OrderStatusValue[]).map(
            (k) => (
              <option key={k} value={k}>
                {ORDER_STATUS_LABELS[k]}
              </option>
            ),
          )}
        </AdminSelect>
        <div className="flex items-end">
          <AdminButton variant="secondary" onClick={resetFilters} className="w-full">
            Sıfırla
          </AdminButton>
        </div>
        <div className="flex items-end justify-end text-xs text-neutral-500">
          <p>
            Sürətli filterləri sidebar-dan keçmiş{' '}
            <span className="font-semibold">{ORDER_STATUS_LABELS[ORDER_STATUS.Pending]}</span>{' '}
            sifarişlərə baxın
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={filtered}
        rowKey={(o) => o.id}
        loading={loading}
        empty="Heç bir sifariş tapılmadı."
      />

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-1 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-[36px] rounded border px-3 py-1 ${
                p === page
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 text-neutral-700 hover:border-black'
              }`}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
