'use client';

import Breadcrumb from '@/components/Breadcrumb';
import ContactForm from '@/components/ContactForm';
import { useSiteSettings } from '@/components/SiteSettingsProvider';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Strip everything but `+` and digits so `tel:` links work regardless of how
 * the admin formats the phone number ("+994 10 315 13 54", "+994-10-...", …).
 */
function telHref(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

export default function ContactPage() {
  const { t } = useTranslation();
  const { content } = useSiteSettings();

  const address = content('store.address', 'footer.companyAddress');
  const email = content('store.email', 'contact.email');
  const phone = content('store.phone', 'contact.phone');
  const hours = content('store.hours', 'contact.hoursValue');

  return (
    <div className="container-shop py-8">
      <Breadcrumb
        items={[
          { href: '/', label: t('shop.breadcrumb.home') },
          { label: t('contact.title') },
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold uppercase tracking-wider">
        {t('contact.title')}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
            {t('contact.left.title')}
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700">
            <li>
              <span className="block text-xs uppercase tracking-wider text-neutral-500">
                {t('contact.address')}
              </span>
              {address}
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wider text-neutral-500">
                {t('contact.email')}
              </span>
              <a href={`mailto:${email}`} className="hover:text-black">
                {email}
              </a>
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wider text-neutral-500">
                {t('contact.phone')}
              </span>
              <a href={`tel:${telHref(phone)}`} className="hover:text-black">
                {phone}
              </a>
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wider text-neutral-500">
                {t('contact.hours')}
              </span>
              {hours}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
            {t('contact.right.title')}
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
