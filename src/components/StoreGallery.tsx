'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * "Mağazamız" — a gallery of short (1–2s) store b-roll clips shown as a
 * looping 16:9 grid, like a contact sheet of the shop.
 *
 * Playback strategy — two layers, so it's both smooth AND robust:
 *
 *   1. Each <video> keeps the native `autoplay` attribute. That's the
 *      floor: with zero JavaScript the clips still play, so the section can
 *      never degrade to nine dead posters.
 *
 *   2. On top, an IntersectionObserver plays ONLY the tiles actually on
 *      screen and pauses the rest. Without it, arriving at the section
 *      spun up all nine decoders in one frame — enough to stutter the
 *      scroll. Now at most the visible row or two decode at a time, and
 *      off-screen clips cost nothing. If the observer never fires (some
 *      embedded webviews), layer 1 still carries playback.
 *
 * `muted` + `playsInline` are required for autoplay to be allowed at all
 * (especially on iOS). Clips are static brand assets in /public/videos
 * (store-1..9), ordered as a story: storefront → brand neon → product walls.
 */
const CLIP_COUNT = 9;
const CLIPS = Array.from({ length: CLIP_COUNT }, (_, i) => ({
  src: `/videos/store-${i + 1}.mp4`,
  poster: `/videos/store-${i + 1}.jpg`,
}));

export default function StoreGallery() {
  const { t } = useTranslation();
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return; // autoplay carries it

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.muted = true;
            void v.play().catch(() => {
              /* blocked → poster stays, no crash */
            });
          } else {
            // Only pause a clip that actually started — avoids fighting the
            // browser's own autoplay bring-up on first paint.
            if (!v.paused) v.pause();
          }
        }
      },
      { threshold: 0.25 },
    );

    for (const v of refs.current) if (v) io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-neutral-950 py-14 text-white sm:py-16">
      <div className="container-shop">
        <header className="mb-8 text-center">
          <h2 className="text-xl font-semibold uppercase tracking-[0.18em] sm:text-2xl">
            {t('home.store.title')}
          </h2>
          <p className="mt-2 text-sm text-white/55">{t('home.store.subtitle')}</p>
        </header>

        <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          {CLIPS.map((clip, i) => (
            <li
              key={clip.src}
              className="group relative overflow-hidden rounded-lg bg-neutral-900"
            >
              <video
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                poster={clip.poster}
                preload="none"
                autoPlay
                muted
                loop
                playsInline
                aria-label={t('home.store.title')}
              >
                <source src={clip.src} type="video/mp4" />
              </video>
              {/* faint inner border so light frames don't bleed into the band */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10"
              />
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link
            href="/about"
            className="text-xs uppercase tracking-[0.15em] text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t('home.store.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
