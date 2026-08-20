'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import Modal from '@/components/admin/Modal';
import BilingualInput from '@/components/admin/BilingualInput';
import LocationPicker from '@/components/admin/LocationPicker';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';
import type { ApiSiteSetting } from '@/lib/api-types';

type GroupId = 'store' | 'about' | 'other';

interface KeyMeta {
  label: string;
  group: GroupId;
  map?: boolean;
}

// Human-readable labels so the shop owner isn't staring at raw keys like
// `store.mapQuery`. Unknown keys fall back to the key itself (group "other").
const KEY_META: Record<string, KeyMeta> = {
  'store.name': { label: 'Mağaza adı', group: 'store' },
  'store.address': { label: 'Ünvan (mətn)', group: 'store' },
  'store.phone': { label: 'Telefon', group: 'store' },
  'store.email': { label: 'E-poçt', group: 'store' },
  'store.hours': { label: 'İş saatları', group: 'store' },
  'store.announcement': { label: 'Üst banner elanı', group: 'store' },
  'store.mapQuery': { label: 'Xəritə lokasiyası', group: 'store', map: true },
  'about.title': { label: 'Haqqımızda — başlıq', group: 'about' },
  'about.p1': { label: 'Haqqımızda — 1-ci abzas', group: 'about' },
  'about.p2': { label: 'Haqqımızda — 2-ci abzas', group: 'about' },
  'about.p3': { label: 'Haqqımızda — 3-cü abzas', group: 'about' },
  'about.card1.title': { label: '1-ci kart — başlıq', group: 'about' },
  'about.card1.body': { label: '1-ci kart — mətn', group: 'about' },
  'about.card2.title': { label: '2-ci kart — başlıq', group: 'about' },
  'about.card2.body': { label: '2-ci kart — mətn', group: 'about' },
  'about.card4.title': { label: 'Dünya çatdırılması kartı — başlıq', group: 'about' },
  'about.card4.body': { label: 'Dünya çatdırılması kartı — mətn', group: 'about' },
  'about.card3.title': { label: 'Dəstək kartı — başlıq', group: 'about' },
  'about.card3.body': { label: 'Dəstək kartı — mətn', group: 'about' },
};

const GROUPS: { id: GroupId; title: string; desc: string }[] = [
  { id: 'store', title: 'Mağaza məlumatları', desc: 'Ad, ünvan, əlaqə, banner və xəritə lokasiyası' },
  { id: 'about', title: 'Haqqımızda səhifəsi', desc: 'Mətnlər və kartlar' },
  { id: 'other', title: 'Digər', desc: '' },
];

function metaFor(key: string): KeyMeta {
  return KEY_META[key] ?? { label: key, group: 'other' };
}

export default function AdminSiteSettingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ApiSiteSetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Text-edit modal (all keys except the map location).
  const [editing, setEditing] = useState<ApiSiteSetting | null>(null);
  const [valueAz, setValueAz] = useState('');
  const [valueRu, setValueRu] = useState('');
  const [valueEn, setValueEn] = useState('');
  const [saving, setSaving] = useState(false);

  // Map-location modal.
  const [mapEditing, setMapEditing] = useState<ApiSiteSetting | null>(null);
  const [mapValue, setMapValue] = useState('');
  const [savingMap, setSavingMap] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.siteSettings.list();
      setItems((list ?? []).slice());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Group settings; feature.* flags live on the Features page, so hide them here.
  const grouped = useMemo(() => {
    const g: Record<GroupId, ApiSiteSetting[]> = { store: [], about: [], other: [] };
    for (const s of items) {
      if (s.key.startsWith('feature.')) continue;
      g[metaFor(s.key).group].push(s);
    }
    for (const id of Object.keys(g) as GroupId[]) {
      g[id].sort((a, b) => a.key.localeCompare(b.key));
    }
    return g;
  }, [items]);

  function openEdit(s: ApiSiteSetting) {
    if (metaFor(s.key).map) {
      setMapEditing(s);
      setMapValue(s.valueAz || s.valueRu || s.valueEn || '');
      return;
    }
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
      toast.success('Yadda saxlanıldı.');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveMap() {
    if (!mapEditing) return;
    const v = mapValue.trim();
    if (!v) {
      toast.error('Xəritədə mağazanın yerini seçin.');
      return;
    }
    setSavingMap(true);
    try {
      // Coordinates are language-neutral → store the same value in all locales.
      await adminApi.siteSettings.update(mapEditing.key, {
        valueAz: v,
        valueRu: v,
        valueEn: v,
      });
      toast.success('Lokasiya yadda saxlanıldı.');
      setMapEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSavingMap(false);
    }
  }

  // Clear the custom pin → the About map falls back to the store address.
  async function clearMap() {
    if (!mapEditing) return;
    setSavingMap(true);
    try {
      await adminApi.siteSettings.update(mapEditing.key, {
        valueAz: undefined,
        valueRu: undefined,
        valueEn: undefined,
      });
      toast.success('Lokasiya sıfırlandı — ünvana görə göstəriləcək.');
      setMapEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSavingMap(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Sayt tənzimləmələri"
        subtitle="Mağaza məlumatları və Haqqımızda səhifəsinin mətnləri (hər üç dildə)."
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded border border-neutral-200 bg-neutral-50"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const rows = grouped[group.id];
            if (!rows.length) return null;
            return (
              <section key={group.id}>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-neutral-800">
                  {group.title}
                </h2>
                {group.desc && (
                  <p className="mb-3 text-xs text-neutral-500">{group.desc}</p>
                )}
                <div className="divide-y divide-neutral-200 rounded border border-neutral-200">
                  {rows.map((s) => {
                    const meta = metaFor(s.key);
                    const preview = s.valueAz || s.valueRu || s.valueEn || '';
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{meta.label}</span>
                            {meta.map && <span aria-hidden>🗺️</span>}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                            {preview || <span className="italic text-neutral-400">boş</span>}
                          </p>
                        </div>
                        <AdminButton
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(s)}
                        >
                          {meta.map ? 'Xəritədən seç' : 'Redaktə'}
                        </AdminButton>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Text edit modal */}
      <Modal
        open={!!editing}
        title={editing ? metaFor(editing.key).label : ''}
        description="Hər üç dildəki dəyəri yeniləyin."
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

      {/* Map-location modal */}
      <Modal
        open={!!mapEditing}
        title="Mağazanın xəritə lokasiyası"
        description="Xəritəyə klikləyin, ünvan axtarın və ya Google Maps linkini yapışdırın. Haqqımızda səhifəsində göstəriləcək."
        onClose={() => setMapEditing(null)}
        size="lg"
      >
        <div className="space-y-4">
          {mapEditing && <LocationPicker value={mapValue} onChange={setMapValue} />}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={clearMap}
              disabled={savingMap}
              className="text-xs text-neutral-500 underline-offset-2 hover:text-black hover:underline disabled:opacity-50"
            >
              Ünvana qayıt (pini sil)
            </button>
            <div className="flex gap-2">
              <AdminButton variant="secondary" onClick={() => setMapEditing(null)}>
                Ləğv
              </AdminButton>
              <AdminButton onClick={saveMap} loading={savingMap}>
                Yadda saxla
              </AdminButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
