'use client';

import { useState } from 'react';
import { useSiteSettings } from './SiteSettingsProvider';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Social-share row for the product detail page.
 *
 * Buttons (in order):
 *   • WhatsApp     — wa.me share URL with prefilled text
 *   • Telegram     — t.me share URL
 *   • Facebook     — sharer.php (Instagram has no public share endpoint, so
 *                    we substitute Facebook — both Meta apps anyway)
 *   • Copy link    — uses the Clipboard API, falls back to a hidden input
 *
 * Controlled by `feature.socialShare` in SiteSettings — when disabled the
 * row renders nothing.  Defaults to enabled (back-compat).
 */
interface Props {
  /** Product slug — combined with `window.location.origin` to build the URL. */
  productSlug: string;
  /** Product name — used in the prefilled share text. */
  productName: string;
}

export default function ShareButtons({ productSlug, productName }: Props) {
  const { t } = useTranslation();
  const { get, loaded } = useSiteSettings();
  const [copied, setCopied] = useState(false);

  const enabled =
    !loaded ||
    !get('feature.socialShare').trim().toLowerCase().startsWith('f');
  if (!enabled) return null;

  // We compute the URL lazily on each click — `window.location.origin` is
  // unavailable on the server, and the slug rarely changes.
  function fullUrl(): string {
    if (typeof window === 'undefined') return `/product/${productSlug}`;
    return `${window.location.origin}/product/${productSlug}`;
  }

  function open(href: string) {
    if (typeof window === 'undefined') return;
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  function onWhatsApp() {
    const text = encodeURIComponent(`${productName} — ${fullUrl()}`);
    open(`https://wa.me/?text=${text}`);
  }
  function onTelegram() {
    const url = encodeURIComponent(fullUrl());
    const text = encodeURIComponent(productName);
    open(`https://t.me/share/url?url=${url}&text=${text}`);
  }
  function onFacebook() {
    const url = encodeURIComponent(fullUrl());
    open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  }
  async function onCopy() {
    const url = fullUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that block the modern Clipboard API.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* swallow */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-6 border-t border-neutral-200 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
        {t('product.share.title')}
      </p>
      <div className="flex flex-wrap gap-2">
        <ShareBtn
          label="WhatsApp"
          onClick={onWhatsApp}
          colour="bg-emerald-500 hover:bg-emerald-600"
        >
          <IconWhatsApp />
        </ShareBtn>
        <ShareBtn
          label="Telegram"
          onClick={onTelegram}
          colour="bg-sky-500 hover:bg-sky-600"
        >
          <IconTelegram />
        </ShareBtn>
        <ShareBtn
          label="Facebook"
          onClick={onFacebook}
          colour="bg-blue-600 hover:bg-blue-700"
        >
          <IconFacebook />
        </ShareBtn>
        <ShareBtn
          label={copied ? t('product.share.copied') : t('product.share.copy')}
          onClick={onCopy}
          colour={
            copied
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-neutral-700 hover:bg-black'
          }
        >
          {copied ? <IconCheck /> : <IconLink />}
        </ShareBtn>
      </div>
    </div>
  );
}

// =============================================================================
// Primitives
// =============================================================================

function ShareBtn({
  label,
  onClick,
  colour,
  children,
}: {
  label: string;
  onClick: () => void;
  colour: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white transition-colors ${colour}`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.96.55 3.83 1.6 5.45L2 22l4.78-1.25a9.92 9.92 0 005.26 1.5h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0012.04 2zm5.78 14.05c-.24.68-1.42 1.32-1.97 1.4-.5.07-1.16.1-1.86-.12-.43-.13-.99-.32-1.7-.62-3-1.3-4.95-4.32-5.1-4.52-.15-.2-1.22-1.62-1.22-3.1 0-1.47.77-2.2 1.05-2.5.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.06.9 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.45.54-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.07.13.07.74-.17 1.42z"/>
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
    </svg>
  );
}
function IconLink() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
