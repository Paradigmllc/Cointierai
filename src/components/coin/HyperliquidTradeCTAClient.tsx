'use client';

/**
 * Client-only wrapper for HyperliquidTradeCTA — wraps with `dynamic({ ssr: false })`
 * so the wagmi/viem dependency graph never reaches the server bundler.
 *
 * The actual CTA does the real work; this file exists purely to bypass the
 * "ssr:false not allowed in server component" Next 15 constraint when the
 * parent (`/coin/[symbol]/page.tsx`) is a server component.
 */
import dynamic from 'next/dynamic';

export const HyperliquidTradeCTAClient = dynamic(
  () => import('./HyperliquidTradeCTA').then((m) => m.HyperliquidTradeCTA),
  { ssr: false, loading: () => null },
);
