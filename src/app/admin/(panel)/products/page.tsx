'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminTable, { type Column, type SortDir } from '@/components/admin/AdminTable';
import { AdminInput, AdminSelect } from '@/components/admin/AdminInput';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { ApiError, resolveImageUrl } from '@/lib/api';
import { adminApi } from '@/lib/api/admin';
import { catalogApi } from '@/lib/api/catalog';
import { productsApi, type ProductListQuery } from '@/lib/api/products';
import { formatPrice } from '@/lib/format';
import type { ApiBrand, ApiProductListItem } from '@/lib/api-types';
import type { CategoryTreeNode } from '@/lib/api/catalog';

const PAGE_SIZE = 12;
const GENDER_LABELS = ['Kişi', 'Qadın', 'Uniseks'];

/**
 * Sort options exposed in the admin UI.  `value` is the backend sort key,
 * `label` is the Azerbaijani label shown in the dropdown.
 */
type SortOption = NonNullable<ProductListQuery['sort']>;
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Yeni əvvəl' },
  { value: 'oldest',     label: 'Köhnə əvvəl' },
  { value: 'name_asc',   label: 'Ad: A → Z' },
  { value: 'name_desc',  label: 'Ad: Z → A' },
  { value: 'price_asc',  label: 'Qiymət: aşağıdan yuxarı' },
  { value: 'price_desc', label: 'Qiymət: yuxarıdan aşağı' },
  { value: 'stock_asc',  label: 'Stok: azdan çoxa' },
  { value: 'stock_desc', label: 'Stok: çoxdan aza' },
];

