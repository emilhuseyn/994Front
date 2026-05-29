'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminBadge from '@/components/admin/AdminBadge';
import RevenueChart from '@/components/admin/RevenueChart';
import Sparkline from '@/components/admin/Sparkline';
import HeatmapGrid from '@/components/admin/HeatmapGrid';
import DonutChart from '@/components/admin/DonutChart';
import SmartInsights from '@/components/admin/SmartInsights';
import DeadProducts from '@/components/admin/DeadProducts';
import { adminApi, type DashboardStatsApi } from '@/lib/api/admin';
import { ApiError, resolveImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_METHOD_LABELS,
  type OrderStatusValue,
} from '@/lib/orders';

/**
 * Percentage change from `previous` to `current`. Returns null when there's
 * no baseline to compare against (avoids "+∞%" / "+NaN%" on first month).
 */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

const STATUS_ORDER = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'] as const;
const GENDER_LABELS: Record<string, string> = { '0': 'Kişi', '1': 'Qadın', '2': 'Uniseks' };
const GENDER_COLORS: Record<string, string> = { '0': '#1f3a93', '1': '#f1a4b8', '2': '#6b7280' };
const DAY_NAMES = ['B.', 'B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await adminApi.dashboard.stats();
        if (!cancelled) setStats(s);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : (err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Sayt fəaliyyətinin canlı mənzərəsi — son 30 günün məlumatları"
      />

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Primary KPI row ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cəmi gəlir"
          value={stats ? formatPrice(stats.totalRevenue) : '—'}
          hint={stats ? `30 gün: ${formatPrice(stats.revenue30Days)}` : ''}
          href="/admin/orders"
          loading={loading}
          accent
          trend={stats ? pctChange(stats.revenue30Days, stats.previousPeriodRevenue) : null}
          sparkline={stats?.revenue30DaysChart.map((p) => Number(p.revenue))}
        />
        <StatCard
          label="Sifarişlər"
          value={stats?.totalOrders ?? '—'}
          hint={stats ? `30 gün: ${stats.ordersLast30Days}` : ''}
          href="/admin/orders"
          loading={loading}
          trend={stats ? pctChange(stats.ordersLast30Days, stats.previousPeriodOrders) : null}
          sparkline={stats?.revenue30DaysChart.map((p) => p.orderCount)}
        />
        <StatCard
          label="Aktiv məhsullar"
          value={stats ? `${stats.activeProducts} / ${stats.totalProducts}` : '—'}
          hint="Mağazada görünənlər"
          href="/admin/products"
          loading={loading}
        />
        <StatCard
          label="Müştərilər"
          value={stats?.totalCustomers ?? '—'}
          hint={stats ? `30 gündə yeni: +${stats.newCustomers30Days}` : ''}
          href="/admin/users"
          loading={loading}
          trend={
            stats
              ? pctChange(stats.newCustomers30Days, stats.previousPeriodNewCustomers)
              : null
          }
        />
      </div>

      {/* ── Performance KPI row ─────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Orta sifariş dəyəri"
          value={stats ? formatPrice(stats.averageOrderValue) : '—'}
          hint="Bütün ləğv olunmayan sifarişlər üzrə"
          loading={loading}
        />
        <StatCard
          label="İnventar dəyəri"
          value={stats ? formatPrice(stats.inventoryValue) : '—'}
          hint="Stokda olan məhsulların cəmi"
          loading={loading}
        />
        <StatCard
          label="Sifariş başına məhsul"
          value={stats ? stats.averageItemsPerOrder.toFixed(2) : '—'}
          hint="Orta vahid sayı"
          loading={loading}
        />
        <StatCard
          label="Təkrar müştərilər"
          value={stats?.repeatCustomers ?? '—'}
          hint="2+ sifariş verənlər"
          loading={loading}
        />
      </div>

      {/* ── Alert row ────────────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Oxunmamış mesaj"
          value={stats?.unreadMessages ?? '—'}
          href="/admin/contact-messages"
          loading={loading}
          highlight={!!stats?.unreadMessages}
        />
        <StatCard
          label="Az stoklu variantlar"
          value={stats?.lowStockVariants ?? '—'}
          hint="≤ 5 ədəd qalan variantlar"
          href="/admin/products"
          loading={loading}
          highlight={!!stats?.lowStockVariants}
        />
        <StatCard
          label="Gözləyən sifarişlər"
          value={stats?.ordersByStatus?.['Pending'] ?? 0}
          href="/admin/orders"
          loading={loading}
        />
        <StatCard
          label="Aktiv səbətlər"
          value={stats?.activeCarts ?? '—'}
          hint="Hələ sifariş verməyən"
          loading={loading}
        />
      </div>

      {/* ── Smart Insights (AI-narrated observations) ───────────────────── */}
      <SmartInsights insights={stats?.insights} loading={loading} />

      {/* ── Dead products (action-driving alert) ────────────────────────── */}
      <DeadProducts products={stats?.deadProducts} loading={loading} />

      {/* ── Revenue trend + status breakdown ────────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            Gəlir trendi
          </h2>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : stats ? (
            <RevenueChart points={stats.revenue30DaysChart} />
          ) : null}
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            Sifariş statusları
          </h2>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : (
            <StatusBreakdown stats={stats} />
          )}
        </section>
      </div>

      {/* ── Hourly + day-of-week ────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            Saat üzrə paylanma
          </h2>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : stats ? (
            <HourlyChart points={stats.hourlyDistribution} />
          ) : null}
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            Həftə günü
          </h2>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : stats ? (
            <DayOfWeekChart points={stats.dayOfWeekDistribution} />
          ) : null}
        </section>
      </div>

      {/* ── Hour × Day heatmap (full width) ─────────────────────────────── */}
      <section className="mt-6 rounded border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Sifariş aktivliyi: saat × gün
          </h2>
          <span className="text-[11px] text-neutral-500">son 30 gün</span>
        </div>
        {loading ? (
          <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
        ) : stats ? (
          <HeatmapGrid cells={stats.hourDayHeatmap} />
        ) : null}
      </section>


      {/* ── Top colors + Stock health ───────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Ən populyar rənglər
            </h2>
            <span className="text-[11px] text-neutral-500">son 30 gün</span>
          </div>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : (
            <DonutChart
              slices={
                stats?.topColors.map((c) => ({
                  label: c.name,
                  value: c.unitsSold,
                  color: c.hexCode,
                })) ?? []
              }
              centerLabel={String(
                stats?.topColors.reduce((s, c) => s + c.unitsSold, 0) ?? 0,
              )}
              centerSub="vahid"
            />
          )}
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Stok sağlamlığı
            </h2>
            <span className="text-[11px] text-neutral-500">aktiv variantlar</span>
          </div>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : stats ? (
            <DonutChart
              slices={[
                {
                  label: 'Stokda (>5)',
                  value: stats.variantsInStock,
                  color: '#16a34a',
                },
                {
                  label: 'Az qalıb (≤5)',
                  value: stats.variantsLowStock,
                  color: '#f59e0b',
                },
                {
                  label: 'Bitib (0)',
                  value: stats.variantsOutOfStock,
                  color: '#dc2626',
                },
              ]}
              centerLabel={String(
                stats.variantsInStock + stats.variantsLowStock + stats.variantsOutOfStock,
              )}
              centerSub="variant"
            />
          ) : null}
        </section>
      </div>

      {/* ── Top brands + categories ─────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-neutral-200 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Top brendlər
            </h2>
            <span className="text-[11px] text-neutral-500">son 30 gün</span>
          </header>
          <BarList
            loading={loading}
            empty="Hələ satış yoxdur."
            items={
              stats?.topBrands.map((b) => ({
                key: b.brandId,
                label: b.name,
                sub: `${b.unitsSold} ədəd`,
                value: b.revenue,
                valueLabel: formatPrice(b.revenue),
              })) ?? []
            }
          />
        </section>

        <section className="rounded border border-neutral-200 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Top kateqoriyalar
            </h2>
            <span className="text-[11px] text-neutral-500">son 30 gün</span>
          </header>
          <BarList
            loading={loading}
            empty="Hələ satış yoxdur."
            items={
              stats?.topCategories.map((c) => ({
                key: c.categoryId,
                label: c.name,
                sub: `${c.unitsSold} ədəd`,
                value: c.revenue,
                valueLabel: formatPrice(c.revenue),
              })) ?? []
            }
          />
        </section>
      </div>

      {/* ── Gender + payment method ─────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            Cinsə görə satış (məhsul)
          </h2>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : (
            <SegmentedBar
              empty="Hələ satış yoxdur."
              segments={Object.entries(stats?.ordersByGender ?? {}).map(([k, v]) => ({
                label: GENDER_LABELS[k] ?? k,
                value: v,
                color: GENDER_COLORS[k] ?? '#000',
              }))}
            />
          )}
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            Ödəniş üsulu
          </h2>
          {loading ? (
            <p className="py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : (
            <SegmentedBar
              empty="Hələ ödəniş yoxdur."
              segments={Object.entries(stats?.ordersByPaymentMethod ?? {}).map(
                ([k, v], i) => ({
                  label: PAYMENT_METHOD_LABELS[Number(k)] ?? k,
                  value: v,
                  color: ['#0a0a0a', '#2563eb', '#16a34a'][i] ?? '#888',
                }),
              )}
            />
          )}
        </section>
      </div>

      {/* ── Low stock + top customers ───────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-neutral-200 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Stok xəbərdarlığı
            </h2>
            <Link
              href="/admin/products"
              className="text-xs text-neutral-500 hover:text-black"
            >
              Məhsullara bax →
            </Link>
          </header>
          {loading ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : !stats?.lowStockProducts.length ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">
              Yaxşı xəbər: stok xəbərdarlıqları yoxdur 🎉
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.lowStockProducts.map((p) => (
                <li
                  key={p.productId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${p.productId}/variants`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {p.productName}
                    </Link>
                    <p className="text-[11px] text-neutral-500">
                      {p.variantsAtRisk} variant az stoklu
                    </p>
                  </div>
                  <AdminBadge tone={p.stockRemaining === 0 ? 'danger' : 'warning'}>
                    {p.stockRemaining} ədəd
                  </AdminBadge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-neutral-200 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              VIP müştərilər
            </h2>
            <span className="text-[11px] text-neutral-500">cəmi xərcə görə</span>
          </header>
          {loading ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : !stats?.topCustomers.length ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">
              Hələ müştəri yoxdur.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.topCustomers.map((c, i) => (
                <li key={c.customerEmail} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {c.customerFullName}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {c.customerEmail} · {c.orderCount} sifariş
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(c.totalSpent)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Top products + recent orders ────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded border border-neutral-200 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Top məhsullar
            </h2>
            <span className="text-[11px] text-neutral-500">son 30 gün</span>
          </header>
          {loading ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : !stats?.topProducts.length ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">
              Hələ satış yoxdur.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 text-center text-xs font-semibold text-neutral-400">
                    #{i + 1}
                  </span>
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                    {p.imageUrl ? (
                      <Image
                        src={resolveImageUrl(p.imageUrl)}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${p.productSlug}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {p.productName}
                    </Link>
                    <p className="text-[11px] text-neutral-500">
                      {p.unitsSold} ədəd satıldı
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-neutral-200 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Son sifarişlər
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-neutral-500 hover:text-black"
            >
              Hamısına bax →
            </Link>
          </header>
          {loading ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
          ) : !stats?.recentOrders.length ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-500">
              Hələ sifariş yoxdur.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[110px_1fr_120px_140px]"
                >
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <span className="truncate text-sm">{o.customerFullName}</span>
                  <span className="hidden sm:block">
                    <AdminBadge tone={ORDER_STATUS_TONE[o.status as OrderStatusValue]}>
                      {ORDER_STATUS_LABELS[o.status as OrderStatusValue]}
                    </AdminBadge>
                  </span>
                  <span className="text-right text-sm font-semibold">
                    {formatPrice(o.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

// =============================================================================
// Building blocks
// =============================================================================

function StatCard({
  label,
  value,
  hint,
  href,
  loading,
  highlight,
  accent,
  trend,
  sparkline,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  loading?: boolean;
  highlight?: boolean;
  accent?: boolean;
  /** Percentage change vs previous period — +12 means up 12%. null = no badge. */
  trend?: number | null;
  /** Optional sparkline data (last N values). */
  sparkline?: number[];
}) {
  // Build the base class WITHOUT bg-white so the accent variant can fully
  // override it — Tailwind utility precedence is alphabetical and bg-white
  // would otherwise win over bg-black.
  const base =
    'block rounded border p-4 transition-colors ' +
    (href ? 'hover:border-black ' : '') +
    (accent
      ? 'border-black bg-black text-white hover:bg-neutral-800'
      : highlight
      ? 'border-amber-300 bg-white'
      : 'border-neutral-200 bg-white');

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-[11px] uppercase tracking-wider ${
            accent ? 'text-white/70' : 'text-neutral-500'
          }`}
        >
          {label}
        </p>
        {trend !== undefined && trend !== null && !loading && (
          <TrendBadge value={trend} accent={accent} />
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold">
        {loading ? (
          <span
            className={`inline-block h-7 w-16 animate-pulse rounded ${
              accent ? 'bg-white/20' : 'bg-neutral-200'
            }`}
          />
        ) : (
          value
        )}
      </p>
      {hint && (
        <p
          className={`mt-1 text-[11px] ${
            accent ? 'text-white/60' : 'text-neutral-500'
          }`}
        >
          {hint}
        </p>
      )}
      {sparkline && sparkline.length > 1 && !loading && (
        <div className={`mt-2 ${accent ? 'text-white/80' : 'text-neutral-700'}`}>
          <Sparkline
            values={sparkline}
            width={180}
            height={28}
            stroke="currentColor"
            fill={accent ? '#ffffff' : '#000000'}
          />
        </div>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={base}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

function TrendBadge({ value, accent }: { value: number; accent?: boolean }) {
  const isUp = value >= 0;
  const txt = `${isUp ? '+' : ''}${value.toFixed(0)}%`;
  // On the accent (dark) card we use a translucent pill; otherwise solid colour.
  if (accent) {
    return (
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          isUp ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'
        }`}
      >
        {isUp ? '↑' : '↓'} {txt}
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isUp ? '↑' : '↓'} {txt}
    </span>
  );
}

