import { Coins, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';

interface EtfFlowsPanelProps {
  symbol: string;
  aumUsd?: number | null;
  dailyInflowUsd?: number | null;
  weeklyInflowUsd?: number | null;
  totalInflowUsd?: number | null;
  /** Top issuer rows — only filled for BTC and ETH initially. */
  issuers?: Array<{ name: string; aumUsd: number; tickerSymbol?: string }>;
  locale: string;
}

const SUPPORTED_SYMBOLS = new Set(['btc', 'eth']);

/**
 * Spot ETF flows panel — currently scoped to BTC and ETH (the only assets
 * with US spot ETFs approved as of M1). Renders an empty-state CTA for
 * other tokens so the section stays consistent across the catalog.
 *
 * Data plumbing: when SoSoValue or Farside ingestion lands, the values
 * arrive on coin.etf_aum_usd / etf_daily_inflow_usd / etf_total_inflow_usd
 * which the page passes straight through.
 */
export function EtfFlowsPanel({ symbol, aumUsd, dailyInflowUsd, weeklyInflowUsd, totalInflowUsd, issuers, locale }: EtfFlowsPanelProps) {
  const isJa = locale === 'ja';
  const supported = SUPPORTED_SYMBOLS.has(symbol.toLowerCase());

  if (!supported) {
    return null;
  }

  const dailyPositive = dailyInflowUsd != null && dailyInflowUsd >= 0;
  const weeklyPositive = weeklyInflowUsd != null && weeklyInflowUsd >= 0;

  return (
    <section className="surface p-5 space-y-4 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.35), transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="section-heading flex items-center gap-2">
            <Coins className="h-4 w-4 text-tier-s" />
            {isJa ? 'スポット ETF フロー' : 'Spot ETF Flows'}
            <Badge variant="outline" className="text-[9px] py-0">{symbol.toUpperCase()}</Badge>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isJa
              ? '米国上場現物 ETF の AUM と日次フロー — 機関マネー流入の最重要指標'
              : 'US-listed spot ETF AUM and daily flows — the most-watched institutional signal'}
          </p>
        </div>
        <a
          href={symbol.toLowerCase() === 'btc' ? 'https://farside.co.uk/btc/' : 'https://farside.co.uk/ethereum-etf-flow-all-data/'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          {isJa ? '出典: Farside' : 'Source: Farside'}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {aumUsd == null && dailyInflowUsd == null && totalInflowUsd == null ? (
        <div className="relative rounded-lg border border-dashed border-border bg-subtle p-5 text-center space-y-1">
          <p className="text-[12px] text-muted-foreground">
            {isJa
              ? '日次インジェスト未走 — `npm run ingest:etf` 後に表示されます'
              : 'Daily ETF ingestion not yet run — populates after `npm run ingest:etf`'}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {isJa
              ? 'M1 では Farside / SoSoValue 連携で BTC・ETH の AUM + 日次フローを集約'
              : 'M1 plan: ingest BTC + ETH AUM and daily inflows from Farside / SoSoValue'}
          </p>
        </div>
      ) : (
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile
            label="AUM"
            value={aumUsd ? formatCompact(aumUsd) : '—'}
            sub={isJa ? '運用資産総額' : 'Assets under mgmt'}
            tone="tier-s"
          />
          <Tile
            label={isJa ? '日次フロー' : 'Daily flow'}
            value={dailyInflowUsd != null ? `${dailyPositive ? '+' : ''}${formatCompact(dailyInflowUsd)}` : '—'}
            sub={dailyInflowUsd != null ? (isJa ? (dailyPositive ? '純流入' : '純流出') : dailyPositive ? 'net inflow' : 'net outflow') : undefined}
            valueClass={dailyInflowUsd == null ? '' : dailyPositive ? 'text-gain' : 'text-loss'}
            icon={dailyInflowUsd != null ? (dailyPositive ? <TrendingUp className="h-3 w-3 text-gain" /> : <TrendingDown className="h-3 w-3 text-loss" />) : null}
          />
          <Tile
            label={isJa ? '週次フロー' : 'Weekly flow'}
            value={weeklyInflowUsd != null ? `${weeklyPositive ? '+' : ''}${formatCompact(weeklyInflowUsd)}` : '—'}
            valueClass={weeklyInflowUsd == null ? '' : weeklyPositive ? 'text-gain' : 'text-loss'}
          />
          <Tile
            label={isJa ? '累計フロー' : 'Cumulative flow'}
            value={totalInflowUsd ? formatCompact(totalInflowUsd) : '—'}
            sub={isJa ? '上場来' : 'since launch'}
          />
        </div>
      )}

      {issuers && issuers.length > 0 && (
        <div className="relative space-y-2">
          <h3 className="text-[12px] font-medium text-muted-foreground">
            {isJa ? '主要発行体 (Top AUM)' : 'Top issuers by AUM'}
          </h3>
          <ol className="space-y-1.5">
            {issuers.slice(0, 6).map((iss, i) => (
              <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-subtle">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground tabular-nums w-5 shrink-0">{i + 1}</span>
                  <span className="font-medium text-[12px] truncate">{iss.name}</span>
                  {iss.tickerSymbol && (
                    <Badge variant="outline" className="text-[9px] py-0">{iss.tickerSymbol}</Badge>
                  )}
                </div>
                <span className="num tabular-nums text-[12px] font-semibold shrink-0">{formatCompact(iss.aumUsd)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="relative text-[10px] text-muted-foreground/70 pt-1 border-t border-border/50">
        {isJa
          ? '※ AUM・フローは公開報告ベース · 機関投資家動向の代表指標 · 投資推奨ではありません'
          : '※ AUM and flows from public disclosures · A leading institutional-demand proxy · Not investment advice'}
      </p>
    </section>
  );
}

function Tile({
  label,
  value,
  sub,
  valueClass,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  tone?: 'tier-s';
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border bg-subtle p-3 space-y-1', tone === 'tier-s' ? 'border-tier-s/40' : 'border-border')}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={cn('flex items-center gap-1.5 num tabular-nums font-semibold text-[16px] leading-tight', valueClass)}>
        {icon}
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
