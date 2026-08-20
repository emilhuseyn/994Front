'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminInput, AdminSelect, AdminCheckbox } from './AdminInput';
import BilingualInput from './BilingualInput';
import AdminButton from './AdminButton';
import { useToast } from './ToastProvider';
import { adminApi, type ProductWriteDto } from '@/lib/api/admin';
import { catalogApi, type CategoryTreeNode } from '@/lib/api/catalog';
import { ApiError } from '@/lib/api';
import type { ApiBrand } from '@/lib/api-types';

interface Props {
  mode: 'create' | 'edit';
  initialValue?: Partial<ProductWriteDto> & { id?: number };
}

const EMPTY: ProductWriteDto = {
  nameAz: '',
  nameRu: '',
  nameEn: '',
  descriptionAz: '',
  descriptionRu: '',
  descriptionEn: '',
  sku: '',
  basePrice: 0,
  discountPrice: null,
  gender: 2,
  brandId: 0,
  categoryId: 0,
  isActive: true,
  isFeatured: false,
};

export default function ProductForm({ mode, initialValue }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [value, setValue] = useState<ProductWriteDto>({ ...EMPTY, ...initialValue });
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([catalogApi.brands(), catalogApi.categoriesTree()])
      .then(([b, c]) => {
        setBrands(b ?? []);
        setCategories(c ?? []);
      })
      .catch((err) => {
        toast.error('Brend / kateqoriya yüklənmədi: ' + (err as Error).message);
      });
  }, [toast]);

  function field<K extends keyof ProductWriteDto>(key: K, v: ProductWriteDto[K]) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!value.nameAz.trim()) e.nameAz = 'Tələbdir.';
    if (!value.nameRu.trim()) e.nameRu = 'Tələbdir.';
    if (!value.sku.trim()) e.sku = 'Tələbdir.';
    if (value.basePrice <= 0) e.basePrice = '0-dan böyük olmalıdır.';
    if (value.discountPrice != null && value.discountPrice >= value.basePrice)
      e.discountPrice = 'Əsas qiymətdən kiçik olmalıdır.';
    if (!value.brandId) e.brandId = 'Brend seçin.';
    if (!value.categoryId) e.categoryId = 'Kateqoriya seçin.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Formada xətalar var.');
      return;
    }
    setSaving(true);
    try {
      const payload: ProductWriteDto = {
        ...value,
        nameAz: value.nameAz.trim(),
        nameRu: value.nameRu.trim(),
        nameEn: value.nameEn?.trim() || undefined,
        sku: value.sku.trim(),
        descriptionAz: value.descriptionAz?.trim() || undefined,
        descriptionRu: value.descriptionRu?.trim() || undefined,
        descriptionEn: value.descriptionEn?.trim() || undefined,
        discountPrice:
          value.discountPrice != null && value.discountPrice > 0
            ? value.discountPrice
            : null,
      };

      if (mode === 'create') {
        const saved = await adminApi.products.create(payload);
        toast.success('Məhsul yaradıldı.');
        router.replace(`/admin/products/${saved.id}/edit`);
        router.refresh();
      } else if (initialValue?.id) {
        await adminApi.products.update(initialValue.id, payload);
        toast.success('Məhsul yeniləndi.');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
          Əsas məlumat
        </h2>
        <BilingualInput
          label="Ad"
          required
          valueAz={value.nameAz}
          valueRu={value.nameRu}
          valueEn={value.nameEn ?? ''}
          onChangeAz={(v) => field('nameAz', v)}
          onChangeRu={(v) => field('nameRu', v)}
          onChangeEn={(v) => field('nameEn', v)}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="SKU"
            required
            value={value.sku}
            error={errors.sku}
            onChange={(e) => field('sku', e.target.value)}
          />
          <AdminSelect
            label="Cins"
            value={String(value.gender)}
            onChange={(e) => field('gender', Number(e.target.value) as 0 | 1 | 2)}
          >
            <option value="0">Kişilər üçün</option>
            <option value="1">Qadınlar üçün</option>
            <option value="2">Uniseks</option>
          </AdminSelect>
          <AdminSelect
            label="Brend"
            required
            value={String(value.brandId)}
            error={errors.brandId}
            onChange={(e) => field('brandId', Number(e.target.value))}
          >
            <option value="0">— seç —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Kateqoriya"
            required
            value={String(value.categoryId)}
            error={errors.categoryId}
            onChange={(e) => field('categoryId', Number(e.target.value))}
          >
            <option value="0">— seç —</option>
            {categories.map((parent) => (
              <optgroup key={parent.id} label={parent.nameAz}>
                {parent.children?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAz}
                  </option>
                ))}
              </optgroup>
            ))}
          </AdminSelect>
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
          Qiymət
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="Əsas qiymət (₼)"
            type="number"
            step="0.01"
            min="0"
            required
            value={value.basePrice}
            error={errors.basePrice}
            onChange={(e) => field('basePrice', Number(e.target.value))}
          />
          <AdminInput
            label="Endirim qiyməti (₼)"
            hint="Boş saxla = endirim yoxdur"
            type="number"
            step="0.01"
            min="0"
            value={value.discountPrice ?? ''}
            error={errors.discountPrice}
            onChange={(e) =>
              field(
                'discountPrice',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
          />
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
          Açıqlama
        </h2>
        <BilingualInput
          label="Mətn"
          multiline
          rows={6}
          valueAz={value.descriptionAz ?? ''}
          valueRu={value.descriptionRu ?? ''}
          valueEn={value.descriptionEn ?? ''}
          onChangeAz={(v) => field('descriptionAz', v)}
          onChangeRu={(v) => field('descriptionRu', v)}
          onChangeEn={(v) => field('descriptionEn', v)}
        />
      </section>

      <section className="rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
          Vəziyyət
        </h2>
        <div className="space-y-3">
          <AdminCheckbox
            label="Aktiv"
            hint="Mağazada görünür"
            checked={value.isActive}
            onChange={(e) => field('isActive', e.target.checked)}
          />
          <AdminCheckbox
            label="Seçilmiş məhsul (Featured)"
            hint="Ana səhifədə görsənir"
            checked={value.isFeatured}
            onChange={(e) => field('isFeatured', e.target.checked)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href="/admin/products">
          <AdminButton variant="secondary" type="button">
            Ləğv et
          </AdminButton>
        </Link>
        <AdminButton type="submit" loading={saving}>
          {mode === 'create' ? 'Yarat' : 'Yadda saxla'}
        </AdminButton>
      </div>
    </form>
  );
}
