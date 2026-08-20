'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminButton from '@/components/admin/AdminButton';
import AdminTable, { type Column, type SortDir } from '@/components/admin/AdminTable';
import { AdminInput, AdminSelect } from '@/components/admin/AdminInput';
import { useToast } from '@/components/admin/ToastProvider';
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
import type { ApiOrder } from '@/lib/api-types';

const PAGE_SIZE = 20;
type SortKey =
  | 'newest'
  | 'oldest'
  | 'total_desc'
  | 'total_asc'
  | 'status';

export default function AdminOrdersPage() {
  const toast = useToast();

  const [items, setItems] = useState<ApiOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced value sent to backend
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // Debounce the free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

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
        search: search || undefined,
        status: status === '' ? undefined : Number(status),
        paymentStatus: paymentStatus === '' ? undefined : Number(paymentStatus),
        paymentMethod: paymentMethod === '' ? undefined : Number(paymentMethod),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        minTotal: minTotal === '' ? undefined : Number(minTotal),
        maxTotal: maxTotal === '' ? undefined : Number(maxTotal),
        sort,
      });
      setItems(res?.items ?? []);
      setTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    page, search, status, paymentStatus, paymentMethod,
    dateFrom, dateTo, minTotal, maxTotal, sort, toast,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  function resetFilters() {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPaymentStatus('');
    setPaymentMethod('');
    setDateFrom('');
    setDateTo('');
    setMinTotal('');
    setMaxTotal('');
    setSort('newest');
    setPage(1);
  }

  const activeFilterCount =
    (search ? 1 : 0) +
    (status ? 1 : 0) +
    (paymentStatus ? 1 : 0) +
    (paymentMethod ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (minTotal ? 1 : 0) +
    (maxTotal ? 1 : 0);

  // Map sort key → (column, direction) for the sortable headers.
  const { tableSortBy, tableSortDir } = useMemo<{
    tableSortBy?: string;
    tableSortDir?: SortDir;
  }>(() => {
    switch (sort) {
      case 'newest': return { tableSortBy: 'date', tableSortDir: 'desc' };
      case 'oldest': return { tableSortBy: 'date', tableSortDir: 'asc' };
      case 'total_desc': return { tableSortBy: 'total', tableSortDir: 'desc' };
      case 'total_asc': return { tableSortBy: 'total', tableSortDir: 'asc' };
      default: return { tableSortBy: undefined, tableSortDir: undefined };
    }
  }, [sort]);

  function handleColumnSort(key: string, dir: SortDir) {
    if (key === 'date') setSort(dir === 'asc' ? 'oldest' : 'newest');
    else if (key === 'total') setSort(dir === 'asc' ? 'total_asc' : 'total_desc');
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
      key: 'payment',
      header: 'Ödəniş',
      cell: (o) => (
        <span className="text-xs text-neutral-600">
          {PAYMENT_METHOD_LABELS[o.paymentMethod] ?? '—'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Cəm',
      align: 'right',
      sortKey: 'total',
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
      sortKey: 'date',
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
        subtitle={
          loading
            ? 'Yüklənir…'
            : `${totalCount} sifariş${activeFilterCount > 0 ? ` · ${activeFilterCount} filter aktiv` : ''}`
        }
      />

      <div className="mb-4 space-y-3 rounded border border-neutral-200 bg-white p-4">
        {/* Row 1: search + status + payment status + payment method */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminInput
            label="Axtarış"
            placeholder="ORD-..., ad, e-poçt, telefon"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <AdminSelect
            label="Sifariş statusu"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Hamısı</option>
            {(Object.keys(ORDER_STATUS_LABELS) as unknown as OrderStatusValue[]).map((k) => (
              <option key={k} value={k}>{ORDER_STATUS_LABELS[k]}</option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Ödəniş statusu"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Hamısı</option>
            {(Object.keys(PAYMENT_STATUS_LABELS) as unknown as PaymentStatusValue[]).map((k) => (
              <option key={k} value={k}>{PAYMENT_STATUS_LABELS[k]}</option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Ödəniş üsulu"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Hamısı</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </AdminSelect>
        </div>

        {/* Row 2: date range + amount range + sort */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid grid-cols-2 gap-2">
            <AdminInput
              label="Tarixdən"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
            <AdminInput
              label="Tarixə"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AdminInput
              label="Min ₼"
              type="number"
              placeholder="0"
              value={minTotal}
              onChange={(e) => {
                setMinTotal(e.target.value);
                setPage(1);
              }}
            />
            <AdminInput
              label="Max ₼"
              type="number"
              placeholder="∞"
              value={maxTotal}
              onChange={(e) => {
                setMaxTotal(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <AdminSelect
            label="Sıralama"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
          >
            <option value="newest">Yeni əvvəl</option>
            <option value="oldest">Köhnə əvvəl</option>
            <option value="total_desc">Məbləğ: yuxarıdan</option>
            <option value="total_asc">Məbləğ: aşağıdan</option>
            <option value="status">Statusa görə</option>
          </AdminSelect>
          <div className="flex items-end">
            <AdminButton variant="secondary" onClick={resetFilters} className="w-full">
              Sıfırla
            </AdminButton>
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={items}
        rowKey={(o) => o.id}
        loading={loading}
        sortBy={tableSortBy}
        sortDir={tableSortDir}
        onSort={handleColumnSort}
        empty="Heç bir sifariş tapılmadı. Filtrləri yoxlayın və ya sıfırlayın."
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
