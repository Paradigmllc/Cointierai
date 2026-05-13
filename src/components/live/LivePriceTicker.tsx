'use client';

/**
 * LivePriceTicker — WebSocket-driven streaming price ribbon.
 *
 * Why Binance miniTicker?
 *   - Free, no auth, sub-second push for hundreds of pairs
 *   - !miniTicker@arr stream delivers ALL spot pairs in one feed
 *   - We filter client-side to the symbols we care about (top 30)
 *
 * Flash animation: any price tick that differs from the previous tick by
 * ±0.001% gets flash-up / flash-down for 1s. This is the "the site is alive"
 * cue that's missing from every CoinGecko-clone.
 */
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Marquee } from '@/components/magicui/marquee';
import { formatPrice, formatPercent, changeColor, cn } from '@/lib/utils';

interface Seed {
  /** CoinGecko-style id used in URLs */
  id: string;
  /** Lower-case ticker symbol */
  symbol: string;
  /** Initial price (used until first WS tick arrives) */
  priceUsd: number;
  /** 24h change percentage, kept fresh by miniTicker (P field) */
  change24h: number | null;
  imageUrl: string | null;
}

interface Props {
  seeds: Seed[];
}

interface Tick {
  symbol: string;
  price: number;
  change24h: number;
}

const QUOTES = ['USDT', 'USDC', 'BUSD'];

export function LivePriceTicker({ seeds }: Props) {
  const [ticks, setTicks] = useState<Record<string, Tick>>(() => {
    const init: Record<string, Tick> = {};
    for (const s of seeds) init[s.symbol.toUpperCase()] = { symbol: s.symbol.toUpperCase(), price: s.priceUsd, change24h: s.change24h ?? 0 };
    return init;
  });
  const flashRef = useRef<Record<string, 'up' | 'down' | null>>({});
  const [flashKey, setFlashKey] = useState(0); // triggers re-render when flash classes change

  useEffect(() => {
    const watchSet = new Set(seeds.map((s) => s.symbol.toUpperCase()));
    let ws: WebSocket | null = null;
    let closed = false;
    function connect() {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
      ws.addEventListener('message', (ev) => {
        try {
          const arr = JSON.parse(ev.data) as Array<{ s: string; c: string; P: string }>;
          const next: Record<string, Tick> = {};
          for (const m of arr) {
            const sym = m.s;
            // match BTCUSDT / BTCUSDC / BTCBUSD shapes only
            const base = QUOTES.map((q) => (sym.endsWith(q) ? sym.slice(0, -q.length) : null)).find(Boolean);
            if (!base || !watchSet.has(base)) continue;
            const price = Number(m.c);
            const change = Number(m.P);
            next[base] = { symbol: base, price, change24h: change };
          }
          if (Object.keys(next).length > 0) {
            setTicks((prev) => {
              const merged = { ...prev };
              for (const [k, v] of Object.entries(next)) {
                const old = prev[k];
                if (old && Math.abs(v.price - old.price) / Math.max(old.price, 1e-9) > 0.0001) {
                  flashRef.current[k] = v.price > old.price ? 'up' : 'down';
                }
                merged[k] = v;
              }
              return merged;
            });
            setFlashKey((k) => k + 1);
            // clear flash flags shortly after the animation completes
            setTimeout(() => {
              flashRef.current = {};
              setFlashKey((k) => k + 1);
            }, 1100);
          }
        } catch (e) {
          console.warn('[live-ticker] parse error', e);
        }
      });
      ws.addEventListener('close', () => {
        if (!closed) {
          setTimeout(connect, 3000);
        }
      });
    }
    connect();
    return () => {
      closed = true;
      ws?.close();
    };
  }, [seeds]);

  return (
    <div className="border-b border-border bg-card overflow-hidden">
      <Marquee pauseOnHover className="py-2.5 [--duration:80s] [--gap:1.25rem]" repeat={3}>
        {seeds.map((s) => {
          const t = ticks[s.symbol.toUpperCase()];
          const flash = flashRef.current[s.symbol.toUpperCase()];
          return (
            <Link
              key={s.id}
              href={`/coin/${s.id}`}
              className={cn(
                'inline-flex items-center gap-2 text-[12px] hover:text-primary transition-colors px-1.5 py-0.5 rounded',
                flash === 'up' && 'flash-up',
                flash === 'down' && 'flash-down',
              )}
            >
              {s.imageUrl && (
                <img src={s.imageUrl} alt={s.symbol} width={16} height={16} className="rounded-full" loading="lazy" />
              )}
              <span className="font-medium uppercase">{s.symbol}</span>
              <span className="num tabular-nums">{formatPrice(t?.price ?? s.priceUsd)}</span>
              <span className={cn('num tabular-nums text-[11px]', changeColor(t?.change24h ?? s.change24h))}>
                {(t?.change24h ?? s.change24h ?? 0) >= 0 ? '+' : ''}{formatPercent(t?.change24h ?? s.change24h, 2)}
              </span>
            </Link>
          );
        })}
      </Marquee>
    </div>
  );
}
