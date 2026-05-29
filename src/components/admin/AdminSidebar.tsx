'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/dictionaries';

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
}

const NAV: { sectionKey: TranslationKey; items: NavItem[] }[] = [
  {
    sectionKey: 'admin.section.general',
    items: [
      {
        href: '/admin',
        labelKey: 'admin.nav.dashboard',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    sectionKey: 'admin.section.catalog',
    items: [
      {
        href: '/admin/products',
        labelKey: 'admin.nav.products',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M3 12l9 4 9-4M3 17l9 4 9-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: '/admin/categories',
        labelKey: 'admin.nav.categories',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        href: '/admin/brands',
        labelKey: 'admin.nav.brands',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12L12 3l9 9-9 9-9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: '/admin/colors-sizes',
        labelKey: 'admin.nav.colorsSizes',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    sectionKey: 'admin.section.operations',
    items: [
      {
        href: '/admin/orders',
        labelKey: 'admin.nav.orders',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 2l1.5 4M18 2l-1.5 4M3 6h18l-2 14H5L3 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: '/admin/contact-messages',
        labelKey: 'admin.nav.messages',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    sectionKey: 'admin.section.marketing',
    items: [
      {
        href: '/admin/sliders',
        labelKey: 'admin.nav.sliders',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: '/admin/site-settings',
        labelKey: 'admin.nav.siteSettings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    sectionKey: 'admin.section.system',
    items: [
      {
        href: '/admin/users',
        labelKey: 'admin.nav.users',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 20c.6-3.5 3.4-5 6.5-5s5.9 1.5 6.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14.5 13.5c2-.6 4.5.4 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        href: '/admin/theme',
        labelKey: 'admin.nav.theme',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3a9 9 0 100 18 1.5 1.5 0 001.5-1.5c0-.4-.16-.78-.44-1.06A1.5 1.5 0 0114.06 16h.94A4.5 4.5 0 0019.5 11.5C19.5 6.81 16.14 3 12 3z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="7.5" cy="11" r="1" fill="currentColor" />
            <circle cx="9.5" cy="7" r="1" fill="currentColor" />
            <circle cx="14" cy="6.5" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        href: '/admin/features',
        labelKey: 'admin.nav.features',
        icon: (
          // Toggle switch glyph — visually communicates the "on/off" idea.
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="7" width="20" height="10" rx="5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="12" r="3" fill="currentColor" />
          </svg>
        ),
      },
    ],
  },
];

interface Props {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="flex h-full w-60 flex-col border-r border-neutral-200"
      style={{
        backgroundColor: 'var(--theme-admin-sidebar-bg)',
        color: 'var(--theme-admin-sidebar-fg)',
      }}
    >
      <div className="border-b border-neutral-200 px-4 py-4">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="block text-base font-black uppercase tracking-[0.2em]"
        >
          CODE<span className="font-light">994</span>
        </Link>
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">
          {t('admin.panel')}
        </p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-3 scrollbar-thin">
        {NAV.map((group) => (
          <div key={group.sectionKey}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {t(group.sectionKey)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      style={
                        active
                          ? {
                              backgroundColor:
                                'var(--theme-admin-sidebar-active-bg)',
                              color: 'var(--theme-admin-sidebar-active-fg)',
                            }
                          : undefined
                      }
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                        active ? '' : 'hover:bg-neutral-100'
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-200 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-black"
        >
          {t('admin.nav.backToShop')}
        </Link>
      </div>
    </nav>
  );
}
