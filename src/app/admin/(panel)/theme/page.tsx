'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import { AdminInput, AdminSelect, AdminCheckbox } from '@/components/admin/AdminInput';
import FontPicker from '@/components/admin/FontPicker';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { useTheme } from '@/components/ThemeProvider';
import { themeApi } from '@/lib/api/theme';
import { ApiError } from '@/lib/api';
import { DEFAULT_THEME, type Theme } from '@/lib/theme-types';

// Pre-built presets so the admin can try out looks with one click.
const PRESETS: { name: string; theme: Theme }[] = [
  { name: 'Default (qara + ağ)', theme: DEFAULT_THEME },
  {
    name: 'Mavi vurğu',
    theme: {
      ...DEFAULT_THEME,
      colors: {
        ...DEFAULT_THEME.colors,
        primary: '#1d4ed8',
        primaryHover: '#1e40af',
        accent: '#0ea5e9',
      },
      storefront: {
        ...DEFAULT_THEME.storefront,
        announcementBg: '#1d4ed8',
      },
      admin: {
        ...DEFAULT_THEME.admin,
        sidebarActiveBg: '#1d4ed8',
      },
    },
  },
  {
    name: 'Bordo lüks',
    theme: {
      ...DEFAULT_THEME,
      colors: {
        ...DEFAULT_THEME.colors,
        primary: '#7c1f2f',
        primaryHover: '#5b1623',
        accent: '#c19a6b',
        background: '#fafaf7',
        soft: '#f3eee9',
      },
      typography: { ...DEFAULT_THEME.typography, fontFamily: 'Raleway' },
      storefront: {
        ...DEFAULT_THEME.storefront,
        announcementBg: '#7c1f2f',
        footerBg: '#fafaf7',
      },
      admin: {
        ...DEFAULT_THEME.admin,
        sidebarActiveBg: '#7c1f2f',
      },
    },
  },
  {
    name: 'Yaşıl təbii',
    theme: {
      ...DEFAULT_THEME,
      colors: {
        ...DEFAULT_THEME.colors,
        primary: '#2f6b3a',
        primaryHover: '#244f2b',
        accent: '#a3b18a',
      },
      typography: { ...DEFAULT_THEME.typography, fontFamily: 'Manrope' },
      storefront: {
        ...DEFAULT_THEME.storefront,
        announcementBg: '#2f6b3a',
      },
      admin: { ...DEFAULT_THEME.admin, sidebarActiveBg: '#2f6b3a' },
    },
  },
  {
    name: 'Tünd rejim',
    theme: {
      ...DEFAULT_THEME,
      colors: {
        primary: '#f5f5f5',
        primaryHover: '#e5e5e5',
        accent: '#fde047',
        background: '#0a0a0a',
        foreground: '#f5f5f5',
        muted: '#a3a3a3',
        border: '#262626',
        soft: '#171717',
        success: '#22c55e',
        danger: '#f87171',
        warning: '#facc15',
      },
      storefront: {
        showAnnouncementBar: true,
        announcementBg: '#171717',
        announcementText: '#f5f5f5',
        headerBg: '#0a0a0a',
        footerBg: '#0a0a0a',
      },
      admin: {
        sidebarBg: '#171717',
        sidebarText: '#d4d4d4',
        sidebarActiveBg: '#f5f5f5',
        sidebarActiveText: '#0a0a0a',
        topbarBg: '#171717',
      },
    },
  },
];

