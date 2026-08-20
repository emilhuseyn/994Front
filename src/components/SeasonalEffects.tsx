'use client';

import { useMemo } from 'react';
import { useSiteSettings } from './SiteSettingsProvider';

/**
 * Site-wide decorative overlay — falling-snowflakes effect for the
 * "Yeni il" (New Year / winter) season.
 *
 * Controlled by `feature.seasonalTheme` in SiteSettings.  Rendered as a
 * fixed-position overlay above the page background but below interactive
 * UI (low z-index + `pointer-events-none`).
 *
 * Visibility note: the storefront sits on a white background, so the
 * snowflakes use a light-blue glyph + cyan glow so they actually show up
 * (pure-white would be invisible).  The keyframe + base styling live in
 * `globals.css` so the rule is parsed at startup — inline `<style>` tags
 * sometimes hydrate too late and the first batch of flakes flashes
 * unstyled in production builds.
 */

const FLAKE_COUNT = 60;
/**
 * Three different snowflake glyphs so the field doesn't look monotonous.
 * The fancier characters render at slightly different baselines, which adds
 * subtle visual variety.
 */
const GLYPHS = ['❄', '❆', '✻'] as const;

interface Flake {
  /** Horizontal position 0-100% */
  x: number;
  /** Animation start delay in seconds (negative = mid-fall on mount) */
  delay: number;
  /** Time to fall the full height in seconds */
  duration: number;
  /** Font-size in pixels */
  size: number;
  /** Slight opacity variance so distant flakes look further away */
  opacity: number;
  /** Which glyph to render */
  glyph: string;
}

function makeFlakes(): Flake[] {
  return Array.from({ length: FLAKE_COUNT }, () => ({
    x: Math.random() * 100,
    delay: Math.random() * -20,
    duration: 8 + Math.random() * 12, // 8-20s
    size: 14 + Math.random() * 22,    // 14-36 px (bigger than before so the flakes read clearly on white)
    opacity: 0.55 + Math.random() * 0.4,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
  }));
}

export default function SeasonalEffects() {
  const { get, loaded } = useSiteSettings();
  // Stable across re-renders so the snowflakes don't reshuffle on every
  // navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const flakes = useMemo(() => makeFlakes(), []);

  if (!loaded) return null;
  const on = get('feature.seasonalTheme')
    .trim()
    .toLowerCase()
    .startsWith('t');
  if (!on) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
    >
      {flakes.map((f, i) => (
        <span
          key={i}
          className="seasonal-snowflake"
          style={{
            left: `${f.x}%`,
            fontSize: `${f.size}px`,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        >
          {f.glyph}
        </span>
      ))}
    </div>
  );
}
