'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

interface Props {
  label: string;
  valueAz: string;
  valueRu: string;
  onChangeAz: (v: string) => void;
  onChangeRu: (v: string) => void;
  /** Optional English value. When provided, the component shows 3 columns and
   * auto-translates AZ → both RU and EN. */
  valueEn?: string;
  onChangeEn?: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  /** Disable the automatic AZ→{RU,EN} translation behaviour. */
  disableAutoTranslate?: boolean;
}

const FIELD_CLASS =
  'block w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black';

/**
 * Side-by-side localised inputs (AZ + RU, plus optional EN). After the admin
 * pauses typing in the AZ field, the backend `/api/admin/translate` proxy is
 * called once per target locale that is still empty and untouched.
 */
export default function BilingualInput({
  label,
  valueAz,
  valueRu,
  onChangeAz,
  onChangeRu,
  valueEn,
  onChangeEn,
  multiline = false,
  rows = 3,
  required,
  placeholder,
  disableAutoTranslate,
}: Props) {
  const { t } = useTranslation();
  const hasEn = onChangeEn !== undefined;
  const [statusRu, setStatusRu] = useState<'idle' | 'busy' | 'error'>('idle');
  const [statusEn, setStatusEn] = useState<'idle' | 'busy' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ruTouchedRef = useRef(false);
  const enTouchedRef = useRef(false);

  const translateTo = useCallback(
    async (
      text: string,
      target: 'ru' | 'en',
      setStatus: (s: 'idle' | 'busy' | 'error') => void,
      onChange: ((v: string) => void) | undefined,
      isTouched: () => boolean,
      currentValue: string,
    ) => {
      if (!onChange) return;
      if (!text.trim()) return;
      if (isTouched()) return;
      if (currentValue.trim()) return;
      setStatus('busy');
      setErrorMsg(null);
      try {
        const res = await adminApi.translate(text, 'az', target);
        if (!isTouched() && !currentValue.trim()) onChange(res.translatedText);
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err instanceof ApiError ? err.message : (err as Error).message);
        setTimeout(() => setStatus('idle'), 3000);
      }
    },
    [],
  );

  useEffect(() => {
    if (disableAutoTranslate) return;
    if (!valueAz.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translateTo(valueAz, 'ru', setStatusRu, onChangeRu, () => ruTouchedRef.current, valueRu);
      if (hasEn) {
        translateTo(
          valueAz,
          'en',
          setStatusEn,
          onChangeEn,
          () => enTouchedRef.current,
          valueEn ?? '',
        );
      }
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    valueAz,
    valueRu,
    valueEn,
    hasEn,
    disableAutoTranslate,
    onChangeRu,
    onChangeEn,
    translateTo,
  ]);

  const makeControl = (
    val: string,
    onChange: (v: string) => void,
    onTouch?: () => void,
  ) =>
    multiline ? (
      <textarea
        rows={rows}
        required={required}
        placeholder={placeholder}
        value={val}
        onChange={(e) => {
          onTouch?.();
          onChange(e.target.value);
        }}
        className={`${FIELD_CLASS} resize-y`}
      />
    ) : (
      <input
        required={required}
        placeholder={placeholder}
        value={val}
        onChange={(e) => {
          onTouch?.();
          onChange(e.target.value);
        }}
        className={FIELD_CLASS}
      />
    );

  const statusText = (s: typeof statusRu) =>
    s === 'busy' ? t('i18n.translating')
    : s === 'error' ? t('i18n.translateFailed')
    : '';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </span>
        {!disableAutoTranslate && (
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">
            {t('i18n.autoTranslate')} AZ → RU{hasEn ? ', EN' : ''}
          </span>
        )}
      </div>
      <div className={`grid gap-2 ${hasEn ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div>
          <p className="mb-0.5 text-[10px] uppercase tracking-wider text-neutral-400">AZ</p>
          {makeControl(valueAz, onChangeAz)}
        </div>
        <div>
          <p className="mb-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-neutral-400">
            <span>RU</span>
            {statusText(statusRu) && (
              <span className="normal-case text-neutral-500">· {statusText(statusRu)}</span>
            )}
            {!disableAutoTranslate && valueAz.trim() && (
              <button
                type="button"
                onClick={() => {
                  ruTouchedRef.current = false;
                  translateTo(
                    valueAz,
                    'ru',
                    setStatusRu,
                    onChangeRu,
                    () => ruTouchedRef.current,
                    '',
                  );
                }}
                className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] normal-case text-neutral-600 hover:border-black hover:text-black"
              >
                ↻
              </button>
            )}
          </p>
          {makeControl(valueRu, onChangeRu, () => (ruTouchedRef.current = true))}
        </div>
        {hasEn && (
          <div>
            <p className="mb-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-neutral-400">
              <span>EN</span>
              {statusText(statusEn) && (
                <span className="normal-case text-neutral-500">· {statusText(statusEn)}</span>
              )}
              {!disableAutoTranslate && valueAz.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    enTouchedRef.current = false;
                    translateTo(
                      valueAz,
                      'en',
                      setStatusEn,
                      onChangeEn,
                      () => enTouchedRef.current,
                      '',
                    );
                  }}
                  className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] normal-case text-neutral-600 hover:border-black hover:text-black"
                >
                  ↻
                </button>
              )}
            </p>
            {makeControl(
              valueEn ?? '',
              onChangeEn!,
              () => (enTouchedRef.current = true),
            )}
          </div>
        )}
      </div>
      {errorMsg && (statusRu === 'error' || statusEn === 'error') && (
        <p className="mt-1 text-[11px] text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
