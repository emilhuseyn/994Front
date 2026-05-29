'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { AdminInput, AdminSelect, AdminCheckbox } from '@/components/admin/AdminInput';
import BilingualInput from '@/components/admin/BilingualInput';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi, type CategoryWriteDto } from '@/lib/api/admin';
import { catalogApi, type CategoryTreeNode } from '@/lib/api/catalog';
import { ApiError } from '@/lib/api';

const EMPTY_FORM: CategoryWriteDto = {
  nameAz: '',
  nameRu: '',
  nameEn: '',
  parentCategoryId: null,
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryWriteDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await catalogApi.categoriesTree();
      setTree(t ?? []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Flat parent options derived from tree
  const parentOptions = useMemo(() => {
    const opts: { id: number; label: string }[] = [];
    for (const parent of tree) {
      opts.push({ id: parent.id, label: parent.nameAz });
    }
    return opts;
  }, [tree]);

  function openCreate(parentId?: number) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, parentCategoryId: parentId ?? null });
    setFormOpen(true);
  }

  function openEdit(node: CategoryTreeNode) {
    setEditingId(node.id);
    setForm({
      nameAz: node.nameAz,
      nameRu: node.nameRu,
      nameEn: node.nameEn ?? '',
      parentCategoryId: node.parentCategoryId ?? null,
      imageUrl: node.imageUrl ?? '',
      sortOrder: node.sortOrder,
      isActive: node.isActive,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.nameAz.trim()) {
      toast.error('Az adı tələbdir.');
      return;
    }
    setSaving(true);
    try {
      const payload: CategoryWriteDto = {
        ...form,
        nameAz: form.nameAz.trim(),
        nameRu: (form.nameRu ?? '').trim() || form.nameAz.trim(),
        nameEn: form.nameEn?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
      };
      if (editingId) {
        await adminApi.categories.update(editingId, payload);
        toast.success('Kateqoriya yeniləndi.');
      } else {
        await adminApi.categories.create(payload);
        toast.success('Kateqoriya əlavə edildi.');
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
      await adminApi.categories.remove(pendingDelete.id);
      toast.success('Kateqoriya silindi.');
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Kateqoriyalar"
        subtitle={`${tree.length} ana kateqoriya · ${tree.reduce(
          (s, p) => s + (p.children?.length ?? 0),
          0,
        )} alt kateqoriya`}
        actions={
          <AdminButton onClick={() => openCreate()}>+ Yeni kateqoriya</AdminButton>
        }
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Yüklənir…</p>
      ) : tree.length === 0 ? (
        <p className="rounded border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">
          Hələ kateqoriya yoxdur.
        </p>
      ) : (
        <ul className="space-y-3">
          {tree.map((parent) => (
            <li
              key={parent.id}
              className="rounded border border-neutral-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{parent.nameAz}</span>
                  <span className="text-xs text-neutral-500">/{parent.slug}</span>
                  <AdminBadge tone={parent.isActive ? 'success' : 'neutral'}>
                    {parent.isActive ? 'Aktiv' : 'Passiv'}
                  </AdminBadge>
                  <span className="text-xs text-neutral-500">
                    {parent.productCount} məhsul
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    onClick={() => openCreate(parent.id)}
                  >
                    + Alt
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(parent)}
                  >
                    Redaktə
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setPendingDelete({ id: parent.id, name: parent.nameAz })
                    }
                  >
                    Sil
                  </AdminButton>
                </div>
              </div>
              {parent.children && parent.children.length > 0 && (
                <ul className="divide-y divide-neutral-100">
                  {parent.children
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((child) => (
                      <li
                        key={child.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 pl-10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-400">└</span>
                          <span>{child.nameAz}</span>
                          <span className="text-xs text-neutral-500">/{child.slug}</span>
                          <AdminBadge tone={child.isActive ? 'success' : 'neutral'}>
                            {child.isActive ? 'Aktiv' : 'Passiv'}
                          </AdminBadge>
                          <span className="text-xs text-neutral-500">
                            {child.productCount} məhsul
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <AdminButton
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(child)}
                          >
                            Redaktə
                          </AdminButton>
                          <AdminButton
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              setPendingDelete({ id: child.id, name: child.nameAz })
                            }
                          >
                            Sil
                          </AdminButton>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        title={editingId ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}
        onClose={() => setFormOpen(false)}
      >
        <div className="space-y-3">
          <BilingualInput
            label="Ad"
            required
            valueAz={form.nameAz}
            valueRu={form.nameRu ?? ''}
            valueEn={form.nameEn ?? ''}
            onChangeAz={(v) => setForm((f) => ({ ...f, nameAz: v }))}
            onChangeRu={(v) => setForm((f) => ({ ...f, nameRu: v }))}
            onChangeEn={(v) => setForm((f) => ({ ...f, nameEn: v }))}
          />
          <AdminSelect
            label="Ana kateqoriya"
            hint="Boş = ana səviyyə"
            value={String(form.parentCategoryId ?? '')}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                parentCategoryId: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            <option value="">— ana səviyyə —</option>
            {parentOptions
              .filter((o) => o.id !== editingId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
          </AdminSelect>
          <AdminInput
            label="Şəkil URL (istəyə görə)"
            value={form.imageUrl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          />
          <AdminInput
            label="Sıralama"
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
            }
          />
          <AdminCheckbox
            label="Aktiv"
            checked={form.isActive ?? true}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
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
        title="Kateqoriyanı sil"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" kateqoriyası silinəcək (soft-delete). Bu kateqoriyada məhsul varsa silinmə uğursuz ola bilər.`
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