export default function AdminThemePage() {
  const toast = useToast();
  const { saved, setPreview, refresh } = useTheme();
  const [draft, setDraft] = useState<Theme>(saved);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Sync the draft whenever the canonical theme changes (e.g. on first load
  // after the API responds, or after a successful save/reset).
  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  // Clear any leftover preview when leaving the editor — otherwise the rest
  // of the admin app would keep showing the unsaved colours.
  useEffect(() => {
    return () => setPreview(null);
  }, [setPreview]);

  // Apply the draft as a live preview whenever it changes
  function updateDraft(next: Theme) {
    setDraft(next);
    setPreview(next);
  }

  function cancelPreview() {
    setPreview(null);
    setDraft(saved);
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await themeApi.update(draft);
      toast.success('Mövzu yadda saxlanıldı.');
      setPreview(null);
      setDraft(saved);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setResetting(true);
    try {
      const def = await themeApi.reset();
      toast.success('Default mövzu bərpa olundu.');
      setPreview(null);
      setDraft(def);
      await refresh();
      setResetOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setResetting(false);
    }
  }

  function patchColors(p: Partial<Theme['colors']>) {
    updateDraft({ ...draft, colors: { ...draft.colors, ...p } });
  }
  function patchTypo(p: Partial<Theme['typography']>) {
    updateDraft({ ...draft, typography: { ...draft.typography, ...p } });
  }
  function patchLayout(p: Partial<Theme['layout']>) {
    updateDraft({ ...draft, layout: { ...draft.layout, ...p } });
  }
  function patchStorefront(p: Partial<Theme['storefront']>) {
    updateDraft({ ...draft, storefront: { ...draft.storefront, ...p } });
  }
  function patchAdmin(p: Partial<Theme['admin']>) {
    updateDraft({ ...draft, admin: { ...draft.admin, ...p } });
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  return (
    <>
      <PageHeader
        title="Sayt dizaynı"
        subtitle="Rəng, font, ölçü və layout — dəyişikliklər canlı önbaxışda, yadda saxla deyənə qədər."
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setResetOpen(true)}>
              Defaulta sıfırla
            </AdminButton>
            {dirty && (
              <AdminButton variant="secondary" onClick={cancelPreview}>
                Ləğv et
              </AdminButton>
            )}
            <AdminButton onClick={save} loading={saving} disabled={!dirty}>
              Yadda saxla
            </AdminButton>
          </div>
        }
      />

      {/* Presets */}
      <section className="mb-6 rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
          Hazır şablonlar
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => updateDraft(p.theme)}
              className="rounded border border-neutral-200 p-3 text-left transition-colors hover:border-black"
            >
              <div className="mb-2 flex gap-1">
                <span
                  className="h-5 w-5 rounded-full border border-neutral-300"
                  style={{ background: p.theme.colors.primary }}
                />
                <span
                  className="h-5 w-5 rounded-full border border-neutral-300"
                  style={{ background: p.theme.colors.accent }}
                />
                <span
                  className="h-5 w-5 rounded-full border border-neutral-300"
                  style={{ background: p.theme.colors.background }}
                />
              </div>
              <p className="text-xs font-medium">{p.name}</p>
              <p className="mt-0.5 text-[10px] text-neutral-500">
                {p.theme.typography.fontFamily}
              </p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ───── Editor ───── */}
        <div className="space-y-6">
          {/* Colors */}
          <section className="rounded border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Rənglər
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ColorField
                label="Əsas (Primary)"
                value={draft.colors.primary}
                onChange={(v) => patchColors({ primary: v })}
              />
              <ColorField
                label="Primary hover"
                value={draft.colors.primaryHover}
                onChange={(v) => patchColors({ primaryHover: v })}
              />
              <ColorField
                label="Vurğu (Accent)"
                value={draft.colors.accent}
                onChange={(v) => patchColors({ accent: v })}
              />
              <ColorField
                label="Fon (Background)"
                value={draft.colors.background}
                onChange={(v) => patchColors({ background: v })}
              />
              <ColorField
                label="Mətn (Foreground)"
                value={draft.colors.foreground}
                onChange={(v) => patchColors({ foreground: v })}
              />
              <ColorField
                label="İkinci mətn (Muted)"
                value={draft.colors.muted}
                onChange={(v) => patchColors({ muted: v })}
              />
              <ColorField
                label="Çərçivə"
                value={draft.colors.border}
                onChange={(v) => patchColors({ border: v })}
              />
              <ColorField
                label="Yumşaq fon"
                value={draft.colors.soft}
                onChange={(v) => patchColors({ soft: v })}
              />
              <ColorField
                label="Müvəffəqiyyət"
                value={draft.colors.success}
                onChange={(v) => patchColors({ success: v })}
              />
              <ColorField
                label="Xəta"
                value={draft.colors.danger}
                onChange={(v) => patchColors({ danger: v })}
              />
              <ColorField
                label="Xəbərdarlıq"
                value={draft.colors.warning}
                onChange={(v) => patchColors({ warning: v })}
              />
            </div>
          </section>

          {/* Typography */}
          <section className="rounded border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Tipoqrafiya
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FontPicker
                label="Font ailəsi"
                value={draft.typography.fontFamily}
                onChange={(v) => patchTypo({ fontFamily: v })}
              />
              <SliderField
                label="Əsas mətn ölçüsü (px)"
                min={12}
                max={20}
                value={draft.typography.fontSizeBase}
                onChange={(v) => patchTypo({ fontSizeBase: v })}
              />
              <SliderField
                label="Başlıq ölçüsü (px)"
                min={20}
                max={56}
                value={draft.typography.fontSizeHeading}
                onChange={(v) => patchTypo({ fontSizeHeading: v })}
              />
              <AdminSelect
                label="Bold çəkisi"
                value={String(draft.typography.fontWeightBold)}
                onChange={(e) =>
                  patchTypo({ fontWeightBold: Number(e.target.value) })
                }
              >
                {[500, 600, 700, 800, 900].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </section>

          {/* Layout */}
          <section className="rounded border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Layout
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <SliderField
                label="Container eni (px)"
                min={960}
                max={1600}
                step={20}
                value={draft.layout.containerWidth}
                onChange={(v) => patchLayout({ containerWidth: v })}
              />
              <SliderField
                label="Border radius (px)"
                min={0}
                max={24}
                value={draft.layout.radius}
                onChange={(v) => patchLayout({ radius: v })}
              />
              <SliderField
                label="Spacing (px)"
                min={8}
                max={32}
                value={draft.layout.spacingBase}
                onChange={(v) => patchLayout({ spacingBase: v })}
              />
            </div>
          </section>

          {/* Storefront */}
          <section className="rounded border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Mağaza (storefront)
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminCheckbox
                label="Yuxarıda elan bandını göstər"
                checked={draft.storefront.showAnnouncementBar}
                onChange={(e) =>
                  patchStorefront({ showAnnouncementBar: e.target.checked })
                }
              />
              <div />
              <ColorField
                label="Elan bandı fon"
                value={draft.storefront.announcementBg}
                onChange={(v) => patchStorefront({ announcementBg: v })}
              />
              <ColorField
                label="Elan bandı mətn"
                value={draft.storefront.announcementText}
                onChange={(v) => patchStorefront({ announcementText: v })}
              />
              <ColorField
                label="Header fon"
                value={draft.storefront.headerBg}
                onChange={(v) => patchStorefront({ headerBg: v })}
              />
              <ColorField
                label="Footer fon"
                value={draft.storefront.footerBg}
                onChange={(v) => patchStorefront({ footerBg: v })}
              />
            </div>
          </section>

          {/* Admin */}
          <section className="rounded border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Admin paneli
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="Sidebar fon"
                value={draft.admin.sidebarBg}
                onChange={(v) => patchAdmin({ sidebarBg: v })}
              />
              <ColorField
                label="Sidebar mətn"
                value={draft.admin.sidebarText}
                onChange={(v) => patchAdmin({ sidebarText: v })}
              />
              <ColorField
                label="Aktiv link fon"
                value={draft.admin.sidebarActiveBg}
                onChange={(v) => patchAdmin({ sidebarActiveBg: v })}
              />
              <ColorField
                label="Aktiv link mətn"
                value={draft.admin.sidebarActiveText}
                onChange={(v) => patchAdmin({ sidebarActiveText: v })}
              />
              <ColorField
                label="Topbar fon"
                value={draft.admin.topbarBg}
                onChange={(v) => patchAdmin({ topbarBg: v })}
              />
            </div>
          </section>
        </div>

        {/* ───── Live preview ───── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Canlı önbaxış
          </h2>
          <div className="rounded border border-neutral-200 bg-white p-5">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">
              Banner
            </p>
            <div
              className="rounded p-3 text-center text-xs font-medium uppercase tracking-wider"
              style={{
                backgroundColor: draft.storefront.announcementBg,
                color: draft.storefront.announcementText,
              }}
            >
              100 ₼-dən yuxarı SİFARİŞLƏR ÜÇÜN
            </div>

            <p className="mb-2 mt-5 text-[11px] uppercase tracking-wider text-neutral-500">
              Tipoqrafiya
            </p>
            <div
              style={{
                fontFamily: `'${draft.typography.fontFamily}', sans-serif`,
                color: draft.colors.foreground,
              }}
            >
              <p
                style={{
                  fontSize: draft.typography.fontSizeHeading,
                  fontWeight: draft.typography.fontWeightBold,
                  lineHeight: 1.1,
                }}
              >
                Yeni kolleksiya
              </p>
              <p
                className="mt-2"
                style={{
                  fontSize: draft.typography.fontSizeBase,
                  color: draft.colors.muted,
                }}
              >
                Pulsuz çatdırılma və mağazadan götürmə.
              </p>
            </div>

            <p className="mb-2 mt-5 text-[11px] uppercase tracking-wider text-neutral-500">
              Düymələr
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider"
                style={{
                  backgroundColor: draft.colors.primary,
                  color: draft.colors.background,
                  borderRadius: draft.layout.radius,
                }}
              >
                Səbətə əlavə et
              </button>
              <button
                type="button"
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider"
                style={{
                  border: `1px solid ${draft.colors.primary}`,
                  color: draft.colors.primary,
                  background: 'transparent',
                  borderRadius: draft.layout.radius,
                }}
              >
                Davam et
              </button>
            </div>

            <p className="mb-2 mt-5 text-[11px] uppercase tracking-wider text-neutral-500">
              Kart
            </p>
            <div
              className="overflow-hidden border"
              style={{
                borderColor: draft.colors.border,
                borderRadius: draft.layout.radius,
                background: draft.colors.background,
              }}
            >
              <div
                style={{
                  height: 80,
                  background: draft.colors.soft,
                  borderBottom: `1px solid ${draft.colors.border}`,
                }}
              />
              <div className="p-3">
                <p
                  className="text-xs"
                  style={{ color: draft.colors.foreground }}
                >
                  Wrangler TEE White
                </p>
                <p
                  className="text-xs font-semibold"
                  style={{ color: draft.colors.primary }}
                >
                  34,95 ₼
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500">
            Dəyişikliklər real vaxtda bütün saytda göstərilir, lakin yalnız
            &laquo;Yadda saxla&raquo; düyməsindən sonra yadda qalır.
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Default mövzuya qayıt"
        description="Bütün dəyişikliklər silinəcək və başlanğıc dizayn bərpa olunacaq."
        destructive
        loading={resetting}
        onConfirm={reset}
        onCancel={() => setResetOpen(false)}
      />
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-neutral-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded border border-neutral-300 px-2 py-1.5 font-mono text-xs"
        />
      </div>
    </label>
  );
}

function SliderField({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-neutral-600">
        <span>{label}</span>
        <span className="font-mono text-neutral-700">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-black"
      />
      <AdminInput
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2"
      />
    </label>
  );
}
