'use client';

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import BilingualInput from '@/components/admin/BilingualInput';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';
import type { ApiSiteSetting } from '@/lib/api-types';

export default function AdminSiteSettingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ApiSiteSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<ApiSiteSetting | null>(null);
  const [valueAz, setValueAz] = useState('');
  const [valueRu, setValueRu] = useState('');
  const [valueEn, setValueEn] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.siteSettings.list();
      setItems((list ?? []).slice().sort((a, b) => a.key.localeCompare(b.key)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(s: ApiSiteSetting) {
    setEditing(s);
    setValueAz(s.valueAz ?? '');
    setValueRu(s.valueRu ?? '');
    setValueEn(s.valueEn ?? '');
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.siteSettings.update(editing.key, {
        valueAz: valueAz.trim() || undefined,
        valueRu: valueRu.trim() || undefined,
        valueEn: valueEn.trim() || undefined,
      });
      toast.success(`"${editing.key}" yeniləndi.`);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<ApiSiteSetting>[] = [
    {
      key: 'key',
      header: 'Açar',
      cell: (s) => <span className="font-mono text-xs">{s.key}</span>,
    },
    {
      key: 'az',
      header: 'AZ',
      cell: (s) => (
        <span className="line-clamp-2 text-sm">
          {s.valueAz || <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: 'ru',
      header: 'RU',
      cell: (s) => (
        <span className="line-clamp-2 text-sm">
          {s.valueRu || <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: 'en',
      header: 'EN',
      cell: (s) => (
        <span className="line-clamp-2 text-sm">
          {s.valueEn || <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      cell: (s) => (
        <AdminButton size="sm" variant="secondary" onClick={() => openEdit(s)}>
          Redaktə
        </AdminButton>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sayt tənzimləmələri"
        subtitle="Saytın hər üç dildə göstərilən mətnləri (footer, banner, logo, və s.)"
      />

      {items.length === 0 && !loading && (
        <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Backend seed-də heç bir site-setting yoxdursa, bu cədvəl boş görünəcək. Yeni
          açar əlavə etmək üçün seed faylına və ya birbaşa DB-yə əlavə edin.
        </p>
      )}

      <AdminTable
        columns={columns}
        rows={items}
        rowKey={(s) => s.id}
        loading={loading}
        empty="Heç bir tənzimləmə yoxdur."
      />

      <Modal
        open={!!editing}
        title={editing ? editing.key : ''}
        description="Üç dildəki dəyəri yeniləyə bilərsiniz."
        onClose={() => setEditing(null)}
        size="lg"
      >
        <div className="space-y-4">
          <BilingualInput
            label="Dəyər"
            multiline
            rows={4}
            valueAz={valueAz}
            valueRu={valueRu}
            valueEn={valueEn}
            onChangeAz={setValueAz}
            onChangeRu={setValueRu}
            onChangeEn={setValueEn}
          />
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="secondary" onClick={() => setEditing(null)}>
              Ləğv
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              Yadda saxla
            </AdminButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
