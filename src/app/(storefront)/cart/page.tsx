'use client';

import Breadcrumb from '@/components/Breadcrumb';
import CartView from '@/components/CartView';
import { useTranslation } from '@/i18n/useTranslation';

export default function CartPage() {
  const { t } = useTranslation();
  return (
    <div className="container-shop py-8">
      <Breadcrumb
        items={[
          { href: '/', label: t('shop.breadcrumb.home') },
          { label: t('cart.title') },
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold uppercase tracking-wider">
        {t('cart.title')}
      </h1>
      <CartView />
    </div>
  );
}
