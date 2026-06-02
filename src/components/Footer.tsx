'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';
import { useSiteSettings } from './SiteSettingsProvider';

function telHref(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

export default function Footer() {
  const { t } = useTranslation();
  const { content } = useSiteSettings();
  const year = new Date().getFullYear();

  const address = content('store.address', 'footer.companyAddress');
  const email = content('store.email', 'contact.email');
  const phone = content('store.phone', 'contact.phone');

  return (
    <footer
      className="mt-16 border-t border-neutral-200"
      style={{ backgroundColor: 'var(--theme-footer-bg)' }}
    >
      <div className="container-shop grid gap-8 py-12 md:grid-cols-3">
        <div>
          <Link
            href="/"
            className="mb-4 inline-block text-lg font-black uppercase tracking-[0.2em]"
          >
            CODE<span className="font-light">994</span>
          </Link>
          <p className="text-sm leading-relaxed text-neutral-600">OOO D-Trade</p>
          <p className="text-sm leading-relaxed text-neutral-600">{address}</p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider">
            {t('footer.shop')}
          </h4>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link href="/shop" className="text-neutral-600 hover:text-black">
                {t('footer.allProducts')}
              </Link>
            </li>
            <li>
              <Link
                href="/category/geyimler"
                className="text-neutral-600 hover:text-black"
              >
                {t('nav.clothing')}
              </Link>
            </li>
            <li>
              <Link
                href="/category/ayaqqabilar"
                className="text-neutral-600 hover:text-black"
              >
                {t('nav.shoes')}
              </Link>
            </li>
            <li>
              <Link
                href="/category/aksesuarlar"
                className="text-neutral-600 hover:text-black"
              >
                {t('nav.accessories')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider">
            {t('footer.contact')}
          </h4>
          <ul className="space-y-1.5 text-sm">
            <li>
              <a href={`mailto:${email}`} className="text-neutral-600 hover:text-black">
                {email}
              </a>
            </li>
            <li>
              <a href={`tel:${telHref(phone)}`} className="text-neutral-600 hover:text-black">
                {phone}
              </a>
            </li>
            <li>
              <Link href="/about" className="text-neutral-600 hover:text-black">
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-neutral-600 hover:text-black">
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200">
        <div className="container-shop flex flex-col items-center justify-between gap-2 py-4 text-xs text-neutral-500 sm:flex-row">
          <p>{t('footer.rights', { year })}</p>
          <p>
            {email} · {phone}
          </p>
        </div>
      </div>

      {/* Developer credit — small but with character: animated heart,
          gradient name, and an underline that draws itself on hover. */}
      <div className="border-t border-neutral-100 bg-neutral-50/50 py-3 text-center">
        <a
          href="https://emilh.site/"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <span>Crafted with</span>
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="currentColor"
            className="animate-pulse text-rose-500"
            aria-hidden="true"
          >
            <path d="M12 21s-7.5-4.7-9.5-9.4C1 7.6 4 4 7.5 4c1.9 0 3.6 1 4.5 2.5C12.9 5 14.6 4 16.5 4 20 4 23 7.6 21.5 11.6 19.5 16.3 12 21 12 21z" />
          </svg>
          <span>by</span>
          {/* Gradient name with a self-drawing underline on hover */}
          <span className="relative inline-block bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 bg-clip-text font-bold text-transparent">
            emilh
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-fuchsia-600 to-indigo-600 transition-all duration-300 group-hover:w-full" />
          </span>
          {/* External-link arrow appears on hover */}
          <svg
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="-translate-x-1 text-indigo-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
