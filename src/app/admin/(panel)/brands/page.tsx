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
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi, type BrandWriteDto } from '@/lib/api/admin';
import { catalogApi } from '@/lib/api/catalog';
import { ApiError, resolveImageUrl } from '@/lib/api';
import type { ApiBrand } from '@/lib/api-types';

const EMPTY_FORM: BrandWriteDto = {
  name: '',
  logoUrl: '',
  isActive: true,
};

export default function AdminBrandsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ApiBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BrandWriteDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ApiBrand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await catalogApi.brands();
      setItems((list ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)));
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
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(b: ApiBrand) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      logoUrl: b.logoUrl ?? '',
      isActive: b.isActive,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error('Brend adı tələbdir.');
      return;
    }
    setSaving(true);
    try {
      const payload: BrandWriteDto = {
        name: form.name.trim(),
        logoUrl: form.logoUrl?.trim() || undefined,
        isActive: form.isActive,
      };
      if (editingId) {
        await adminApi.brands.update(editingId, payload);
        toast.success('Brend yeniləndi.');
      } else {
        await adminApi.brands.create(payload);
        toast.success('Brend əlavə edildi.');
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
      await adminApi.brands.remove(pendingDelete.id);
      toast.success(`"${pendingDelete.name}" silindi.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<ApiBrand>[] = [
    {
      key: 'logo',
      header: '',
      width: '60px',
      cell: (b) => (
        <div className="relative h-10 w-10 overflow-hidden rounded bg-neutral-100">
          {b.logoUrl ? (
            <Image
              src={resolveImageUrl(b.logoUrl)}
              alt={b.name}
              fill
              sizes="40px"
              className="object-contain p-1"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs font-semibold text-neutral-500">
              {b.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Brend',
      cell: (b) => (
        <div>
          <p className="font-medium">{b.name}</p>
          <p className="text-[11px] text-neutral-500">/{b.slug}</p>
        </div>
      ),
    },
    {
      key: 'count',
      header: 'Məhsul sayı',
      align: 'right',
      cell: (b) => b.productCount,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => (
        <AdminBadge tone={b.isActive ? 'success' : 'neutral'}>
          {b.isActive ? 'Aktiv' : 'Passiv'}
        </AdminBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '160px',
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <AdminButton size="sm" variant="secondary" onClick={() => openEdit(b)}>
            Redaktə
          </AdminButton>
          <AdminButton
            size="sm"
            variant="danger"
            onClick={() => setPendingDelete(b)}
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
        title="Brendlər"
        subtitle={`${items.length} brend`}
        actions={<AdminButton onClick={openCreate}>+ Yeni brend</AdminButton>}
      />

      <AdminTable
        columns={columns}
        rows={items}
        rowKey={(b) => b.id}
        loading={loading}
        empty="Heç bir brend yoxdur."
      />

      <Modal
        open={formOpen}
        title={editingId ? 'Brendi redaktə et' : 'Yeni brend'}
        onClose={() => setFormOpen(false)}
      >
        <div className="space-y-3">
          <AdminInput
            label="Ad"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <AdminInput
            label="Logo URL"
            placeholder="https://... və ya /uploads/..."
            value={form.logoUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
          />
          {form.logoUrl && (
            <div className="rounded border border-neutral-200 p-2">
              <p className="mb-2 text-xs text-neutral-500">Ön baxış:</p>
              <div className="relative h-16 w-16 overflow-hidden rounded bg-neutral-100">
                <Image
                  src={resolveImageUrl(form.logoUrl)}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-2"
                />
              </div>
            </div>
          )}
          <AdminCheckbox
            label="Aktiv"
            checked={form.isActive ?? true}
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.checked }))
            }
          />
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
        title="Brendi sil"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" silinəcək (soft-delete). Bu brendə bağlı məhsullar varsa silinmə uğursuz ola bilər.`
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