function StatusBreakdown({ stats }: { stats: DashboardStatsApi | null }) {
  if (!stats) return null;
  const entries = Object.entries(stats.ordersByStatus);
  const total = entries.reduce((s, [, c]) => s + c, 0);
  if (total === 0) {
    return (
      <p className="py-8 text-center text-xs text-neutral-500">
        Hələ sifariş yoxdur.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {STATUS_ORDER.map((k, idx) => {
        const count = stats.ordersByStatus[k] ?? 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <li key={k}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>{ORDER_STATUS_LABELS[idx as OrderStatusValue]}</span>
              <span className="font-semibold">
                {count}{' '}
                <span className="text-neutral-500">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                style={{ width: `${pct}%` }}
                className={`h-full ${
                  idx === 4
                    ? 'bg-green-500'
                    : idx === 5
                    ? 'bg-red-500'
                    : idx === 0
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                }`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function HourlyChart({ points }: { points: DashboardStatsApi['hourlyDistribution'] }) {
  const max = Math.max(1, ...points.map((p) => p.orderCount));
  const total = points.reduce((s, p) => s + p.orderCount, 0);
  const peak = points.reduce((best, p) => (p.orderCount > best.orderCount ? p : best), points[0]);
  if (total === 0) {
    return (
      <p className="py-8 text-center text-xs text-neutral-500">
        Hələ kifayət qədər məlumat yoxdur.
      </p>
    );
  }
  return (
    <div>
      <p className="mb-1 text-[11px] text-neutral-500">
        Pik saat:{' '}
        <span className="font-semibold text-neutral-700">
          {String(peak.hour).padStart(2, '0')}:00
        </span>{' '}
        ({peak.orderCount} sifariş)
      </p>
      <div className="flex h-24 items-end gap-[2px]">
        {points.map((p) => {
          const h = (p.orderCount / max) * 100;
          return (
            <div
              key={p.hour}
              title={`${String(p.hour).padStart(2, '0')}:00 — ${p.orderCount} sifariş`}
              className="group flex-1"
            >
              <div
                style={{ height: `${Math.max(h, p.orderCount > 0 ? 4 : 1)}%` }}
                className={`w-full rounded-t ${
                  p.orderCount > 0 ? 'bg-black group-hover:bg-neutral-700' : 'bg-neutral-200'
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

function DayOfWeekChart({ points }: { points: DashboardStatsApi['dayOfWeekDistribution'] }) {
  const max = Math.max(1, ...points.map((p) => p.orderCount));
  const total = points.reduce((s, p) => s + p.orderCount, 0);
  if (total === 0) {
    return (
      <p className="py-8 text-center text-xs text-neutral-500">
        Hələ kifayət qədər məlumat yoxdur.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {points.map((p) => {
        const pct = (p.orderCount / max) * 100;
        return (
          <li key={p.dayOfWeek} className="flex items-center gap-3 text-xs">
            <span className="w-8 font-mono text-neutral-500">
              {DAY_NAMES[p.dayOfWeek]}
            </span>
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div style={{ width: `${pct}%` }} className="h-full bg-black" />
              </div>
            </div>
            <span className="w-10 text-right font-semibold">{p.orderCount}</span>
          </li>
        );
      })}
    </ul>
  );
}

interface BarItem {
  key: string | number;
  label: string;
  sub?: string;
  value: number;
  valueLabel: string;
}

function BarList({
  items,
  empty,
  loading,
}: {
  items: BarItem[];
  empty: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-xs text-neutral-500">Yüklənir…</p>
    );
  }
  if (items.length === 0) {
    return <p className="px-4 py-8 text-center text-xs text-neutral-500">{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <li key={item.key} className="px-4 py-3">
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="whitespace-nowrap font-semibold">{item.valueLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div style={{ width: `${pct}%` }} className="h-1.5 bg-black" />
              </div>
              {item.sub && (
                <span className="whitespace-nowrap text-[11px] text-neutral-500">
                  {item.sub}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SegmentedBar({
  segments,
  empty,
}: {
  segments: { label: string; value: number; color: string }[];
  empty: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <p className="py-8 text-center text-xs text-neutral-500">{empty}</p>;
  }
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-neutral-100">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.label}
              title={`${s.label}: ${s.value} (${pct.toFixed(0)}%)`}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              className="h-full"
            />
          );
        })}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
              <span className="text-neutral-600">
                <span className="font-semibold text-neutral-900">{s.value}</span>{' '}
                ({pct.toFixed(0)}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
