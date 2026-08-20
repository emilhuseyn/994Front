'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/api';
import { pickByLocale, useTranslation } from '@/i18n/useTranslation';
import type { ApiSlider } from '@/lib/api-types';

interface Props {
  slides: ApiSlider[];
}

const AUTOPLAY_MS = 6000;

/**
 * Auto-rotating hero carousel. With a single slide it behaves like a static
 * hero; with multiple slides it cross-fades every {AUTOPLAY_MS}ms and shows
 * dots + arrows for manual navigation.
 */
export default function HeroCarousel({ slides }: Props) {
  const { t, locale } = useTranslation();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset when the slide list changes
  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      AUTOPLAY_MS,
    );
    return () => clearInterval(id);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  function go(n: number) {
    setActive((slides.length + n) % slides.length);
  }

  return (
    <section
      className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-neutral-900 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const title = pickByLocale(locale, s.titleAz, s.titleRu, s.titleEn);
        const subtitle = pickByLocale(
          locale,
          s.subtitleAz,
          s.subtitleRu,
          s.subtitleEn,
        );
        const buttonText = pickByLocale(
          locale,
          s.buttonTextAz,
          s.buttonTextRu,
          s.buttonTextEn,
        );
        return (
          <div
            key={s.id}
            aria-hidden={i !== active}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <Image
              src={resolveImageUrl(s.imageUrl)}
              alt={title || 'slide'}
              fill
              priority={i === 0}
              className="object-cover opacity-70"
              sizes="100vw"
            />
            <div className="container-shop relative flex h-full flex-col items-start justify-center gap-4">
              <p className="text-sm uppercase tracking-[0.3em]">
                {t('home.heroEyebrow')}
              </p>
              {title && (
                <h1 className="max-w-xl text-5xl font-semibold leading-tight sm:text-6xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="max-w-md text-base text-white/80 sm:text-lg">{subtitle}</p>
              )}
              {(s.buttonUrl || buttonText) && (
                <Link
                  href={s.buttonUrl || '/shop'}
                  className="btn-outline border-white bg-transparent text-white hover:bg-white hover:text-black"
                >
                  {buttonText || t('home.heroCta')}
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          {/* Arrows */}
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="prev"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur hover:bg-black/50 sm:left-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="next"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur hover:bg-black/50 sm:right-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                aria-current={i === active}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
