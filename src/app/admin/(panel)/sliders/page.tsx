'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { AdminInput, AdminCheckbox } from '@/components/admin/AdminInput';
import BilingualInput from '@/components/admin/BilingualInput';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi, type SliderWriteDto } from '@/lib/api/admin';
import { ApiError, resolveImageUrl } from '@/lib/api';
import type { ApiSlider } from '@/lib/api-types';

const EMPTY_FORM: SliderWriteDto = {
  titleAz: '',
  titleRu: '',
  titleEn: '',
  subtitleAz: '',
  subtitleRu: '',
  subtitleEn: '',
  imageUrl: '',
  buttonTextAz: '',
  buttonTextRu: '',
  buttonTextEn: '',
  buttonUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminSlidersPage() {
  const toast = useToast();
  const [items, setItems] = useState<ApiSlider[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SliderWriteDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ApiSlider | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const res = await adminApi.uploadFile(file, 'sliders');
      setForm((f) => ({ ...f, imageUrl: res.url }));
      toast.success('Şəkil yükləndi.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.sliders.list();
      setItems((list ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: items.length });
    setFormOpen(true);
  }

  function openEdit(s: ApiSlider) {
    setEditingId(s.id);
    setForm({
      titleAz: s.titleAz,
      titleRu: s.titleRu,
      titleEn: s.titleEn ?? '',
      subtitleAz: s.subtitleAz ?? '',
      subtitleRu: s.subtitleRu ?? '',
      subtitleEn: s.subtitleEn ?? '',
      imageUrl: s.imageUrl,
      buttonTextAz: s.buttonTextAz ?? '',
      buttonTextRu: s.buttonTextRu ?? '',
      buttonTextEn: s.buttonTextEn ?? '',
      buttonUrl: s.buttonUrl ?? '',
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.titleAz.trim()) {
      toast.error('Az başlıq tələbdir.');
      return;
    }
    if (!form.imageUrl.trim()) {
      toast.error('Şəkil URL tələbdir.');
      return;
    }
    setSaving(true);
    try {
      const payload: SliderWriteDto = {
        ...form,
        titleAz: form.titleAz.trim(),
        titleRu: (form.titleRu || form.titleAz).trim(),
        titleEn: form.titleEn?.trim() || undefined,
        subtitleAz: form.subtitleAz?.trim() || undefined,
        subtitleRu: form.subtitleRu?.trim() || undefined,
        subtitleEn: form.subtitleEn?.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        buttonTextAz: form.buttonTextAz?.trim() || undefined,
        buttonTextRu: form.buttonTextRu?.trim() || undefined,
        buttonTextEn: form.buttonTextEn?.trim() || undefined,
        buttonUrl: form.buttonUrl?.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingId) {
        await adminApi.sliders.update(editingId, payload);
        toast.success('Slider yeniləndi.');
      } else {
        await adminApi.sliders.create(payload);
        toast.success('Slider əlavə edildi.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.sliders.remove(pendingDelete.id);
      toast.success('Slider silindi.');
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<ApiSlider>[] = [
    {
      key: 'image',
      header: '',
      width: '80px',
      cell: (s) => (
        <div className="relative h-12 w-20 overflow-hidden rounded bg-neutral-100">
          {s.imageUrl ? (
            <Image
              src={resolveImageUrl(s.imageUrl)}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : null}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Başlıq',
      cell: (s) => (
        <div>
          <p className="font-medium">
            <span className="mr-1 rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-neutral-500">
              AZ
            </span>
            {s.titleAz}
          </p>
          {s.titleRu && s.titleRu !== s.titleAz && (
            <p className="mt-0.5 text-[11px] text-neutral-500">
              <span className="mr-1 rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-neutral-500">
                RU
              </span>
              {s.titleRu}
            </p>
          )}
          {s.titleEn && s.titleEn !== s.titleAz && (
            <p className="mt-0.5 text-[11px] text-neutral-500">
              <span className="mr-1 rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-neutral-500">
                EN
              </span>
              {s.titleEn}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'cta',
      header: 'CTA',
      cell: (s) =>
        s.buttonTextAz ? (
          <div>
            <p className="text-xs">{s.buttonTextAz}</p>
            {s.buttonUrl && (
              <p className="font-mono text-[11px] text-neutral-500">{s.buttonUrl}</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      key: 'sort',
      header: 'Sıra',
      align: 'right',
      cell: (s) => s.sortOrder,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <AdminBadge tone={s.isActive ? 'success' : 'neutral'}>
          {s.isActive ? 'Aktiv' : 'Passiv'}
        </AdminBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '160px',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <AdminButton size="sm" variant="secondary" onClick={() => openEdit(s)}>
            Redaktə
          </AdminButton>
          <AdminButton
            size="sm"
            variant="danger"
            onClick={() => setPendingDelete(s)}
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
        title="Sliderlər"
        subtitle={`${items.length} slider · ${items.filter((s) => s.isActive).length} aktiv`}
        actions={<AdminButton onClick={openCreate}>+ Yeni slider</AdminButton>}
      />

      <AdminTable
        columns={columns}
        rows={items}
        rowKey={(s) => s.id}
        loading={loading}
        empty="Heç bir slider yoxdur."
      />

      <Modal
        open={formOpen}
        title={editingId ? 'Slideri redaktə et' : 'Yeni slider'}
        onClose={() => setFormOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <BilingualInput
            label="Başlıq"
            required
            valueAz={form.titleAz}
            valueRu={form.titleRu}
            valueEn={form.titleEn ?? ''}
            onChangeAz={(v) => setForm((f) => ({ ...f, titleAz: v }))}
            onChangeRu={(v) => setForm((f) => ({ ...f, titleRu: v }))}
            onChangeEn={(v) => setForm((f) => ({ ...f, titleEn: v }))}
          />
          <BilingualInput
            label="Alt başlıq"
            multiline
            valueAz={form.subtitleAz ?? ''}
            valueRu={form.subtitleRu ?? ''}
            valueEn={form.subtitleEn ?? ''}
            onChangeAz={(v) => setForm((f) => ({ ...f, subtitleAz: v }))}
            onChangeRu={(v) => setForm((f) => ({ ...f, subtitleRu: v }))}
            onChangeEn={(v) => setForm((f) => ({ ...f, subtitleEn: v }))}
          />
          <div>
            <label className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-neutral-600">
              <span>
                Şəkil URL <span className="text-red-600">*</span>
              </span>
              <label className="cursor-pointer rounded border border-neutral-200 px-2 py-0.5 text-[10px] normal-case text-neutral-600 hover:border-black hover:text-black">
                {uploading ? 'Yüklənir…' : '⬆ Fayl yüklə'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </label>
            <input
              required
              value={form.imageUrl}
              placeholder="https://... və ya /uploads/..."
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="block w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Birbaşa URL yapışdıra və ya yuxarıdakı düymə ilə kompüterdən şəkil yükləyə bilərsiniz.
            </p>
          </div>
          {form.imageUrl && (
            <div className="relative h-32 w-full overflow-hidden rounded border border-neutral-200 bg-neutral-100">
              <Image
                src={resolveImageUrl(form.imageUrl)}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}
          <BilingualInput
            label="Düymə mətni"
            valueAz={form.buttonTextAz ?? ''}
            valueRu={form.buttonTextRu ?? ''}
            valueEn={form.buttonTextEn ?? ''}
            onChangeAz={(v) => setForm((f) => ({ ...f, buttonTextAz: v }))}
            onChangeRu={(v) => setForm((f) => ({ ...f, buttonTextRu: v }))}
            onChangeEn={(v) => setForm((f) => ({ ...f, buttonTextEn: v }))}
          />
          <AdminInput
            label="Düymə URL"
            placeholder="/shop və ya https://..."
            value={form.buttonUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label="Sıralama"
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
              }
            />
            <div className="flex items-end">
              <AdminCheckbox
                label="Aktiv"
                checked={form.isActive ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="secondary" onClick={() => setFormOpen(false)}>
              Ləğv
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {editingId ? 'Yadda saxla' : 'Yarat'}
            </AdminButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Slideri sil"
        description={
          pendingDelete ? `"${pendingDelete.titleAz}" silinəcək.` : ''
        }
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
