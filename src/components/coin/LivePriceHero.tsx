'use client';

/**
 * LivePriceHero — streaming price for the coin detail hero.
 *
 * Subscribes to Binance miniTicker for {SYMBOL}USDT. Falls back to the SSR
 * initial price if the WS doesn't have the pair (some long-tail coins are
 * DEX-only). Flash up/down animation triggers on any tick that diverges
 * from the prior value by >0.0001%.
 *
 * Why component-level: keeping the hero header SSR-friendly means we can't
 * inline a hook there. This is a tiny client-only island that replaces the
 * static formatLocalPrice() output.
 */
import { useEffect, useRef, useState } from 'react';
import { formatLocalPrice } from '@/lib/i18n/currency';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

interface Props {
  symbol: string;
  initialPriceUsd: number | null;
  locale: Locale;
  rates: Record<string, number>;
}

const QUOTES = ['USDT', 'USDC', 'BUSD'];

export function LivePriceHero({ symbol, initialPriceUsd, locale, rates }: Props) {
  const [price, setPrice] = useState<number | null>(initialPriceUsd);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const lastRef = useRef<number | null>(initialPriceUsd);
  const symbolUp = symbol.toUpperCase();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    function connect() {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
      ws.addEventListener('message', (ev) => {
        try {
          const arr = JSON.parse(ev.data) as Array<{ s: string; c: string }>;
          for (const m of arr) {
            const sym = m.s;
            const base = QUOTES.map((q) => (sym.endsWith(q) ? sym.slice(0, -q.length) : null)).find(Boolean);
            if (base !== symbolUp) continue;
            const p = Number(m.c);
            const prev = lastRef.current ?? p;
            if (Math.abs(p - prev) / Math.max(prev, 1e-9) > 0.0001) {
              setFlash(p > prev ? 'up' : 'down');
              setTimeout(() => setFlash(null), 1100);
            }
            lastRef.current = p;
            setPrice(p);
            break;
          }
        } catch (e) {
          console.warn('[live-hero] parse error', e);
        }
      });
      ws.addEventListener('close', () => {
        if (!closed) setTimeout(connect, 3000);
      });
    }
    connect();
    return () => { closed = true; ws?.close(); };
  }, [symbolUp]);

  return (
    <span className={cn('inline-block tabular-nums px-1 rounded', flash === 'up' && 'flash-up', flash === 'down' && 'flash-down')}>
      {formatLocalPrice(price, locale, rates)}
    </span>
  );
}
