'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  /** Render override for the formatted output (e.g. `$1,234.56`). */
  format?: (n: number) => string;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
  /** When the previous render value changed, smoothly count up/down to the new value. */
  decimals?: number;
}

/**
 * Lightweight animated number counter.
 * - Uses requestAnimationFrame with ease-out cubic for a natural settle.
 * - Pure CSS / no framer overhead — safe to render inside dense tables.
 */
export function NumberTicker({
  value,
  format,
  duration = 900,
  className,
  decimals = 2,
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

  const out = format
    ? format(display)
    : display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return <span className={cn('tabular-nums', className)}>{out}</span>;
}
