'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import { AdminInput } from '@/components/admin/AdminInput';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';
import type { ApiSiteSetting } from '@/lib/api-types';

/**
 * Feature flags admin page.
 *
 * Each feature is backed by a row in the `SiteSettings` table — value
 * "true" / "false" stored in `valueAz` (boolean flags don't need locales).
 * A missing row counts as enabled (back-compat for existing installations).
 *
 * Every toggle pops a confirmation dialog before saving so accidental
 * clicks don't silently break customer-facing functionality.  Some features
 * also expose secondary config (e.g. free-shipping threshold) which renders
 * inline below the card with its own Save button.
 */

interface FeatureDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  previewHref?: string;
  /**
   * What "no value in DB yet" means for this feature.
   *
   * Most features default to ON for back-compat (turning the toggle off
   * is the explicit admin action).  But destructive / festive ones —
   * maintenance mode, seasonal snow — must default to OFF; otherwise
   * the very first deploy would flood the storefront with snowflakes or
   * lock customers out.
   *
   * Omit (or set `true`) for the safe default.
   */
  defaultEnabled?: boolean;
  /**
   * Optional helper note — rendered as a soft blue info card below the
   * description.  Useful for "best time to enable", caveats, etc.
   */
  note?: string;
  /**
   * Optional secondary setting tied to this feature — renders as an inline
   * input below the toggle.  Type is always "text" but we accept a hint
   * (suffix label, placeholder, etc.) for clarity.
   */
  extra?: {
    settingKey: string;
    label: string;
    placeholder: string;
    suffix?: string;
  };
}

const FEATURES: FeatureDef[] = [
  {
    key: 'feature.aiStylist',
    title: 'AI Stilist',
    description:
      'Məhsul səhifəsində "Buna nə uyğun gedər?" bölməsi — Gemini AI 4-cü komplekt qurur (top + alt + ayaqqabı + aksesuar).',
    icon: '🪄',
    previewHref: '/shop',
  },
  {
    key: 'feature.wishlist',
    title: 'İstək siyahısı (Wishlist)',
    description:
      'Məhsul kartlarında ürək ikonu, header-də siyahı sayğacı və /wishlist səhifəsi. Müştərilər bəyəndiklərini saxlaya bilirlər.',
    icon: '💖',
    previewHref: '/wishlist',
  },
  {
    key: 'feature.freeShippingBar',
    title: 'Pulsuz çatdırılma progress bar',
    description:
      'Səbətin yuxarısında "Pulsuz çatdırılma üçün daha X ₼ əlavə et" progress bar — orta sifariş dəyərini 15-20% artırır.',
    icon: '🚚',
    previewHref: '/cart',
    extra: {
      settingKey: 'freeShipping.threshold',
      label: 'Pulsuz çatdırılma həddi',
      placeholder: '100',
      suffix: '₼',
    },
  },
  {
    key: 'feature.stockUrgency',
    title: 'Stok təcili mesajı (FOMO)',
    description:
      'Məhsul detal səhifəsində: "⚠ Stokda: 3 ədəd" amber rəngli xəbərdarlıq (yalnız 5-dən az qalanda göstərilir).',
    icon: '⏳',
  },
  {
    key: 'feature.socialShare',
    title: 'Sosial paylaşım düymələri',
    description:
      'Məhsul səhifəsində WhatsApp, Telegram, Facebook və "Linki kopyala" düymələri — müştərilər məhsulu dostlarına asanca göndərə bilir.',
    icon: '🔗',
  },
  {
    key: 'feature.seasonalTheme',
    title: 'Yeni il / qış teması',
    description:
      'Saytda yağan qar dənələri animasiyası — bayram dövründə festiv görünüş üçün. Tema rənglərinə toxunmur, üst qatda işləyir.',
    icon: '❄️',
    defaultEnabled: false,
    note: 'Bu funksiyanı dekabrın ortalarından yanvarın ortalarına qədər — yeni il dövründə aktiv etmək tövsiyə olunur. Bayram bitəndən sonra bağlamağı unutma 🎄',
  },
  {
    key: 'feature.maintenanceMode',
    title: 'Texniki rejim',
    description:
      'Saytı qonaqlar üçün tamamilə bağlayır — "Texniki işlər aparılır" səhifəsi göstərilir. Admin daxil ola bilir və yuxarıdakı sarı bannerlə xəbərdar edilir.',
    icon: '🔧',
    defaultEnabled: false,
  },
];

function parseBool(value: string | null | undefined, defaultEnabled = true): boolean {
  // No row in the DB yet → use the feature's declared default so the
  // admin UI matches what the storefront actually sees.
  if (value == null || !value.trim()) return defaultEnabled;
  return !value.trim().toLowerCase().startsWith('f');
}