export default function AdminProductsPage() {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [gender, setGender] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ApiProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);

  const [pendingDelete, setPendingDelete] = useState<ApiProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list(
        {
          page,
          pageSize: PAGE_SIZE,
          search: search.trim() || undefined,
          brandSlug: brandSlug || undefined,
          categorySlug: categorySlug || undefined,
          gender:
            gender === ''
              ? undefined
              : (Number(gender) as 0 | 1 | 2),
          sort,
        },
        true,
      );
      setItems(res?.items ?? []);
      setTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, brandSlug, categorySlug, gender, sort, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([catalogApi.brands(), catalogApi.categoriesTree()])
      .then(([b, c]) => {
        setBrands(b ?? []);
        setCategories(c ?? []);
      })
      .catch(() => {
        /* ignored — page still works without filters */
      });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.products.remove(pendingDelete.id);
      toast.success(`"${pendingDelete.nameAz}" silindi.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, toast, load]);

  // Derive (sortBy, sortDir) for the table from the current sort key.
  // The sort dropdown above can choose values the table can't represent
  // (e.g. "oldest"); when that happens the table simply shows no active
  // direction marker.
  const { tableSortBy, tableSortDir } = useMemo(() => {
    const parts = sort.split('_');
    if (parts.length === 2 && (parts[1] === 'asc' || parts[1] === 'desc')) {
      return { tableSortBy: parts[0], tableSortDir: parts[1] as SortDir };
    }
    if (sort === 'newest') return { tableSortBy: 'date', tableSortDir: 'desc' as SortDir };
    if (sort === 'oldest') return { tableSortBy: 'date', tableSortDir: 'asc' as SortDir };
    return { tableSortBy: undefined, tableSortDir: undefined };
  }, [sort]);

  function handleColumnSort(sortKey: string, nextDir: SortDir) {
    // Map (column, direction) to one of the backend sort enum values.  We
    // keep this mapping centralised here instead of leaking it into the
    // AdminTable component.
    if (sortKey === 'name') setSort(nextDir === 'asc' ? 'name_asc' : 'name_desc');
    else if (sortKey === 'price') setSort(nextDir === 'asc' ? 'price_asc' : 'price_desc');
    else if (sortKey === 'date') setSort(nextDir === 'asc' ? 'oldest' : 'newest');
    setPage(1);
  }

  const columns: Column<ApiProductListItem>[] = [
    {
      key: 'image',
      header: '',
      width: '60px',
      cell: (p) => (
        <div className="relative h-12 w-12 overflow-hidden rounded bg-neutral-100">
          {p.mainImageUrl ? (
            <Image
              src={resolveImageUrl(p.mainImageUrl)}
              alt={p.nameAz}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : null}
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Məhsul',
      sortKey: 'name',
      cell: (p) => (
        <div>
          <Link
            href={`/admin/products/${p.id}/edit`}
            className="font-medium hover:underline"
          >
            {p.nameAz}
          </Link>
          <p className="text-[11px] text-neutral-500">
            {p.brandName} · {p.categoryNameAz} · SKU: {p.sku}
          </p>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Cins',
      cell: (p) => (
        <span className="text-xs text-neutral-600">
          {GENDER_LABELS[p.gender]}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Qiymət',
      align: 'right',
      sortKey: 'price',
      cell: (p) => (
        <div className="text-right text-sm">
          {p.discountPrice ? (
            <>
              <span className="text-neutral-400 line-through">
                {formatPrice(p.basePrice)}
              </span>{' '}
              <span className="font-semibold text-red-600">
                {formatPrice(p.discountPrice)}
              </span>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(p.basePrice)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          <AdminBadge tone={p.isActive ? 'success' : 'neutral'}>
            {p.isActive ? 'Aktiv' : 'Passiv'}
          </AdminBadge>
          {p.isFeatured && <AdminBadge tone="info">Seçilmiş</AdminBadge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '180px',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/products/${p.id}/edit`}
            className="rounded border border-neutral-200 px-2 py-1 text-xs hover:border-black hover:bg-neutral-50"
          >
            Redaktə
          </Link>
          <Link
            href={`/admin/products/${p.id}/images`}
            className="rounded border border-neutral-200 px-2 py-1 text-xs hover:border-black hover:bg-neutral-50"
          >
            Şəkillər
          </Link>
          <Link
            href={`/admin/products/${p.id}/variants`}
            className="rounded border border-neutral-200 px-2 py-1 text-xs hover:border-black hover:bg-neutral-50"
          >
            Variantlar
          </Link>
          <button
            onClick={() => setPendingDelete(p)}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Sil
          </button>
        </div>
      ),
    },
  ];

  function resetFilters() {
    setSearch('');
    setBrandSlug('');
    setCategorySlug('');
    setGender('');
    setSort('newest');
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Məhsullar"
        subtitle={`Cəmi ${totalCount} məhsul`}
        actions={
          <Link href="/admin/products/new">
            <AdminButton>+ Yeni məhsul</AdminButton>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 rounded border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <AdminInput
          label="Axtarış"
          placeholder="ad, SKU, brend"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <AdminSelect
          label="Brend"
          value={brandSlug}
          onChange={(e) => {
            setBrandSlug(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Hamısı</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Kateqoriya"
          value={categorySlug}
          onChange={(e) => {
            setCategorySlug(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Hamısı</option>
          {categories.map((parent) => (
            <optgroup key={parent.slug} label={parent.nameAz}>
              <option value={parent.slug}>{parent.nameAz} (hamısı)</option>
              {parent.children?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  &nbsp;&nbsp;{c.nameAz}
                </option>
              ))}
            </optgroup>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Cins"
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Hamısı</option>
          <option value="0">Kişi</option>
          <option value="1">Qadın</option>
          <option value="2">Uniseks</option>
        </AdminSelect>
        <AdminSelect
          label="Sıralama"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOption);
            setPage(1);
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </AdminSelect>
        <div className="flex items-end">
          <AdminButton variant="secondary" onClick={resetFilters} className="w-full">
            Sıfırla
          </AdminButton>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        loading={loading}
        sortBy={tableSortBy}
        sortDir={tableSortDir}
        onSort={handleColumnSort}
        empty="Heç bir məhsul tapılmadı. Yeni məhsul yaratmaq üçün yuxarıdakı düyməni istifadə edin."
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Məhsulu sil"
        description={
          pendingDelete
            ? `"${pendingDelete.nameAz}" məhsulu silinəcək. Bu əməliyyat geri qaytarıla bilməz (soft-delete).`
            : ''
        }
        confirmLabel="Sil"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
