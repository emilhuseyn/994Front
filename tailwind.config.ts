import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#000000',
          accent: '#111111',
          muted: '#6b7280',
          line: '#e5e7eb',
          bg: '#ffffff',
          soft: '#f7f7f7',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        // Paired with a container holding two identical halves: shifting by
        // exactly -50% lands the second half where the first started, so the
        // loop has no seam.
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        // Duration is tuned against the rendered half-width (~4.8k px at
        // TICKER_REPEAT = 6) to land near 80px/s — readable, not frantic.
        // Changing the repeat count means retuning this.
        marquee: 'marquee 60s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
