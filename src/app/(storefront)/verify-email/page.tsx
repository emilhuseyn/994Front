'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container-shop py-16" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSearchParams();
  const { verifyEmail, resendCode } = useAuth();

  const email = search.get('email') ?? '';
  const next = search.get('next') || '/account';

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(''), [digits]);

  // No email in the URL → nothing to verify; bounce to register.
  useEffect(() => {
    if (!email) router.replace('/register');
  }, [email, router]);

  // Focus the first box on mount.
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const doVerify = useCallback(
    async (fullCode: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await verifyEmail(email, fullCode);
        if (res.user) {
          router.replace(next);
        } else {
          setError(t('verify.error'));
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : (err as Error).message);
        // Clear the boxes so the user can retype.
        setDigits(Array(CODE_LENGTH).fill(''));
        inputs.current[0]?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [email, next, router, t, verifyEmail],
  );

  function setDigit(i: number, value: string) {
    const v = value.replace(/\D/g, '');
    if (!v) {
      setDigits((d) => {
        const copy = [...d];
        copy[i] = '';
        return copy;
      });
      return;
    }
    setDigits((d) => {
      const copy = [...d];
      // Take the last typed character (handles overwrite).
      copy[i] = v[v.length - 1];
      return copy;
    });
    // Advance focus.
    if (i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setDigits((d) => {
        const copy = [...d];
        copy[i - 1] = '';
        return copy;
      });
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const lastIndex = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputs.current[lastIndex]?.focus();
    if (pasted.length === CODE_LENGTH) doVerify(pasted);
  }

  // Auto-submit once all six boxes are filled.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !submitting) {
      doVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendCode(email);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      /* resend is best-effort */
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="container-shop flex justify-center py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-3xl">
          ✉️
        </div>
        <h1 className="text-2xl font-semibold uppercase tracking-wider">
          {t('verify.title')}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t('verify.subtitle')}
        </p>
        {email && (
          <p className="mt-1 text-sm font-medium text-neutral-800">{email}</p>
        )}

        {/* OTP boxes */}
        <div className="mt-8 flex justify-center gap-2 sm:gap-3" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={d}
              disabled={submitting}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              aria-label={`${t('verify.digitLabel')} ${i + 1}`}
              className={`h-14 w-12 rounded-lg border-2 text-center text-2xl font-bold outline-none transition-colors sm:h-16 sm:w-14 ${
                d
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-200 focus:border-black'
              } disabled:opacity-50`}
            />
          ))}
        </div>

        {error && (
          <p className="mx-auto mt-4 max-w-xs rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {submitting && (
          <p className="mt-4 text-sm text-neutral-500">{t('verify.checking')}</p>
        )}

        {/* Manual verify button (fallback to auto-submit) */}
        <button
          type="button"
          onClick={() => doVerify(code)}
          disabled={submitting || code.length !== CODE_LENGTH}
          className="btn-primary mt-6 w-full max-w-xs"
        >
          {t('verify.submit')}
        </button>

        {/* Resend */}
        <p className="mt-6 text-sm text-neutral-500">
          {t('verify.noCode')}{' '}
          {cooldown > 0 ? (
            <span className="text-neutral-400">
              {t('verify.resendIn', { seconds: cooldown })}
            </span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="font-semibold text-black underline-offset-2 hover:underline disabled:opacity-50"
            >
              {resending ? t('verify.resending') : t('verify.resend')}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
