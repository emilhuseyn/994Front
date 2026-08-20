'use client';

import Link from 'next/link';
import type { InsightApi } from '@/lib/api/admin';

/**
 * "Smart Insights" — narrated observations the dashboard derives from the raw
 * data.  The backend produces a sorted list of cards; we just style them based
 * on `tone` and render the icon / metric / optional CTA.
 *
 * Layout:
 *   • Section header with shimmering accent
 *   • Responsive grid (1 → 2 → 3 cols)
 *   • Tone-aware gradient background + colored border on the left edge
 *   • Big emoji icon + bold title + small description + optional metric chip
 */
export default function SmartInsights({
  insights,
  loading,
}: {
  insights: InsightApi[] | undefined;
  loading?: boolean;
}) {
  return (
    <section className="mt-8">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
            <SparkleIcon /> Ağıllı Məsləhətlər
          </h2>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Dashboard verilənləri özü təhlil edib məsləhət verir — son 30 günün ümumi mənzərəsi
          </p>
        </div>
        <span className="hidden rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500 sm:inline">
          AI-əsaslı analitika
        </span>
      </header>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      ) : !insights || insights.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Hələ kifayət qədər məlumat yoxdur — bir neçə sifariş gəldikdən sonra məsləhətlər burada görünəcək.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      )}
    </section>
  );
}

// =============================================================================
// Card
// =============================================================================

const TONE_STYLES: Record<
  string,
  {
    /** Left-edge accent bar */
    bar: string;
    /** Background gradient class chain */
    bg: string;
    /** Title text colour */
    title: string;
    /** Metric chip styling */
    chip: string;
  }
> = {
  positive: {
    bar: 'bg-gradient-to-b from-green-400 to-emerald-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100',
    title: 'text-emerald-950',
    chip: 'bg-emerald-100 text-emerald-800',
  },
  warning: {
    bar: 'bg-gradient-to-b from-amber-400 to-orange-500',
    bg: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
    title: 'text-amber-950',
    chip: 'bg-amber-100 text-amber-800',
  },
  critical: {
    bar: 'bg-gradient-to-b from-red-500 to-rose-600',
    bg: 'bg-gradient-to-br from-red-50 to-white border-red-200',
    title: 'text-red-950',
    chip: 'bg-red-100 text-red-800',
  },
  info: {
    bar: 'bg-gradient-to-b from-sky-400 to-indigo-500',
    bg: 'bg-gradient-to-br from-sky-50 to-white border-sky-100',
    title: 'text-slate-900',
    chip: 'bg-sky-100 text-sky-800',
  },
};

function InsightCard({ insight }: { insight: InsightApi }) {
  const tone = TONE_STYLES[insight.tone] ?? TONE_STYLES.info;
  return (
    <article
      className={`group relative overflow-hidden rounded-lg border ${tone.bg} p-4 pl-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      {/* Left-edge accent bar */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-1 ${tone.bar}`}
      />

      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-black/5"
        >
          {insight.icon}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold leading-snug ${tone.title}`}>
            {insight.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">
            {insight.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {insight.metric && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}
              >
                {insight.metric}
              </span>
            )}
            {insight.actionHref && insight.actionLabel && (
              <Link
                href={insight.actionHref}
                className="text-[11px] font-semibold text-neutral-700 underline-offset-2 hover:text-black hover:underline"
              >
                {insight.actionLabel} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function SparkleIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-sm"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 10l.9 2.7L21.6 16l-2.7.9L18 19.6l-.9-2.7L14.4 16l2.7-.9L18 12zM5 14l.7 2.1L7.8 17l-2.1.7L5 19.8l-.7-2.1L2.2 17l2.1-.7L5 14z" />
      </svg>
    </span>
  );
}
