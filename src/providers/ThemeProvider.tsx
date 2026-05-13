'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * ThemeProvider — next-themes ラッパー
 * - default: light (CryptoRank.io 本家準拠)
 * - storage: localStorage 'theme'
 * - attribute: 'class' (Tailwind dark: prefix 用)
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
