'use client';

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { AdminInput } from '@/components/admin/AdminInput';
import BilingualInput from '@/components/admin/BilingualInput';
import { useToast } from '@/components/admin/ToastProvider';
import {
  adminApi,
  type ColorWriteDto,
  type SizeWriteDto,
} from '@/lib/api/admin';
import { catalogApi } from '@/lib/api/catalog';
import { ApiError } from '@/lib/api';
import type { ApiColor, ApiSize } from '@/lib/api-types';

const EMPTY_COLOR: ColorWriteDto = { nameAz: '', nameRu: '', nameEn: '', hexCode: '#000000' };
const EMPTY_SIZE: SizeWriteDto = { name: '', sortOrder: 0 };

export default function ColorsSizesPage() {
  const toast = useToast();

  const [colors, setColors] = useState<ApiColor[]>([]);
  const [sizes, setSizes] = useState<ApiSize[]>([]);
  const [loading, setLoading] = useState(true);

  // Color modal state
  const [colorOpen, setColorOpen] = useState(false);
  const [colorEditingId, setColorEditingId] = useState<number | null>(null);
  const [colorForm, setColorForm] = useState<ColorWriteDto>(EMPTY_COLOR);
  const [savingColor, setSavingColor] = useState(false);
  const [pendingDeleteColor, setPendingDeleteColor] = useState<ApiColor | null>(null);

  // Size modal state
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeEditingId, setSizeEditingId] = useState<number | null>(null);
  const [sizeForm, setSizeForm] = useState<SizeWriteDto>(EMPTY_SIZE);
  const [savingSize, setSavingSize] = useState(false);
  const [pendingDeleteSize, setPendingDeleteSize] = useState<ApiSize | null>(null);

  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([catalogApi.colors(), catalogApi.sizes()]);
      setColors((c ?? []).slice().sort((a, b) => a.nameAz.localeCompare(b.nameAz)));
      setSizes((s ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Color CRUD ----------------------------------------------------------

  function openCreateColor() {
    setColorEditingId(null);
    setColorForm(EMPTY_COLOR);
    setColorOpen(true);
  }
  function openEditColor(c: ApiColor) {
    setColorEditingId(c.id);
    setColorForm({
      nameAz: c.nameAz,
      nameRu: c.nameRu,
      nameEn: c.nameEn ?? '',
      hexCode: c.hexCode,
    });
    setColorOpen(true);
  }
  async function saveColor() {
    if (!colorForm.nameAz.trim()) {
      toast.error('Ad tələbdir.');
      return;
    }
    setSavingColor(true);
    try {
      const payload: ColorWriteDto = {
        nameAz: colorForm.nameAz.trim(),
        nameRu: (colorForm.nameRu || colorForm.nameAz).trim(),
        nameEn: colorForm.nameEn?.trim() || undefined,
        hexCode: colorForm.hexCode,
      };
      if (colorEditingId) {
        await adminApi.colors.update(colorEditingId, payload);
        toast.success('Rəng yeniləndi.');
      } else {
        await adminApi.colors.create(payload);
        toast.success('Rəng əlavə edildi.');
      }
      setColorOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSavingColor(false);
    }
  }
  async function deleteColor() {
    if (!pendingDeleteColor) return;
    setDeleting(true);
    try {
      await adminApi.colors.remove(pendingDeleteColor.id);
      toast.success(`"${pendingDeleteColor.nameAz}" silindi.`);
      setPendingDeleteColor(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  // ---- Size CRUD -----------------------------------------------------------

  function openCreateSize() {
    setSizeEditingId(null);
    setSizeForm({ ...EMPTY_SIZE, sortOrder: sizes.length });
    setSizeOpen(true);
  }
  function openEditSize(s: ApiSize) {
    setSizeEditingId(s.id);
    setSizeForm({ name: s.name, sortOrder: s.sortOrder });
    setSizeOpen(true);
  }
  async function saveSize() {
    if (!sizeForm.name.trim()) {
      toast.error('Ad tələbdir.');
      return;
    }
    setSavingSize(true);
    try {
      const payload: SizeWriteDto = {
        name: sizeForm.name.trim(),
        sortOrder: Number(sizeForm.sortOrder),
      };
      if (sizeEditingId) {
        await adminApi.sizes.update(sizeEditingId, payload);
        toast.success('Ölçü yeniləndi.');
      } else {
        await adminApi.sizes.create(payload);
        toast.success('Ölçü əlavə edildi.');
      }
      setSizeOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSavingSize(false);
    }
  }
  async function deleteSize() {
    if (!pendingDeleteSize) return;
    setDeleting(true);
    try {
      await adminApi.sizes.remove(pendingDeleteSize.id);
      toast.success(`"${pendingDeleteSize.name}" silindi.`);
      setPendingDeleteSize(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  // ---- Table columns -------------------------------------------------------

  const colorColumns: Column<ApiColor>[] = [
    {
      key: 'swatch',
      header: '',
      width: '50px',
      cell: (c) => (
        <span
          aria-label={c.hexCode}
          className="inline-block h-7 w-7 rounded-full border border-neutral-300"
          style={{ backgroundColor: c.hexCode }}
        />
      ),
    },
    {
      key: 'name',
      header: 'Ad',
      cell: (c) => (
        <div>
          <p className="font-medium">{c.nameAz}</p>
          {c.nameRu && c.nameRu !== c.nameAz && (
            <p className="text-[11px] text-neutral-500">{c.nameRu}</p>
          )}
        </div>
      ),
    },
    {
      key: 'hex',
      header: 'HEX',
      cell: (c) => <span className="font-mono text-xs">{c.hexCode}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '160px',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <AdminButton size="sm" variant="secondary" onClick={() => openEditColor(c)}>
            Redaktə
          </AdminButton>
          <AdminButton
            size="sm"
            variant="danger"
            onClick={() => setPendingDeleteColor(c)}
          >
            Sil
          </AdminButton>
        </div>
      ),
    },
  ];

  const sizeColumns: Column<ApiSize>[] = [
    {
      key: 'name',
      header: 'Ad',
      cell: (s) => <span className="font-mono">{s.name}</span>,
    },
    {
      key: 'sort',
      header: 'Sıralama',
      align: 'right',
      cell: (s) => s.sortOrder,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '160px',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <AdminButton size="sm" variant="secondary" onClick={() => openEditSize(s)}>
            Redaktə
          </AdminButton>
          <AdminButton
            size="sm"
            variant="danger"
            onClick={() => setPendingDeleteSize(s)}
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
        title="Rənglər & Ölçülər"
        subtitle={`${colors.length} rəng · ${sizes.length} ölçü`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Rənglər
            </h2>
            <AdminButton size="sm" onClick={openCreateColor}>
              + Yeni rəng
            </AdminButton>
          </div>
          <AdminTable
            columns={colorColumns}
            rows={colors}
            rowKey={(c) => c.id}
            loading={loading}
            empty="Heç bir rəng yoxdur."
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Ölçülər
            </h2>
            <AdminButton size="sm" onClick={openCreateSize}>
              + Yeni ölçü
            </AdminButton>
          </div>
          <AdminTable
            columns={sizeColumns}
            rows={sizes}
            rowKey={(s) => s.id}
            loading={loading}
            empty="Heç bir ölçü yoxdur."
          />
        </section>
      </div>

      {/* Color modal */}
      <Modal
        open={colorOpen}
        title={colorEditingId ? 'Rəngi redaktə et' : 'Yeni rəng'}
        onClose={() => setColorOpen(false)}
      >
        <div className="space-y-3">
          <BilingualInput
            label="Ad"
            required
            valueAz={colorForm.nameAz}
            valueRu={colorForm.nameRu}
            valueEn={colorForm.nameEn ?? ''}
            onChangeAz={(v) => setColorForm((f) => ({ ...f, nameAz: v }))}
            onChangeRu={(v) => setColorForm((f) => ({ ...f, nameRu: v }))}
            onChangeEn={(v) => setColorForm((f) => ({ ...f, nameEn: v }))}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">
              HEX rəng
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorForm.hexCode}
                onChange={(e) =>
                  setColorForm((f) => ({ ...f, hexCode: e.target.value }))
                }
                className="h-10 w-16 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                value={colorForm.hexCode}
                onChange={(e) =>
                  setColorForm((f) => ({ ...f, hexCode: e.target.value }))
                }
                className="flex-1 rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="secondary" onClick={() => setColorOpen(false)}>
              Ləğv
            </AdminButton>
            <AdminButton onClick={saveColor} loading={savingColor}>
              {colorEditingId ? 'Yadda saxla' : 'Yarat'}
            </AdminButton>
          </div>
        </div>
      </Modal>

      {/* Size modal */}
      <Modal
        open={sizeOpen}
        title={sizeEditingId ? 'Ölçünü redaktə et' : 'Yeni ölçü'}
        onClose={() => setSizeOpen(false)}
      >
        <div className="space-y-3">
          <AdminInput
            label="Ad"
            placeholder="məs. M, L, 42, OS"
            required
            value={sizeForm.name}
            onChange={(e) => setSizeForm((f) => ({ ...f, name: e.target.value }))}
          />
          <AdminInput
            label="Sıralama"
            type="number"
            value={sizeForm.sortOrder}
            onChange={(e) =>
              setSizeForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="secondary" onClick={() => setSizeOpen(false)}>
              Ləğv
            </AdminButton>
            <AdminButton onClick={saveSize} loading={savingSize}>
              {sizeEditingId ? 'Yadda saxla' : 'Yarat'}
            </AdminButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingDeleteColor}
        title="Rəngi sil"
        description={
          pendingDeleteColor
            ? `"${pendingDeleteColor.nameAz}" silinəcək. Bu rəng məhsul variantlarında istifadə olunarsa silmə uğursuz olacaq.`
            : ''
        }
        destructive
        loading={deleting}
        onConfirm={deleteColor}
        onCancel={() => setPendingDeleteColor(null)}
      />

      <ConfirmDialog
        open={!!pendingDeleteSize}
        title="Ölçünü sil"
        description={
          pendingDeleteSize
            ? `"${pendingDeleteSize.name}" silinəcək. Məhsul variantlarında istifadə olunarsa silmə uğursuz olacaq.`
            : ''
        }
        destructive
        loading={deleting}
        onConfirm={deleteSize}
        onCancel={() => setPendingDeleteSize(null)}
      />
    </>
  );
}
