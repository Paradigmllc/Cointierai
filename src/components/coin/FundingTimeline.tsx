import { TrendingUp, DollarSign, ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';

interface FundingRound {
  round_type: string | null;
  amount_usd: number | null;
  valuation_usd: number | null;
  date: string | null;
  source: string | null;
  source_url: string | null;
}

interface FundingTimelineProps {
  rounds: FundingRound[];
  fundingTotalUsd?: number | null;
  fundingRoundCount?: number | null;
  locale: string;
}

const ROUND_STYLES: Record<string, { color: string; bg: string }> = {
  seed: { color: 'text-tier-d', bg: 'bg-tier-d/15 border-tier-d/40' },
  'pre-seed': { color: 'text-muted-foreground', bg: 'bg-muted border-border' },
  'series a': { color: 'text-primary', bg: 'bg-primary/15 border-primary/40' },
  'series b': { color: 'text-primary', bg: 'bg-primary/20 border-primary/50' },
  'series c': { color: 'text-tier-s', bg: 'bg-tier-s/15 border-tier-s/40' },
  ico: { color: 'text-gain', bg: 'bg-gain/15 border-gain/40' },
  ido: { color: 'text-gain', bg: 'bg-gain/15 border-gain/40' },
  private: { color: 'text-tier-a', bg: 'bg-tier-a/15 border-tier-a/40' },
  strategic: { color: 'text-primary', bg: 'bg-primary/15 border-primary/40' },
};

function roundStyle(round: string | null) {
  if (!round) return { color: 'text-muted-foreground', bg: 'bg-muted border-border' };
  const key = round.toLowerCase();
  for (const [k, v] of Object.entries(ROUND_STYLES)) {
    if (key.includes(k)) return v;
  }
  return { color: 'text-muted-foreground', bg: 'bg-muted border-border' };
}

/**
 * Vertical funding timeline — rounds rendered as left-rail bullets with
 * round-type chips, amount, valuation, and source link. Designed to be
 * a denser, more visual alternative to the previous flat table.
 */
export function FundingTimeline({ rounds, fundingTotalUsd, fundingRoundCount, locale }: FundingTimelineProps) {
  if (rounds.length === 0) return null;
  const sorted = [...rounds].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const total =
    fundingTotalUsd ??
    rounds.reduce((s, r) => s + (r.amount_usd ?? 0), 0);
  const latestValuation = sorted.find((r) => r.valuation_usd)?.valuation_usd;

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <h2 className="section-heading flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {locale === 'ja' ? '資金調達履歴' : 'Funding rounds'}
          <Badge variant="outline" className="text-[9px] py-0">RootData · DeFiLlama Raises</Badge>
        </h2>
        <div className="grid grid-cols-3 gap-4 text-right">
          <Kpi label={locale === 'ja' ? 'ラウンド数' : 'Rounds'} value={(fundingRoundCount ?? rounds.length).toString()} />
          <Kpi label={locale === 'ja' ? '累計調達' : 'Total raised'} value={total > 0 ? formatCompact(total) : '—'} />
          <Kpi label={locale === 'ja' ? '最新評価' : 'Latest val.'} value={latestValuation ? formatCompact(latestValuation) : '—'} />
        </div>
      </div>

      <ol className="relative space-y-3 pl-6 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-border">
        {sorted.slice(0, 8).map((r, i) => {
          const style = roundStyle(r.round_type);
          return (
            <li key={`${r.date}-${i}`} className="relative">
              <span className={cn('absolute -left-[1.0625rem] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-card', style.bg)} />
              <div className="rounded-lg border border-border bg-subtle p-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border', style.color, style.bg)}>
                        {r.round_type ?? (locale === 'ja' ? '不明' : 'Unknown')}
                      </span>
                      {r.date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {r.date}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Amount</div>
                      <div className="num font-semibold tabular-nums text-[13px]">
                        {r.amount_usd ? formatCompact(r.amount_usd) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{locale === 'ja' ? '評価額' : 'Valuation'}</div>
                      <div className="num tabular-nums text-[12px] text-muted-foreground">
                        {r.valuation_usd ? formatCompact(r.valuation_usd) : '—'}
                      </div>
                    </div>
                    {r.source_url && (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
                        aria-label="Source"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {rounds.length > 8 && (
        <div className="text-[11px] text-muted-foreground text-center pt-1 border-t border-border/50">
          {locale === 'ja'
            ? `他 ${rounds.length - 8} 件は Pro で閲覧`
            : `${rounds.length - 8} more rounds available on Pro`}
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="num tabular-nums text-[13px] font-semibold flex items-center justify-end gap-1">
        {label.toLowerCase().includes('rounds') && <TrendingUp className="h-3 w-3 text-primary" />}
        {value}
      </div>
    </div>
  );
}
