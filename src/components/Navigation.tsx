'use client';

import Link from 'next/link';
import { useState } from 'react';
import { categories, parentCategories } from '@/data/categories';
import { brands } from '@/data/brands';
import { useTranslation } from '@/i18n/useTranslation';

export default function Navigation() {
  const { t, locale } = useTranslation();
  const [openKey, setOpenKey] = useState<null | 'sobeler' | 'brendler'>(null);

  const TOP_LINKS = [
    { href: '/category/geyimler', label: t('nav.clothing') },
    { href: '/category/ayaqqabilar', label: t('nav.shoes') },
    { href: '/category/aksesuarlar', label: t('nav.accessories') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const localizedParentName = (slug: string, defaultName: string) => {
    if (locale === 'AZ') return defaultName;
    if (slug === 'geyimler') return t('nav.clothing');
    if (slug === 'ayaqqabilar') return t('nav.shoes');
    if (slug === 'aksesuarlar') return t('nav.accessories');
    return defaultName;
  };

  return (
    <nav className="hidden border-t border-neutral-200 bg-white lg:block">
      <div className="container-shop">
        <ul className="flex items-stretch justify-center gap-8 text-[13px] font-medium uppercase tracking-wider">
          <li
            onMouseEnter={() => setOpenKey('sobeler')}
            onMouseLeave={() => setOpenKey(null)}
            className="relative"
          >
            <button
              type="button"
              className="flex h-12 items-center gap-1 hover:text-neutral-500"
            >
              {t('nav.departments')}
              <Chevron />
            </button>
            {openKey === 'sobeler' && (
              <MegaMenu>
                <div className="grid grid-cols-3 gap-8 p-8">
                  {parentCategories.map((parent) => (
                    <div key={parent.slug}>
                      <Link
                        href={`/category/${parent.slug}`}
                        className="mb-3 block text-sm font-semibold uppercase tracking-wider hover:text-neutral-500"
                      >
                        {localizedParentName(parent.slug, parent.name)}
                      </Link>
                      <ul className="space-y-1.5 text-xs normal-case tracking-normal">
                        {categories
                          .filter((c) => c.parent === parent.key)
                          .map((c) => (
                            <li key={c.slug}>
                              <Link
                                href={`/category/${c.slug}`}
                                className="text-neutral-600 hover:text-black"
                              >
                                {c.name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </MegaMenu>
            )}
          </li>

          <li
            onMouseEnter={() => setOpenKey('brendler')}
            onMouseLeave={() => setOpenKey(null)}
            className="relative"
          >
            <button
              type="button"
              className="flex h-12 items-center gap-1 hover:text-neutral-500"
            >
              {t('nav.brands')}
              <Chevron />
            </button>
            {openKey === 'brendler' && (
              <MegaMenu>
                <div className="grid grid-cols-4 gap-x-8 gap-y-2 p-8">
                  {brands.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/brand/${b.slug}`}
                      className="text-xs normal-case tracking-normal text-neutral-700 hover:text-black"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </MegaMenu>
            )}
          </li>

          {TOP_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex h-12 items-center hover:text-neutral-500"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Chevron() {
  return (
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
  );
}

function MegaMenu({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in absolute left-1/2 top-full z-40 w-[680px] -translate-x-1/2 border border-neutral-200 bg-white shadow-lg">
      {children}
    </div>
  );
}
