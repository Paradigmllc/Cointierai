/**
 * SSOT-first on-chain metrics. Reads cointier.onchain_metrics (Messari ingest).
 */
import { Activity } from 'lucide-react';
import { getOnchainMetrics } from '@/lib/db/ssot-queries';
import { formatCompact, formatPercent, cn } from '@/lib/utils';

interface Props {
  coinId: string;
  locale: 'ja' | 'en' | string;
}

export async function OnChainPanel({ coinId, locale }: Props) {
  const m = await getOnchainMetrics(coinId);
  if (!m) return null;
  const hasAny = m.active_addresses_24h || m.tx_count_24h || m.tx_volume_24h_usd || m.nvt_adjusted;
  if (!hasAny) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />{locale === 'ja' ? 'オンチェーン指標' : 'On-chain metrics'}</h2>
        <span className="text-[10px] text-muted-foreground">Messari · 24h</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile label="Active addresses 24h" value={m.active_addresses_24h ? formatCompact(m.active_addresses_24h) : '—'} />
        <Tile label="Tx count 24h" value={m.tx_count_24h ? formatCompact(m.tx_count_24h) : '—'} />
        <Tile label="Tx volume 24h" value={m.tx_volume_24h_usd ? `$${formatCompact(m.tx_volume_24h_usd)}` : '—'} />
        <Tile label="NVT (adjusted)" value={m.nvt_adjusted ? m.nvt_adjusted.toFixed(2) : '—'} />
        {m.cycle_low_percent_up != null && (
          <Tile label="From cycle low" value={`+${formatPercent(m.cycle_low_percent_up, 1)}`} positive />
        )}
        {m.ath_percent_down != null && (
          <Tile label="ATH drawdown" value={`${formatPercent(-m.ath_percent_down, 1)}`} negative />
        )}
        {m.vladimir_club_cost_usd != null && (
          <Tile label="Vladimir Club cost" value={`$${formatCompact(m.vladimir_club_cost_usd)}`} />
        )}
      </div>
    </section>
  );
}

function Tile({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-[13px] font-semibold tabular-nums', positive && 'text-gain', negative && 'text-loss')}>{value}</div>
    </div>
  );
}
