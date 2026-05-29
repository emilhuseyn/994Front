'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import ProductForm from '@/components/admin/ProductForm';
import { adminApi } from '@/lib/api/admin';
import type { ApiProductDetail } from '@/lib/api-types';
import { useToast } from '@/components/admin/ToastProvider';
import { ApiError } from '@/lib/api';

interface Props {
  params: { id: string };
}

export default function EditProductPage({ params }: Props) {
  const id = Number(params.id);
  const toast = useToast();
  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const p = await adminApi.products.get(id);
        if (!cancelled) setProduct(p);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : (err as Error).message;
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  return (
    <>
      <PageHeader
        title={product?.nameAz ?? 'Məhsulu redaktə et'}
        subtitle={product ? `ID #${product.id} · SKU ${product.sku}` : '—'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/products/${id}/images`}
              className="rounded border border-neutral-200 px-3 py-1.5 text-xs hover:border-black hover:bg-neutral-50"
            >
              Şəkillər
            </Link>
            <Link
              href={`/admin/products/${id}/variants`}
              className="rounded border border-neutral-200 px-3 py-1.5 text-xs hover:border-black hover:bg-neutral-50"
            >
              Variantlar
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

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Yüklənir…</p>
      ) : error ? (
        <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : product ? (
        <ProductForm
          mode="edit"
          initialValue={{
            id: product.id,
            nameAz: product.nameAz,
            nameRu: product.nameRu,
            descriptionAz: product.descriptionAz ?? '',
            descriptionRu: product.descriptionRu ?? '',
            sku: product.sku,
            basePrice: product.basePrice,
            discountPrice: product.discountPrice ?? null,
            gender: product.gender,
            brandId: product.brandId,
            categoryId: product.categoryId,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
          }}
        />
      ) : null}
    </>
  );
}
