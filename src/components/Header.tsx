'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navigation from './Navigation';
import MobileMenu from './MobileMenu';
import LanguageDropdown from './LanguageDropdown';
import CartIcon from './CartIcon';
import WishlistIcon from './WishlistIcon';
import AccountMenu from './AccountMenu';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b border-neutral-200"
      style={{ backgroundColor: 'var(--theme-header-bg)' }}
    >
      <div className="container-shop flex h-16 items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Menyu aç"
          onClick={() => setMobileOpen(true)}
          className="text-black hover:text-neutral-500"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <Link
          href="/"
          className="select-none text-xl font-black uppercase tracking-[0.2em]"
          aria-label="Ana səhifə"
        >
          CODE<span className="font-light">994</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-5">
          <LanguageDropdown />
          <AccountMenu />
          <WishlistIcon />
          <CartIcon />
        </div>
      </div>

      <Navigation />

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
