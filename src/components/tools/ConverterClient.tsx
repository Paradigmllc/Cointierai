'use client';

/**
 * Crypto / fiat converter — fast client-side computation.
 *
 * Design choice: rates are anchored to USD (CoinGecko /exchange_rates which
 * gives 1 BTC → X for any currency; we pivot to USD once). Each crypto pair
 * is converted via USD as bridge, which keeps the algorithm O(1) regardless
 * of pair count and avoids loading every cross-rate matrix.
 *
 *   amountTarget = amountSource × (priceSourceUsd / priceTargetUsd)
 */
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowDownUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CoinOpt { id: string; symbol: string; name: string; image: string; priceUsd: number | null }
interface Props {
  coins: CoinOpt[];
  rates: Record<string, number>;
  locale: 'ja' | 'en' | string;
}

const FIAT_CODES = ['USD', 'JPY', 'EUR', 'GBP', 'KRW', 'CNY', 'TWD', 'THB', 'VND', 'IDR', 'SGD', 'HKD', 'INR', 'PHP', 'AUD', 'CAD', 'CHF', 'BRL', 'TRY', 'AED', 'SAR', 'MXN', 'ZAR'];

interface Side {
  kind: 'crypto' | 'fiat';
  id: string; // coin.id for crypto, fiat code for fiat
}

export function ConverterClient({ coins, rates, locale }: Props) {
  const [left, setLeft] = useState<Side>({ kind: 'crypto', id: 'bitcoin' });
  const [right, setRight] = useState<Side>({ kind: 'fiat', id: 'JPY' });
  const [amount, setAmount] = useState<string>('1');

  const coinMap = useMemo(() => new Map(coins.map((c) => [c.id, c])), [coins]);

  const priceUsd = (s: Side): number | null => {
    if (s.kind === 'crypto') return coinMap.get(s.id)?.priceUsd ?? null;
    const code = s.id.toUpperCase();
    if (code === 'USD') return 1;
    const r = rates[code];
    if (!r) return null;
    // rates[code] = "code units per 1 USD". So 1 unit of `code` is 1/r USD.
    return 1 / r;
  };

  const left$ = priceUsd(left);
  const right$ = priceUsd(right);
  const out = useMemo(() => {
    const a = parseFloat(amount);
    if (!Number.isFinite(a) || !left$ || !right$ || right$ === 0) return null;
    return (a * left$) / right$;
  }, [amount, left$, right$]);

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  const copyResult = async () => {
    if (out == null) return;
    const label = `${amount} ${labelFor(left)} = ${formatOut(out)} ${labelFor(right)}`;
    await navigator.clipboard.writeText(label);
    toast.success('Copied to clipboard');
  };

  function labelFor(s: Side): string {
    if (s.kind === 'crypto') return (coinMap.get(s.id)?.symbol ?? s.id).toUpperCase();
    return s.id;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section className="surface p-5 space-y-4 lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-end gap-3">
          <SidePicker side={left} onChange={setLeft} coins={coins} amount={amount} onAmountChange={setAmount} />

          <div className="flex md:flex-col items-center justify-center gap-2 pb-3 md:pb-0">
            <button
              type="button"
              onClick={swap}
              className="h-9 w-9 rounded-full border border-border bg-card hover:bg-accent transition-colors flex items-center justify-center"
              aria-label="Swap"
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>

          <SidePicker
            side={right}
            onChange={setRight}
            coins={coins}
            amount={out != null ? formatOut(out) : ''}
            readOnly
          />
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{locale === 'ja' ? '結果' : 'Result'}</div>
            <div className="text-xl md:text-2xl font-semibold tabular-nums truncate">
              {amount} {labelFor(left)} = {out != null ? `${formatOut(out)} ${labelFor(right)}` : '—'}
            </div>
            {left$ && right$ && (
              <div className="text-[10px] text-muted-foreground">
                1 {labelFor(left)} = {((left$ / right$)).toLocaleString(undefined, { maximumFractionDigits: 8 })} {labelFor(right)}
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={copyResult} disabled={out == null}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> {locale === 'ja' ? 'コピー' : 'Copy'}
          </Button>
        </div>
      </section>

      <section className="surface p-5 space-y-2">
        <h3 className="text-sm font-semibold">{locale === 'ja' ? '人気の換算' : 'Popular'}</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['bitcoin', 'JPY'], ['bitcoin', 'USD'],
            ['ethereum', 'JPY'], ['ethereum', 'USD'],
            ['solana', 'JPY'], ['usdt', 'JPY'],
          ].map(([cid, fiat]) => (
            <button
              key={`${cid}-${fiat}`}
              onClick={() => { setLeft({ kind: 'crypto', id: cid }); setRight({ kind: 'fiat', id: fiat }); }}
              className="text-[11px] rounded border border-border bg-subtle px-2 py-1 hover:border-primary hover:text-primary transition-colors text-left"
            >
              {coinMap.get(cid)?.symbol.toUpperCase()} → {fiat}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SidePicker({
  side,
  onChange,
  coins,
  amount,
  onAmountChange,
  readOnly,
}: {
  side: Side;
  onChange: (s: Side) => void;
  coins: CoinOpt[];
  amount: string;
  onAmountChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const allOptions: Array<{ kind: 'crypto' | 'fiat'; id: string; label: string; image?: string }> = [
    ...coins.map((c) => ({ kind: 'crypto' as const, id: c.id, label: c.symbol.toUpperCase(), image: c.image })),
    ...FIAT_CODES.map((f) => ({ kind: 'fiat' as const, id: f, label: f })),
  ];
  const selectedValue = `${side.kind}:${side.id}`;
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        readOnly={readOnly}
        onChange={(e) => onAmountChange?.(e.target.value)}
        className="w-full h-12 rounded-md border border-border bg-background px-3 text-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="0"
      />
      <Select value={selectedValue} onValueChange={(v) => {
        const [kind, id] = v.split(':') as ['crypto' | 'fiat', string];
        onChange({ kind, id });
      }}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allOptions.slice(0, 80).map((o) => (
            <SelectItem key={`${o.kind}:${o.id}`} value={`${o.kind}:${o.id}`}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatOut(n: number): string {
  if (Math.abs(n) >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}
