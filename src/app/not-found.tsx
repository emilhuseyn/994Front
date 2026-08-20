'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container-shop py-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold uppercase tracking-wider">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 text-sm text-neutral-600">{t('notFound.body')}</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        {t('notFound.cta')}
      </Link>
    </div>
  );
}
