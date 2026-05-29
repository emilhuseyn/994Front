'use client';

import { useState } from 'react';
import { contactApi } from '@/lib/api/contact';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

export default function ContactForm() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const fullName = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const messageText = String(data.get('message') ?? '').trim();

    try {
      await contactApi.submit({
        fullName,
        email,
        phone: phone || undefined,
        message: messageText,
      });
      setMessage({ kind: 'ok', text: t('contact.form.success') });
      form.reset();
    } catch (err) {
      const text = err instanceof ApiError ? err.message : (err as Error).message;
      setMessage({ kind: 'err', text: text || t('contact.form.error') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-600">
          {t('contact.form.name')}
        </label>
        <input required name="name" className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-600">
          {t('contact.form.email')}
        </label>
        <input required type="email" name="email" className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-600">
          {t('contact.form.phone')}
        </label>
        <input name="phone" className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-600">
          {t('contact.form.message')}
        </label>
        <textarea
          required
          name="message"
          rows={5}
          className="input-field resize-none"
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
        {submitting ? t('contact.form.sending') : t('contact.form.send')}
      </button>
      {message && (
        <p className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
