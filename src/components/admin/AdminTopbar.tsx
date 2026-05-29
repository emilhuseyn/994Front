'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import LanguageDropdown from '@/components/LanguageDropdown';

interface Props {
  onToggleSidebar: () => void;
}

export default function AdminTopbar({ onToggleSidebar }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 px-4"
      style={{ backgroundColor: 'var(--theme-admin-topbar-bg)' }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Sidebar"
          className="rounded p-1 text-neutral-600 hover:bg-neutral-100 lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
          {t('admin.panel')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <LanguageDropdown />
        <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
            {user?.fullName?.charAt(0).toUpperCase() ?? 'A'}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block leading-tight">{user?.fullName ?? 'Admin'}</span>
            <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
              {user?.email}
            </span>
          </span>
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div className="fade-in absolute right-0 z-40 mt-1 w-56 rounded border border-neutral-200 bg-white py-1 shadow-md">
            <Link
              href="/"
              className="block px-3 py-2 text-sm hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              {t('admin.topbar.viewShop')}
            </Link>
            <Link
              href="/admin"
              className="block px-3 py-2 text-sm hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              {t('admin.nav.dashboard')}
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            <button
              onClick={() => {
                logout();
                setOpen(false);
                router.replace('/admin/login');
              }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              {t('admin.topbar.logout')}
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
