'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { categories, parentCategories } from '@/data/categories';
import { brands } from '@/data/brands';
import { useCart } from './CartProvider';
import { useAuth } from './AuthProvider';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Section = 'menu' | 'sobeler' | 'brendler' | 'cart';

export default function MobileMenu({ open, onClose }: Props) {
  const [section, setSection] = useState<Section>('menu');
  const { items, subtotal } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t, locale } = useTranslation();

  const localizedParentName = (slug: string, defaultName: string) => {
    if (locale === 'AZ') return defaultName;
    if (slug === 'geyimler') return t('nav.clothing');
    if (slug === 'ayaqqabilar') return t('nav.shoes');
    if (slug === 'aksesuarlar') return t('nav.accessories');
    return defaultName;
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setSection('menu'), 200);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
          <span className="text-sm font-semibold uppercase tracking-wider">
            {section === 'menu' && t('nav.menu')}
            {section === 'sobeler' && t('nav.departments')}
            {section === 'brendler' && t('nav.brands')}
            {section === 'cart' && t('nav.cart')}
          </span>
          <div className="flex items-center gap-2">
            {section !== 'menu' && (
              <button
                onClick={() => setSection('menu')}
                aria-label={t('nav.back')}
                className="text-sm text-neutral-500 hover:text-black"
              >
                {t('nav.back')}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label={t('nav.close')}
              className="ml-2 text-2xl leading-none text-neutral-500 hover:text-black"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {section === 'menu' && (
            <ul className="divide-y divide-neutral-100">
              {/* Account row — login link for guests, account link for users */}
              <li>
                <Link
                  href={isAuthenticated ? '/account' : '/login'}
                  onClick={onClose}
                  className="flex items-center gap-2 bg-neutral-50 px-4 py-4 text-sm font-semibold uppercase tracking-wider hover:bg-neutral-100"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
                  </svg>
                  {isAuthenticated && user
                    ? user.fullName.split(' ')[0]
                    : t('auth.login.title')}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setSection('sobeler')}
                  className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium uppercase tracking-wider hover:bg-neutral-50"
                >
                  {t('nav.departments')} <span>›</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSection('brendler')}
                  className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium uppercase tracking-wider hover:bg-neutral-50"
                >
                  {t('nav.brands')} <span>›</span>
                </button>
              </li>
              {[
                { href: '/category/geyimler', label: t('nav.clothing') },
                { href: '/category/ayaqqabilar', label: t('nav.shoes') },
                { href: '/category/aksesuarlar', label: t('nav.accessories') },
                { href: '/about', label: t('nav.about') },
                { href: '/contact', label: t('nav.contact') },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    className="block px-4 py-4 text-sm font-medium uppercase tracking-wider hover:bg-neutral-50"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setSection('cart')}
                  className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium uppercase tracking-wider hover:bg-neutral-50"
                >
                  {t('nav.cart')} <span>›</span>
                </button>
              </li>
            </ul>
          )}

          {section === 'sobeler' && (
            <div className="px-4 py-4">
              {parentCategories.map((parent) => (
                <div key={parent.slug} className="mb-6">
                  <Link
                    href={`/category/${parent.slug}`}
                    onClick={onClose}
                    className="mb-2 block text-sm font-semibold uppercase tracking-wider"
                  >
                    {localizedParentName(parent.slug, parent.name)}
                  </Link>
                  <ul className="space-y-1.5">
                    {categories
                      .filter((c) => c.parent === parent.key)
                      .map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/category/${c.slug}`}
                            onClick={onClose}
                            className="block py-1 text-sm text-neutral-700 hover:text-black"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {section === 'brendler' && (
            <ul className="divide-y divide-neutral-100">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/brand/${b.slug}`}
                    onClick={onClose}
                    className="block px-4 py-3 text-sm hover:bg-neutral-50"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {section === 'cart' && (
            <div className="flex h-full flex-col">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">
                  {t('cart.empty')}
                </p>
              ) : (
                <>
                  <ul className="flex-1 divide-y divide-neutral-100">
                    {items.map((it) => (
                      <li
                        key={`${it.productId}-${it.size}-${it.color}`}
                        className="flex gap-3 px-4 py-3"
                      >
                        <div className="h-16 w-16 flex-shrink-0 bg-neutral-100" />
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="truncate font-medium">{it.title}</p>
                          <p className="text-neutral-500">
                            {it.size} · {it.color} × {it.quantity}
                          </p>
                          <p className="mt-1">{formatPrice(it.price * it.quantity)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-neutral-200 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span>{t('cart.grandTotal')}</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    <Link
                      href="/cart"
                      onClick={onClose}
                      className="btn-primary w-full"
                    >
                      {t('cart.title')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
