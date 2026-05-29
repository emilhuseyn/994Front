'use client';

import Breadcrumb from '@/components/Breadcrumb';
import { useSiteSettings } from '@/components/SiteSettingsProvider';
import { useTranslation } from '@/i18n/useTranslation';

export default function AboutPage() {
  const { t } = useTranslation();
  const { content, loaded } = useSiteSettings();

  return (
    <div className="container-shop py-8">
      <Breadcrumb
        items={[
          { href: '/', label: t('shop.breadcrumb.home') },
          { label: content('about.title', 'about.title') },
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold uppercase tracking-wider">
        {content('about.title', 'about.title')}
      </h1>

      <div className="prose mt-6 max-w-3xl text-sm leading-relaxed text-neutral-700">
        <p className={!loaded ? 'animate-pulse bg-neutral-100 text-transparent' : ''}>
          {content('about.p1', 'about.p1')}
        </p>
        <p className="mt-4">{content('about.p2', 'about.p2')}</p>
        <p className="mt-4">{content('about.p3', 'about.p3')}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="border border-neutral-200 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
            {content('about.card1.title', 'about.cards.originality.title')}
          </h3>
          <p className="text-sm text-neutral-600">
            {content('about.card1.body', 'about.cards.originality.body')}
          </p>
        </div>
        <div className="border border-neutral-200 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
            {content('about.card2.title', 'about.cards.shipping.title')}
          </h3>
          <p className="text-sm text-neutral-600">
            {content('about.card2.body', 'about.cards.shipping.body')}
          </p>
        </div>
        <div className="border border-neutral-200 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
            {content('about.card3.title', 'about.cards.support.title')}
          </h3>
          <p className="text-sm text-neutral-600">
            {content('about.card3.body', 'about.cards.support.body')}
          </p>
        </div>
      </div>
    </div>
  );
}
