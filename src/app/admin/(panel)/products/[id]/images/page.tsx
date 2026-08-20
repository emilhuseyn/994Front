'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi } from '@/lib/api/admin';
import { ApiError, resolveImageUrl } from '@/lib/api';
import type { ApiProductDetail, ApiProductImage } from '@/lib/api-types';

interface Props {
  params: { id: string };
}

export default function ProductImagesPage({ params }: Props) {
  const id = Number(params.id);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ApiProductImage | null>(null);
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
  }, [load]);

  async function onSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      await adminApi.products.uploadImages(id, files);
      toast.success(`${files.length} şəkil yükləndi.`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function setMain(image: ApiProductImage) {
    try {
      await adminApi.products.setMainImage(image.id);
      toast.success('Əsas şəkil təyin edildi.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.products.deleteImage(pendingDelete.id);
      toast.success('Şəkil silindi.');
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const sorted = product?.images
    .slice()
    .sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.sortOrder - b.sortOrder);

  return (
    <>
      <PageHeader
        title="Şəkillər"
        subtitle={
          product
            ? `${product.nameAz} · ${product.images.length} şəkil`
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

      <div className="mb-6 rounded border-2 border-dashed border-neutral-300 bg-white p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onSelectFiles}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="block cursor-pointer">
          <p className="text-sm font-medium">Şəkil yükləmək üçün klikləyin</p>
          <p className="mt-1 text-xs text-neutral-500">
            Bir neçə şəkli birdən seçə bilərsiz. JPG, PNG, WebP.
          </p>
          <AdminButton
            type="button"
            variant="secondary"
            className="mt-3"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Şəkil seç
          </AdminButton>
        </label>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Yüklənir…</p>
      ) : !sorted || sorted.length === 0 ? (
        <p className="rounded border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">
          Hələ heç bir şəkil yoxdur.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((img) => (
            <li
              key={img.id}
              className="overflow-hidden rounded border border-neutral-200 bg-white"
            >
              <div className="relative aspect-square bg-neutral-100">
                <Image
                  src={resolveImageUrl(img.imageUrl)}
                  alt={img.altText ?? ''}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                {img.isMain && (
                  <div className="absolute left-2 top-2">
                    <AdminBadge tone="success">Əsas</AdminBadge>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <button
                  onClick={() => setMain(img)}
                  disabled={img.isMain}
                  className="text-xs text-neutral-600 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Əsas et
                </button>
                <button
                  onClick={() => setPendingDelete(img)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Şəkli sil"
        description="Bu şəkil həm DB-dən, həm də serverdən tamamilə silinəcək."
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
