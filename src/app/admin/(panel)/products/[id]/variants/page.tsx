'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import { AdminInput, AdminSelect, AdminCheckbox } from '@/components/admin/AdminInput';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi, type VariantWriteDto } from '@/lib/api/admin';
import { catalogApi } from '@/lib/api/catalog';
import { ApiError } from '@/lib/api';
import type {
  ApiColor,
  ApiProductDetail,
  ApiProductVariant,
  ApiSize,
} from '@/lib/api-types';

interface Props {
  params: { id: string };
}

const EMPTY_NEW: VariantWriteDto = {
  colorId: 0,
  sizeId: 0,
  stockQuantity: 0,
  priceAdjustment: 0,
  sku: '',
  isActive: true,
};

export default function ProductVariantsPage({ params }: Props) {
  const id = Number(params.id);
  const toast = useToast();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [sizes, setSizes] = useState<ApiSize[]>([]);
  const [loading, setLoading] = useState(true);

  const [newVariant, setNewVariant] = useState<VariantWriteDto>(EMPTY_NEW);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<
    { stockQuantity: number; priceAdjustment: number; sku: string; isActive: boolean } | null
  >(null);
  const [updating, setUpdating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ApiProductVariant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await adminApi.products.get(id);
      setProduct(p);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
    Promise.all([catalogApi.colors(), catalogApi.sizes()])
      .then(([c, s]) => {
        setColors(c ?? []);
        setSizes(s ?? []);
      })
      .catch(() => undefined);
  }, [load]);

  const sortedVariants = useMemo(
    () =>
      product?.variants
        .slice()
        .sort((a, b) => a.colorNameAz.localeCompare(b.colorNameAz) || a.sizeName.localeCompare(b.sizeName)) ?? [],
    [product],
  );

  async function handleAdd() {
    if (!newVariant.colorId || !newVariant.sizeId) {
      toast.error('Rəng və ölçü seçin.');
      return;
    }
    setAdding(true);
    try {
      await adminApi.products.addVariant(id, {
        ...newVariant,
        stockQuantity: Math.max(0, Number(newVariant.stockQuantity)),
        priceAdjustment: Number(newVariant.priceAdjustment),
      });
      toast.success('Variant əlavə edildi.');
      setNewVariant(EMPTY_NEW);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  function beginEdit(v: ApiProductVariant) {
    setEditingId(v.id);
    setEditValues({
      stockQuantity: v.stockQuantity,
      priceAdjustment: v.priceAdjustment,
      sku: v.sku,
      isActive: v.isActive,
    });
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;
    setUpdating(true);
    try {
      await adminApi.products.updateVariant(editingId, {
        ...editValues,
        stockQuantity: Math.max(0, Number(editValues.stockQuantity)),
        priceAdjustment: Number(editValues.priceAdjustment),
      });
      toast.success('Variant yeniləndi.');
      setEditingId(null);
      setEditValues(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.products.deleteVariant(pendingDelete.id);
      toast.success('Variant silindi.');
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<ApiProductVariant>[] = [
    {
      key: 'combo',
      header: 'Rəng / Ölçü',
      cell: (v) => (
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-4 w-4 rounded-full border border-neutral-300"
            style={{ backgroundColor: v.colorHex }}
            aria-hidden
          />
          <span>{v.colorNameAz}</span>
          <span className="text-neutral-400">·</span>
          <span className="font-mono">{v.sizeName}</span>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      cell: (v) =>
        editingId === v.id ? (
          <input
            value={editValues?.sku ?? ''}
            onChange={(e) =>
              setEditValues((p) => (p ? { ...p, sku: e.target.value } : p))
            }
            className="w-32 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
        ) : (
          <span className="font-mono text-xs">{v.sku}</span>
        ),
    },
    {
      key: 'stock',
      header: 'Stok',
      align: 'right',
      cell: (v) =>
        editingId === v.id ? (
          <input
            type="number"
            min="0"
            value={editValues?.stockQuantity ?? 0}
            onChange={(e) =>
              setEditValues((p) =>
                p ? { ...p, stockQuantity: Number(e.target.value) } : p,
              )
            }
            className="w-20 rounded border border-neutral-300 px-2 py-1 text-right text-sm"
          />
        ) : (
          <span className={v.stockQuantity === 0 ? 'text-red-600' : ''}>
            {v.stockQuantity}
          </span>
        ),
    },
    {
      key: 'adjust',
      header: 'Qiymət düzəlişi (₼)',
      align: 'right',
      cell: (v) =>
        editingId === v.id ? (
          <input
            type="number"
            step="0.01"
            value={editValues?.priceAdjustment ?? 0}
            onChange={(e) =>
              setEditValues((p) =>
                p ? { ...p, priceAdjustment: Number(e.target.value) } : p,
              )
            }
            className="w-24 rounded border border-neutral-300 px-2 py-1 text-right text-sm"
          />
        ) : (
          v.priceAdjustment.toFixed(2)
        ),
    },
    {
      key: 'active',
      header: 'Aktiv',
      cell: (v) =>
        editingId === v.id ? (
          <input
            type="checkbox"
            checked={editValues?.isActive ?? true}
            onChange={(e) =>
              setEditValues((p) => (p ? { ...p, isActive: e.target.checked } : p))
            }
            className="h-4 w-4 accent-black"
          />
        ) : (
          <AdminBadge tone={v.isActive ? 'success' : 'neutral'}>
            {v.isActive ? 'Aktiv' : 'Passiv'}
          </AdminBadge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '160px',
      cell: (v) =>
        editingId === v.id ? (
          <div className="flex justify-end gap-1">
            <AdminButton size="sm" onClick={saveEdit} loading={updating}>
              Saxla
            </AdminButton>
            <AdminButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setEditValues(null);
              }}
            >
              Ləğv
            </AdminButton>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <AdminButton size="sm" variant="secondary" onClick={() => beginEdit(v)}>
              Redaktə
            </AdminButton>
            <AdminButton
              size="sm"
              variant="danger"
              onClick={() => setPendingDelete(v)}
            >
              Sil
            </AdminButton>
          </div>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Variantlar"
        subtitle={
          product
            ? `${product.nameAz} · ${product.variants.length} variant · Cəmi stok: ${product.totalStock}`
            : 'Yüklənir…'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/products/${id}/edit`}
              className="rounded border border-neutral-200 px-3 py-1.5 text-xs hover:border-black hover:bg-neutral-50"
            >
              Əsas məlumat
            </Link>
            <Link
              href={`/admin/products/${id}/images`}
              className="rounded border border-neutral-200 px-3 py-1.5 text-xs hover:border-black hover:bg-neutral-50"
            >
              Şəkillər
            </Link>
            <Link
              href="/admin/products"
              className="text-xs text-neutral-500 hover:text-black"
            >
              ← Siyahıya qayıt
            </Link>
          </div>
        }
      />

      <section className="mb-6 rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
          Yeni variant
        </h2>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <AdminSelect
            label="Rəng"
            value={String(newVariant.colorId)}
            onChange={(e) =>
              setNewVariant((v) => ({ ...v, colorId: Number(e.target.value) }))
            }
          >
            <option value="0">— seç —</option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAz}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Ölçü"
            value={String(newVariant.sizeId)}
            onChange={(e) =>
              setNewVariant((v) => ({ ...v, sizeId: Number(e.target.value) }))
            }
          >
            <option value="0">— seç —</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </AdminSelect>
          <AdminInput
            label="Stok"
            type="number"
            min="0"
            value={newVariant.stockQuantity}
            onChange={(e) =>
              setNewVariant((v) => ({
                ...v,
                stockQuantity: Number(e.target.value),
              }))
            }
          />
          <AdminInput
            label="Qiymət düzəlişi (₼)"
            type="number"
            step="0.01"
            value={newVariant.priceAdjustment}
            onChange={(e) =>
              setNewVariant((v) => ({
                ...v,
                priceAdjustment: Number(e.target.value),
              }))
            }
          />
          <AdminInput
            label="SKU (istəyə görə)"
            value={newVariant.sku ?? ''}
            onChange={(e) =>
              setNewVariant((v) => ({ ...v, sku: e.target.value }))
            }
          />
          <div className="flex items-center justify-between gap-2">
            <AdminCheckbox
              label="Aktiv"
              checked={newVariant.isActive !== false}
              onChange={(e) =>
                setNewVariant((v) => ({ ...v, isActive: e.target.checked }))
              }
            />
            <AdminButton onClick={handleAdd} loading={adding}>
              + Əlavə et
            </AdminButton>
          </div>
        </div>
      </section>

      <AdminTable
        columns={columns}
        rows={sortedVariants}
        rowKey={(v) => v.id}
        loading={loading}
        empty="Hələ variant yoxdur. Yuxarıdakı formada əlavə edin."
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Variantı sil"
        description={
          pendingDelete
            ? `${pendingDelete.colorNameAz} / ${pendingDelete.sizeName} variantı silinəcək.`
            : ''
        }
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
