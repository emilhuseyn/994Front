'use client';

import Link from 'next/link';
import { useSiteSettings } from './SiteSettingsProvider';
import { useAuth } from './AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Storefront maintenance gate.
 *
 * When `feature.maintenanceMode` is true in SiteSettings, every storefront
 * page is replaced with a full-screen "site under maintenance" panel.
 * **Admin users get an in-place bypass banner** so they can still preview
 * the site / continue working — the gate trusts the auth context for that.
 *
 * Admin routes (`/admin/*`) live in a separate layout outside this gate, so
 * they're unaffected regardless of this flag — that's by design, otherwise
 * the admin couldn't toggle the flag back off.
 */
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { get, loaded } = useSiteSettings();
  const { isAdmin } = useAuth();

  // While settings load we render the storefront normally — otherwise the
  // very first paint would briefly flash the maintenance screen for every
  // visitor on every page nav.
  if (!loaded) return <>{children}</>;

  const on = get('feature.maintenanceMode')
    .trim()
    .toLowerCase()
    .startsWith('t');
  if (!on) return <>{children}</>;

  // Admin bypass — still render the storefront but with a slim sticky
  // banner so they remember the site is officially "closed" for visitors.
  if (isAdmin) {
    return (
      <>
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-center text-xs font-semibold text-amber-950">
          <span aria-hidden>🔧</span>
          {t('maintenance.adminBanner')}
          <Link
            href="/admin/features"
            className="underline-offset-2 hover:underline"
          >
            {t('maintenance.adminBannerCta')}
          </Link>
        </div>
        {children}
      </>
    );
  }

  // Public visitor — show the parked page.
  return <MaintenanceScreen />;
}

function MaintenanceScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl shadow-sm">
          🔧
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-2xl font-black uppercase tracking-[0.2em]"
        >
          CODE<span className="font-light">994</span>
        </Link>
        <h1 className="mt-4 text-xl font-semibold">
          {t('maintenance.title')}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {t('maintenance.body')}
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-wider text-neutral-400">
          {t('maintenance.eta')}
        </p>
      </div>
    </div>
  );
}