export default function AdminFeaturesPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Record<string, ApiSiteSetting | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ key: string; next: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  /** Local state for inline "extra" inputs — keyed by settingKey. */
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [extraSavingKey, setExtraSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await adminApi.siteSettings.list();
      const map: Record<string, ApiSiteSetting | undefined> = {};
      const initialExtras: Record<string, string> = {};
      for (const s of all ?? []) {
        map[s.key] = s;
        initialExtras[s.key] = s.valueAz ?? '';
      }
      setSettings(map);
      setExtraValues(initialExtras);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function applyChange() {
    if (!pending) return;
    setSaving(true);
    try {
      await adminApi.siteSettings.update(pending.key, {
        valueAz: pending.next ? 'true' : 'false',
      });
      toast.success(
        pending.next ? 'Funksiya aktivləşdirildi.' : 'Funksiya deaktiv edildi.',
      );
      setPending(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveExtra(settingKey: string) {
    setExtraSavingKey(settingKey);
    try {
      await adminApi.siteSettings.update(settingKey, {
        valueAz: extraValues[settingKey]?.trim() || undefined,
      });
      toast.success('Dəyər yadda saxlanıldı.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setExtraSavingKey(null);
    }
  }

  // Tracks which extra fields differ from the saved value — drives the
  // disabled state of each Save button.
  const dirtyExtras = useMemo(() => {
    const dirty: Record<string, boolean> = {};
    for (const k of Object.keys(extraValues)) {
      dirty[k] = (settings[k]?.valueAz ?? '') !== (extraValues[k] ?? '');
    }
    return dirty;
  }, [settings, extraValues]);

  return (
    <>
      <PageHeader
        title="Funksiyalar"
        subtitle="Saytın hansı funksiyalarının açıq olduğunu buradan idarə edin"
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Yüklənir…</p>
      ) : (
        <ul className="space-y-3">
          {FEATURES.map((f) => {
            const setting = settings[f.key];
            const enabled = parseBool(setting?.valueAz ?? null, f.defaultEnabled !== false);
            return (
              <li
                key={f.key}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 via-violet-100 to-indigo-100 text-2xl"
                  >
                    {f.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{f.title}</h3>
                      <StatusBadge enabled={enabled} />
                    </div>
                    <p className="mt-1 text-xs text-neutral-600">{f.description}</p>
                    {f.note && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900">
                        <span aria-hidden className="text-sm leading-none">💡</span>
                        <span>{f.note}</span>
                      </div>
                    )}
                    {f.previewHref && (
                      <a
                        href={f.previewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[11px] text-neutral-500 underline-offset-2 hover:text-black hover:underline"
                      >
                        Saytda bax →
                      </a>
                    )}
                  </div>
                  <ToggleSwitch
                    enabled={enabled}
                    onClick={() => setPending({ key: f.key, next: !enabled })}
                  />
                </div>

                {/* Inline secondary setting (e.g. free-shipping threshold) */}
                {f.extra && enabled && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
                    <div className="min-w-[180px] flex-1">
                      <AdminInput
                        label={f.extra.label}
                        type="text"
                        inputMode="decimal"
                        placeholder={f.extra.placeholder}
                        value={extraValues[f.extra.settingKey] ?? ''}
                        onChange={(e) =>
                          setExtraValues((prev) => ({
                            ...prev,
                            [f.extra!.settingKey]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {f.extra.suffix && (
                      <span className="mb-[10px] text-sm text-neutral-500">
                        {f.extra.suffix}
                      </span>
                    )}
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      disabled={!dirtyExtras[f.extra.settingKey]}
                      loading={extraSavingKey === f.extra.settingKey}
                      onClick={() => saveExtra(f.extra!.settingKey)}
                    >
                      Yadda saxla
                    </AdminButton>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!pending}
        title={pending?.next ? 'Funksiyanı aktiv et' : 'Funksiyanı deaktiv et'}
        description={
          pending
            ? pending.next
              ? `"${labelFor(pending.key)}" yenidən açılacaq və saytda görsənəcək. Davam edirsən?`
              : `"${labelFor(pending.key)}" tamamilə bağlanacaq və saytda görsənməyəcək. Əminsən?`
            : ''
        }
        confirmLabel={pending?.next ? 'Aktivləşdir' : 'Deaktiv et'}
        destructive={pending ? !pending.next : false}
        loading={saving}
        onConfirm={applyChange}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

function labelFor(key: string): string {
  return FEATURES.find((f) => f.key === key)?.title ?? key;
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        enabled
          ? 'bg-green-100 text-green-800'
          : 'bg-neutral-200 text-neutral-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-neutral-400'}`} />
      {enabled ? 'Aktiv' : 'Bağlı'}
    </span>
  );
}

function ToggleSwitch({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
        enabled ? 'bg-black' : 'bg-neutral-300'
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
