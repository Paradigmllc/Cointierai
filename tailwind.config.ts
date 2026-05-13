import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        // Cointier UI palette — Stripe-inspired clean dashboard tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        subtle: 'hsl(var(--subtle))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Tier coloring (CLAUDE.md 10-4)
        tier: {
          s: '#FFD700',
          a: '#C0C0C0',
          b: '#CD7F32',
          c: '#9CA3AF',
          d: '#FB923C',
          f: '#EF4444',
        },
        // Market direction signals
        gain: '#16C784',
        loss: '#EA3943',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'soft': 'var(--shadow-sm)',
        'card': 'var(--shadow-card)',
        'lifted': 'var(--shadow-lifted)',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'var(--font-sans-jp)',
          'Noto Sans',
          'Noto Sans JP',
          'system-ui',
          'sans-serif',
        ],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Dense numeric tables — small data-* scale
        'data-xs': ['11px', { lineHeight: '14px' }],
        'data-sm': ['12px', { lineHeight: '16px' }],
        'data-md': ['13px', { lineHeight: '18px' }],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'price-flash-up': { '0%': { backgroundColor: 'rgba(22, 199, 132, 0.3)' }, '100%': { backgroundColor: 'transparent' } },
        'price-flash-down': { '0%': { backgroundColor: 'rgba(234, 57, 67, 0.3)' }, '100%': { backgroundColor: 'transparent' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'price-flash-up': 'price-flash-up 1s ease-out',
        'price-flash-down': 'price-flash-down 1s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
