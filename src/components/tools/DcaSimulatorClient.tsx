'use client';

/**
 * DCA backtest simulator.
 *
 * Algorithm:
 *   1. Fetch /api/ohlc/{coinId}?days=max  → array of [ts, o, h, l, c]
 *   2. Bucket each interval (weekly/daily/monthly) → simulate buying `amount`
 *      USD at the open price of the first candle in the bucket.
 *   3. Track running coinsHeld, totalInvested, currentValue.
 *   4. Produce a yearly summary + final ROI + bestWorstInterval.
 *
 * Why this lives client-side: every parameter change re-renders the chart
 * instantly with no network round-trip after the OHLC fetch is cached.
 */
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, useChartTheme, ReferenceLine } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCompact, formatPercent, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CoinOpt { id: string; symbol: string; name: string; image: string }
interface Props { coins: CoinOpt[]; locale: 'ja' | 'en' | string }

type Frequency = 'daily' | 'weekly' | 'monthly';

interface DcaResult {
  totalInvested: number;
  finalValue: number;
  coinsHeld: number;
  roi: number;
  avgCost: number;
  bestBuy: { date: string; price: number };
  worstBuy: { date: string; price: number };
  series: Array<{ date: string; invested: number; value: number }>;
}

export function DcaSimulatorClient({ coins, locale }: Props) {
  const theme = useChartTheme();
  const [coinId, setCoinId] = useState('bitcoin');
  const [amountUsd, setAmountUsd] = useState('100');
  const [freq, setFreq] = useState<Frequency>('weekly');
  const [days, setDays] = useState<'365' | '730' | '1825' | 'max'>('1825');
  const [ohlc, setOhlc] = useState<Array<[number, number, number, number, number]> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ohlc/${coinId}?days=${days}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = (await res.json()) as Array<[number, number, number, number, number]>;
        if (!cancelled) setOhlc(data);
      } catch {
        if (!cancelled) setOhlc([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [coinId, days]);

  const result = useMemo<DcaResult | null>(() => {
    if (!ohlc || ohlc.length === 0) return null;
    const amt = parseFloat(amountUsd);
    if (!Number.isFinite(amt) || amt <= 0) return null;
    return simulate(ohlc, amt, freq);
  }, [ohlc, amountUsd, freq]);

  const downloadCsv = () => {
    if (!result) return;
    const lines = ['date,invested_usd,value_usd', ...result.series.map((r) => `${r.date},${r.invested.toFixed(2)},${r.value.toFixed(2)}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dca-${coinId}-${freq}-${days}d.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section className="surface p-5 space-y-4 lg:col-span-1">
        <h3 className="text-sm font-semibold">{locale === 'ja' ? '設定' : 'Inputs'}</h3>
        <FormField label={locale === 'ja' ? '銘柄' : 'Coin'}>
          <Select value={coinId} onValueChange={setCoinId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{coins.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label={locale === 'ja' ? '1回あたりの USD 額' : 'USD per buy'}>
          <input
            type="number" min={1} step={1} value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-[13px] tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>
        <FormField label={locale === 'ja' ? '頻度' : 'Frequency'}>
          <Select value={freq} onValueChange={(v) => setFreq(v as Frequency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{locale === 'ja' ? '毎日' : 'Daily'}</SelectItem>
              <SelectItem value="weekly">{locale === 'ja' ? '毎週' : 'Weekly'}</SelectItem>
              <SelectItem value="monthly">{locale === 'ja' ? '毎月' : 'Monthly'}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={locale === 'ja' ? '期間' : 'Range'}>
          <Select value={days} onValueChange={(v) => setDays(v as typeof days)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="365">1y</SelectItem>
              <SelectItem value="730">2y</SelectItem>
              <SelectItem value="1825">5y</SelectItem>
              <SelectItem value="max">Max</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <Button size="sm" variant="outline" onClick={downloadCsv} disabled={!result}>
          <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" /> CSV
        </Button>
      </section>

      <section className="surface p-5 space-y-4 lg:col-span-2">
        {loading && <div className="py-12 text-center text-[11px] text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />Computing…</div>}
        {!loading && !result && <div className="py-12 text-center text-[12px] text-muted-foreground">No data for the selected range.</div>}
        {result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Kpi label={locale === 'ja' ? '総投資額' : 'Invested'} value={`$${formatCompact(result.totalInvested)}`} />
              <Kpi label={locale === 'ja' ? '現在価値' : 'Value'} value={`$${formatCompact(result.finalValue)}`} accent={result.finalValue >= result.totalInvested ? 'gain' : 'loss'} />
              <Kpi label="ROI" value={`${result.roi >= 0 ? '+' : ''}${formatPercent(result.roi, 1)}`} accent={result.roi >= 0 ? 'gain' : 'loss'} />
              <Kpi label={locale === 'ja' ? '平均コスト' : 'Avg cost'} value={`$${result.avgCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.series}>
                  <defs>
                    <linearGradient id="dca-inv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={theme.axis} stopOpacity={0.3} /><stop offset="100%" stopColor={theme.axis} stopOpacity={0} /></linearGradient>
                    <linearGradient id="dca-val" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={theme.palette[1]} stopOpacity={0.4} /><stop offset="100%" stopColor={theme.palette[1]} stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke={theme.axis} fontSize={9} tickLine={false} axisLine={false} hide />
                  <YAxis stroke={theme.axis} fontSize={9} tickFormatter={(v) => `$${formatCompact(v)}`} width={48} />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number, name: string) => [`$${formatCompact(v)}`, name === 'invested' ? 'Invested' : 'Value']}
                  />
                  <ReferenceLine y={0} stroke={theme.axis} />
                  <Area type="monotone" dataKey="invested" stroke={theme.axis} strokeWidth={1.5} fill="url(#dca-inv)" />
                  <Area type="monotone" dataKey="value" stroke={theme.palette[1]} strokeWidth={2} fill="url(#dca-val)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
              <div>
                <span className="text-muted-foreground">{locale === 'ja' ? '最安値で買えた日' : 'Best buy day'}: </span>
                <span className="tabular-nums">{result.bestBuy.date} · ${result.bestBuy.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{locale === 'ja' ? '最高値で買えた日' : 'Worst buy day'}: </span>
                <span className="tabular-nums">{result.worstBuy.date} · ${result.worstBuy.price.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: 'gain' | 'loss' }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-[14px] font-semibold tabular-nums', accent === 'gain' && 'text-gain', accent === 'loss' && 'text-loss')}>{value}</div>
    </div>
  );
}

function simulate(
  ohlc: Array<[number, number, number, number, number]>,
  amountUsd: number,
  freq: Frequency,
): DcaResult {
  const periodMs = freq === 'daily' ? 86_400_000 : freq === 'weekly' ? 7 * 86_400_000 : 30 * 86_400_000;
  let totalInvested = 0;
  let coinsHeld = 0;
  let bestPrice = Infinity;
  let bestDate = '';
  let worstPrice = -Infinity;
  let worstDate = '';
  const series: DcaResult['series'] = [];
  let nextBuyAt = ohlc[0][0];

  for (const [ts, open, _h, _l, close] of ohlc) {
    if (ts >= nextBuyAt) {
      const buyPrice = open;
      const bought = amountUsd / buyPrice;
      totalInvested += amountUsd;
      coinsHeld += bought;
      if (buyPrice < bestPrice) { bestPrice = buyPrice; bestDate = new Date(ts).toISOString().slice(0, 10); }
      if (buyPrice > worstPrice) { worstPrice = buyPrice; worstDate = new Date(ts).toISOString().slice(0, 10); }
      nextBuyAt = ts + periodMs;
    }
    const value = coinsHeld * close;
    series.push({ date: new Date(ts).toISOString().slice(0, 10), invested: totalInvested, value });
  }

  const finalClose = ohlc[ohlc.length - 1][4];
  const finalValue = coinsHeld * finalClose;
  return {
    totalInvested,
    finalValue,
    coinsHeld,
    roi: totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0,
    avgCost: coinsHeld > 0 ? totalInvested / coinsHeld : 0,
    bestBuy: { date: bestDate, price: bestPrice },
    worstBuy: { date: worstDate, price: worstPrice },
    series,
  };
}
