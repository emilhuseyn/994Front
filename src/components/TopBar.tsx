'use client';

import { useTranslation } from '@/i18n/useTranslation';

export default function TopBar() {
  const { t } = useTranslation();
  return (
    <div
      className="border-b border-black/10"
      style={{
        backgroundColor: 'var(--theme-announcement-bg)',
        color: 'var(--theme-announcement-fg)',
      }}
    >
      <div className="container-shop flex flex-col-reverse items-center justify-center gap-1 py-2 text-[11px] tracking-wider sm:flex-row sm:gap-6 sm:text-xs">
        <p className="text-center font-medium uppercase">{t('topbar.banner')}</p>
        <span className="hidden h-3 w-px bg-white/40 sm:block" />
        <p className="text-center text-white/80">{t('topbar.address')}</p>
      </div>
    </div>
  );
}
