'use client';

/**
 * Portfolio import — paste an EVM address, see top holdings.
 *
 * MVP scope:
 *   - Validate address shape (0x + 40 hex)
 *   - POST /api/portfolio/scan?address=... → returns
 *     [{ symbol, balance, valueUsd, chain }, …]
 *   - Render top 10 + concentration warning if Top 1 > 50%
 *
 * Full implementation (Pro) wires Etherscan v2 multichain + CoinGecko prices,
 * with optional Solana RPC for sub-chain coverage. Free preview shows up to 10
 * tokens across Ethereum mainnet only.
 */
import { useState } from 'react';
import { Loader2, Wallet, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface Holding {
  symbol: string;
  name: string;
  amount: number;
  priceUsd: number;
  valueUsd: number;
  chain: string;
  logo?: string;
}

export function PortfolioImportClient({ locale }: { locale: string }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [holdings, setHoldings] = useState<Holding[] | null>(null);

  const valid = /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const scan = async () => {
    if (!valid) {
      toast.error(locale === 'ja' ? '不正なアドレス形式' : 'Invalid EVM address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/scan?address=${address.trim()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { holdings: Holding[] };
      setHoldings(data.holdings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'scan failed');
      console.error('[portfolio-scan]', e);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = holdings?.reduce((s, h) => s + h.valueUsd, 0) ?? 0;
  const top1 = holdings?.[0];
  const concentrated = top1 && totalValue > 0 && top1.valueUsd / totalValue > 0.5;

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex-1 min-w-[260px] space-y-1.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{locale === 'ja' ? 'EVM ウォレットアドレス' : 'EVM wallet address'}</span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x…"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <Button size="sm" onClick={scan} disabled={loading || !valid} className="h-9">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Wallet className="h-3.5 w-3.5 mr-1.5" />}
          {locale === 'ja' ? '分析' : 'Analyse'}
        </Button>
      </div>

      {holdings && holdings.length === 0 && (
        <div className="text-center py-8 text-[12px] text-muted-foreground">
          {locale === 'ja' ? '保有資産が見つかりませんでした (空のアドレスか API キー未設定)' : 'No holdings found (empty address or API key not configured).'}
        </div>
      )}

      {holdings && holdings.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Kpi label={locale === 'ja' ? '総資産' : 'Total value'} value={`$${formatCompact(totalValue)}`} />
            <Kpi label={locale === 'ja' ? '銘柄数' : 'Holdings'} value={String(holdings.length)} />
            <Kpi label={locale === 'ja' ? 'Top 1 占有率' : 'Top 1 share'} value={top1 ? formatPercent((top1.valueUsd / totalValue) * 100, 1) : '—'} accent={concentrated ? 'loss' : undefined} />
            <Kpi label={locale === 'ja' ? '分散度' : 'Diversification'} value={concentrated ? (locale === 'ja' ? '低い' : 'Low') : (locale === 'ja' ? '高い' : 'High')} accent={concentrated ? 'loss' : 'gain'} />
          </div>
          {concentrated && (
            <div className="rounded-lg border border-loss/30 bg-loss/5 p-3 text-[11px] inline-flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-loss shrink-0 mt-0.5" />
              <span>
                {locale === 'ja'
                  ? `${top1!.symbol.toUpperCase()} が総資産の ${formatPercent((top1!.valueUsd / totalValue) * 100, 1)} を占めています。分散投資を検討してください。`
                  : `${top1!.symbol.toUpperCase()} is ${formatPercent((top1!.valueUsd / totalValue) * 100, 1)} of your portfolio — consider diversifying.`}
              </span>
            </div>
          )}
          <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
            {holdings.slice(0, 10).map((h, i) => (
              <div key={`${h.chain}-${h.symbol}-${i}`} className="flex items-center gap-3 px-3 py-2 text-[12px]">
                <span className="text-muted-foreground text-[10px] w-5 tabular-nums">#{i + 1}</span>
                <span className="font-medium flex-1 truncate">{h.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{h.symbol}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{h.chain}</span>
                <span className="num tabular-nums w-24 text-right shrink-0">{h.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                <span className="num tabular-nums w-20 text-right shrink-0">${formatCompact(h.valueUsd)}</span>
              </div>
            ))}
          </div>
          <Button size="xs" variant="outline" onClick={() => { navigator.clipboard.writeText(address); toast.success('Copied'); }}>
            <Copy className="h-3 w-3 mr-1" /> {locale === 'ja' ? 'アドレスをコピー' : 'Copy address'}
          </Button>
        </>
      )}
    </section>
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
