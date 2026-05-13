'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Format presets. Strings only — functions cannot cross the server→client
 * boundary in Next.js 15 ('Functions cannot be passed directly to Client
 * Components' build error). Callers pass a string identifier and the client
 * component applies the formatter internally.
 */
export type NumberTickerFormat =
  | 'plain' // 1,234.56
  | 'usd-price' // $1,234.56 (auto sig-fig for sub-1 dollar)
  | 'usd-compact' // $1.23T / $456.7B / $8.9M / $123K
  | 'percent' // 12.34%
  | 'percent-signed' // +12.34% / -12.34%
  | 'usd-trillions'; // 1.23T (already divided by 1e12 by caller)

interface NumberTickerProps {
  value: number;
  format?: NumberTickerFormat;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
  /** Decimals for `plain`. Ignored by other format presets. */
  decimals?: number;
  /** Optional prefix/suffix wrapped around the formatted output. */
  prefix?: string;
  suffix?: string;
}

function formatValue(n: number, format: NumberTickerFormat, decimals: number): string {
  switch (format) {
    case 'usd-price': {
      if (Math.abs(n) >= 1) {
        return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      // For sub-dollar prices, show 4-6 sig figs.
      const sig = Math.abs(n) >= 0.01 ? 4 : 6;
      return '$' + n.toLocaleString(undefined, { minimumFractionDigits: sig, maximumFractionDigits: sig });
    }
    case 'usd-compact': {
      const abs = Math.abs(n);
      if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
      if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
      if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
      if (abs >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
      return '$' + n.toFixed(2);
    }
    case 'usd-trillions':
      return n.toFixed(2) + 'T';
    case 'percent':
      return n.toFixed(2) + '%';
    case 'percent-signed':
      return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    case 'plain':
    default:
      return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
}

export function NumberTicker({
  value,
  format = 'plain',
  duration = 900,
  className,
  decimals = 2,
  prefix,
  suffix,
}: NumberTickerProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    startRef.current = null;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const out = formatValue(display, format, decimals);
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {out}
      {suffix}
    </span>
  );
}
