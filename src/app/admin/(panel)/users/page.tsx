'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { AdminInput, AdminSelect, AdminCheckbox } from '@/components/admin/AdminInput';
import { useToast } from '@/components/admin/ToastProvider';
import { useAuth, ROLE } from '@/components/AuthProvider';
import {
  adminApi,
  type AdminUserApi,
  type CreateAdminDto,
  type UpdateUserDto,
} from '@/lib/api/admin';
import { ApiError } from '@/lib/api';

const PAGE_SIZE = 20;
const ROLE_LABEL: Record<number, string> = {
  [ROLE.Customer]: 'Müştəri',
  [ROLE.Admin]: 'Admin',
};

const EMPTY_EDIT: UpdateUserDto = {
  fullName: '',
  phoneNumber: '',
  role: ROLE.Customer,
  isActive: true,
};

const EMPTY_NEW: CreateAdminDto = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
};

export default function AdminUsersPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const [items, setItems] = useState<AdminUserApi[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [editing, setEditing] = useState<AdminUserApi | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserDto>(EMPTY_EDIT);
  const [savingEdit, setSavingEdit] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState<CreateAdminDto>(EMPTY_NEW);
  const [savingNew, setSavingNew] = useState(false);

  const [pendingDeactivate, setPendingDeactivate] = useState<AdminUserApi | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users.list({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        role: roleFilter === '' ? undefined : Number(roleFilter),
      });
      setItems(res?.items ?? []);
      setTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(u: AdminUserApi) {
    setEditing(u);
    setEditForm({
      fullName: u.fullName,
      phoneNumber: u.phoneNumber ?? '',
      role: u.role,
      isActive: u.isActive,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await adminApi.users.update(editing.id, {
        ...editForm,
        fullName: editForm.fullName.trim(),
        phoneNumber: editForm.phoneNumber?.trim() || undefined,
      });
      toast.success('İstifadəçi yeniləndi.');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveNew() {
    if (!newForm.fullName.trim() || !newForm.email.trim() || newForm.password.length < 6) {
      toast.error('Ad, e-poçt və ən azı 6 simvolluq parol tələbdir.');
      return;
    }
    setSavingNew(true);
    try {
      await adminApi.users.createAdmin({
        fullName: newForm.fullName.trim(),
        email: newForm.email.trim().toLowerCase(),
        password: newForm.password,
        phoneNumber: newForm.phoneNumber?.trim() || undefined,
      });
      toast.success('Yeni admin yaradıldı.');
      setNewOpen(false);
      setNewForm(EMPTY_NEW);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSavingNew(false);
    }
  }

  async function handleDeactivate() {
    if (!pendingDeactivate) return;
    setDeactivating(true);
    try {
      await adminApi.users.deactivate(pendingDeactivate.id);
      toast.success(`"${pendingDeactivate.fullName}" deaktiv edildi.`);
      setPendingDeactivate(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setDeactivating(false);
    }
  }

  const columns: Column<AdminUserApi>[] = [
    {
      key: 'avatar',
      header: '',
      width: '52px',
      cell: (u) => (
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold uppercase text-white ${
            u.role === ROLE.Admin ? 'bg-black' : 'bg-neutral-500'
          }`}
        >
          {u.fullName.charAt(0)}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Ad',
      cell: (u) => (
        <div>
          <p className="text-sm font-medium">
            {u.fullName}
            {currentUser?.id === u.id && (
              <span className="ml-2 text-[10px] uppercase text-neutral-400">(siz)</span>
            )}
          </p>
          <p className="text-[11px] text-neutral-500">
            {u.email}
            {u.phoneNumber ? ` · ${u.phoneNumber}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (u) => (
        <AdminBadge tone={u.role === ROLE.Admin ? 'info' : 'neutral'}>
          {ROLE_LABEL[u.role] ?? '—'}
        </AdminBadge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <AdminBadge tone={u.isActive ? 'success' : 'neutral'}>
          {u.isActive ? 'Aktiv' : 'Passiv'}
        </AdminBadge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Qoşulub',
      cell: (u) => (
        <span className="text-xs text-neutral-600">
          {new Date(u.createdAt).toLocaleDateString('az-AZ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '160px',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <AdminButton size="sm" variant="secondary" onClick={() => openEdit(u)}>
            Redaktə
          </AdminButton>
          {u.isActive && currentUser?.id !== u.id && (
            <AdminButton
              size="sm"
              variant="danger"
              onClick={() => setPendingDeactivate(u)}
            >
              Deaktiv
            </AdminButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="İstifadəçilər"
        subtitle={`${totalCount} istifadəçi · ${
          items.filter((u) => u.role === ROLE.Admin).length
        } admin cari səhifədə`}
        actions={<AdminButton onClick={() => setNewOpen(true)}>+ Yeni admin</AdminButton>}
      />

      <div className="mb-4 grid gap-3 rounded border border-neutral-200 bg-white p-4 sm:grid-cols-3">
        <AdminInput
          label="Axtarış"
          placeholder="ad, e-poçt, telefon"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <AdminSelect
          label="Rol"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Hamısı</option>
          <option value={String(ROLE.Customer)}>{ROLE_LABEL[ROLE.Customer]}</option>
          <option value={String(ROLE.Admin)}>{ROLE_LABEL[ROLE.Admin]}</option>
        </AdminSelect>
        <div className="flex items-end">
          <AdminButton
            variant="secondary"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setPage(1);
            }}
            className="w-full"
          >
            Sıfırla
          </AdminButton>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={items}
        rowKey={(u) => u.id}
        loading={loading}
        empty="Heç bir istifadəçi tapılmadı."
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

      <Modal
        open={!!editing}
        title={editing ? `${editing.fullName}` : ''}
        description={editing?.email}
        onClose={() => setEditing(null)}
      >
        <div className="space-y-3">
          <AdminInput
            label="Ad Soyad"
            required
            value={editForm.fullName}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, fullName: e.target.value }))
            }
          />
          <AdminInput
            label="Telefon"
            value={editForm.phoneNumber ?? ''}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))
            }
          />
          {/* Rol burada göstərilir, amma dəyişdirilə bilməz — yalnız oxunur.
              editForm.role istifadəçinin cari rolu ilə qalır, yenilənmədə
              dəyişmir. */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">
              Rol
            </label>
            <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              <AdminBadge tone={editForm.role === ROLE.Admin ? 'info' : 'neutral'}>
                {ROLE_LABEL[editForm.role] ?? '—'}
              </AdminBadge>
              <span className="text-[11px] text-neutral-400">
                (rol dəyişdirilə bilməz)
              </span>
            </div>
          </div>
          <AdminCheckbox
            label="Aktiv"
            hint="Deaktiv istifadəçilər daxil ola bilməyəcəklər"
            checked={editForm.isActive}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, isActive: e.target.checked }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="secondary" onClick={() => setEditing(null)}>
              Ləğv
            </AdminButton>
            <AdminButton onClick={saveEdit} loading={savingEdit}>
              Yadda saxla
            </AdminButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={newOpen}
        title="Yeni admin"
        description="Bu istifadəçi adminA panelə tam giriş əldə edəcək."
        onClose={() => setNewOpen(false)}
      >
        <div className="space-y-3">
          <AdminInput
            label="Ad Soyad"
            required
            value={newForm.fullName}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, fullName: e.target.value }))
            }
          />
          <AdminInput
            label="E-poçt"
            type="email"
            required
            value={newForm.email}
            onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
          />
          <AdminInput
            label="Parol"
            type="password"
            required
            hint="Minimum 6 simvol"
            value={newForm.password}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, password: e.target.value }))
            }
          />
          <AdminInput
            label="Telefon (istəyə görə)"
            value={newForm.phoneNumber ?? ''}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, phoneNumber: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="secondary" onClick={() => setNewOpen(false)}>
              Ləğv
            </AdminButton>
            <AdminButton onClick={saveNew} loading={savingNew}>
              Yarat
            </AdminButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="İstifadəçini deaktiv et"
        description={
          pendingDeactivate
            ? `"${pendingDeactivate.fullName}" deaktiv ediləcək və artıq daxil ola bilməyəcək. İstənilən vaxt redaktə menyusundan yenidən aktiv edə bilərsiniz.`
            : ''
        }
        confirmLabel="Deaktiv et"
        destructive
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </>
  );
}
