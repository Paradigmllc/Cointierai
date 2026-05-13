'use client';

/**
 * HyperliquidTradeCTA — 1-click trade entry on the Builder-Fee'd Hyperliquid venue.
 *
 * Flow:
 *   1. Show "Trade {SYMBOL}-PERP" button + funding rate + leverage on the
 *      symbol header. Always visible when `hl_listed=true`.
 *   2. Click → opens Hyperliquid trade page in a new tab with Cointier set
 *      as the Builder (provides 0.05% on-chain fee rebate per trade).
 *   3. After the user trades, the "Import history" pill lets them pull fills
 *      back into Cointier via /api/wallet/import-hl-fills.
 *
 * Builder Fee mechanic (CLAUDE.md §3-5): trader pays Hyperliquid's standard
 * fee → smart contract automatically splits 0.05% to the Builder address
 * (= Cointier) on every trade. No off-chain claim required.
 */
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Zap, ArrowUpRight, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface Props {
  symbol: string;
  hlListed: boolean;
  fundingRate8h?: number | null;
  maxLeverage?: number | null;
  oiUsd?: number | null;
  locale: 'ja' | 'en' | string;
}

const COINTIER_BUILDER = process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS ?? '';

export function HyperliquidTradeCTA(p: Props) {
  const { address } = useAccount();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<{
    imported: number;
    pnl_30d: number;
    fees_paid: number;
    builder_fees_estimated: number;
  } | null>(null);

  if (!p.hlListed) return null;

  const tradeUrl = COINTIER_BUILDER
    ? `https://app.hyperliquid.xyz/trade/${p.symbol.toUpperCase()}?builder=${COINTIER_BUILDER}`
    : `https://app.hyperliquid.xyz/trade/${p.symbol.toUpperCase()}`;

  const handleImport = async () => {
    if (!address) {
      toast.error(p.locale === 'ja' ? 'ウォレットを接続してください' : 'Connect your wallet first');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/wallet/import-hl-fills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as typeof imported;
      setImported(data);
      if (data) {
        const summary = p.locale === 'ja'
          ? `${data.imported} 件取り込み · 30d PnL $${formatCompact(data.pnl_30d)}`
          : `${data.imported} fills · 30d PnL $${formatCompact(data.pnl_30d)}`;
        toast.success(summary, { duration: 6000 });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'import failed';
      toast.error(msg);
      console.error('[hl-import]', e);
    } finally {
      setImporting(false);
    }
  };

  const funding8h = p.fundingRate8h ?? null;
  const fundingPctYr = funding8h != null ? funding8h * (24 / 8) * 365 * 100 : null;

  return (
    <section className="rounded-lg border border-primary/40 bg-primary/[0.05] p-4 space-y-3">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {p.locale === 'ja' ? `${p.symbol.toUpperCase()}-PERP を Hyperliquid で取引` : `Trade ${p.symbol.toUpperCase()}-PERP on Hyperliquid`}
        </h3>
        <Badge className="bg-primary/15 text-primary border-primary/30 text-[9px]">Builder Fee 0.05%</Badge>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={p.locale === 'ja' ? '8h ファンディング' : 'Funding 8h'} value={funding8h != null ? `${(funding8h * 100).toFixed(4)}%` : '—'} accent={funding8h != null ? (funding8h >= 0 ? 'gain' : 'loss') : undefined} />
        <Stat label={p.locale === 'ja' ? '年率換算' : 'APR equiv.'} value={fundingPctYr != null ? `${fundingPctYr.toFixed(1)}%` : '—'} />
        <Stat label="Max lev" value={p.maxLeverage ? `${p.maxLeverage}×` : '—'} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button asChild size="sm" className="gap-1.5">
          <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
            {p.locale === 'ja' ? '1-Click トレード' : 'Open trade'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleImport}
          disabled={importing}
          className="gap-1.5"
        >
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : imported ? <CheckCircle2 className="h-3.5 w-3.5 text-gain" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {imported
            ? p.locale === 'ja' ? `${imported.imported} 件取込済` : `${imported.imported} fills imported`
            : p.locale === 'ja' ? '取引履歴を取込' : 'Import trade history'}
        </Button>
        {p.oiUsd && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            OI ${formatCompact(p.oiUsd)}
          </span>
        )}
      </div>

      {imported && imported.imported > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary/20">
          <Stat label="30d PnL" value={`$${formatCompact(imported.pnl_30d)}`} accent={imported.pnl_30d >= 0 ? 'gain' : 'loss'} />
          <Stat label="Fees paid" value={`$${formatCompact(imported.fees_paid)}`} />
          <Stat label="Cointier Builder Fee est." value={`$${formatCompact(imported.builder_fees_estimated)}`} accent="primary" />
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70">
        {p.locale === 'ja'
          ? '※ Cointier 経由の取引には 0.05% Builder Fee が自動的に Cointier ウォレットへ送金されます (オンチェーン執行・取り消し不可)'
          : 'Trades routed via Cointier auto-pay a 0.05% on-chain Builder Fee to the Cointier wallet. Smart-contract enforced — non-revocable.'}
      </p>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'gain' | 'loss' | 'primary' }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-2 space-y-0.5">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-[13px] font-semibold tabular-nums', accent === 'gain' && 'text-gain', accent === 'loss' && 'text-loss', accent === 'primary' && 'text-primary')}>
        {value}
      </div>
    </div>
  );
}
