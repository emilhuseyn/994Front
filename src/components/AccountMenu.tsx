'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Header account control.
 *   • Logged out → a person icon linking to /login.
 *   • Logged in  → person icon that opens a dropdown (profile name, "My
 *     orders", admin panel link for admins, logout).
 *
 * Mirrors the visual weight of CartIcon / WishlistIcon in the header.
 */
export default function AccountMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const icon = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );

  // Guest — straight link to login.
  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        aria-label={t('auth.login.title')}
        className="flex items-center gap-1.5 text-black transition-colors hover:text-neutral-500"
      >
        {icon}
        <span className="hidden text-sm font-medium sm:inline">
          {t('auth.login.title')}
        </span>
      </Link>
    );
  }

  // Logged in — dropdown.
  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 text-black transition-colors hover:text-neutral-500"
      >
        {icon}
        <span className="hidden max-w-[100px] truncate text-sm font-medium sm:inline">
          {firstName}
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-neutral-100 px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-[11px] text-neutral-500">{user.email}</p>
          </div>
          <MenuLink href="/account" onClick={() => setOpen(false)}>
            {t('account.title')}
          </MenuLink>
          <MenuLink href="/account" onClick={() => setOpen(false)}>
            {t('account.myOrders')}
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" onClick={() => setOpen(false)}>
              {t('admin.panel')}
            </MenuLink>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              router.push('/');
            }}
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            {t('account.logout')}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-3 py-2 text-sm hover:bg-neutral-50"
    >
      {children}
    </Link>
  );
}
