import { ShieldAlert, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';

interface HackEvent {
  date: string;
  amount_lost_usd: number | null;
  root_cause: string | null;
  is_recovered?: boolean;
  description?: string | null;
  source_urls?: string[] | null;
}

interface HackHistoryProps {
  hacks: HackEvent[];
  locale: string;
}

const CAUSE_COLOR: Record<string, string> = {
  contract: 'text-loss bg-loss/15 border-loss/40',
  reentrancy: 'text-loss bg-loss/20 border-loss/50',
  flashloan: 'text-tier-d bg-tier-d/15 border-tier-d/40',
  oracle: 'text-tier-d bg-tier-d/15 border-tier-d/40',
  bridge: 'text-loss bg-loss/15 border-loss/40',
  rug: 'text-loss bg-loss/30 border-loss/60',
  exploit: 'text-loss bg-loss/15 border-loss/40',
  phishing: 'text-tier-d bg-tier-d/15 border-tier-d/40',
  key: 'text-tier-d bg-tier-d/15 border-tier-d/40',
};

function causeStyle(cause: string | null): string {
  if (!cause) return 'text-muted-foreground bg-muted border-border';
  const key = cause.toLowerCase();
  for (const [k, v] of Object.entries(CAUSE_COLOR)) {
    if (key.includes(k)) return v;
  }
  return 'text-muted-foreground bg-muted border-border';
}

/**
 * Hack history list — sorted newest-first, with cause-coloured chips and
 * source-link affordance. Empty state celebrates clean records as a positive
 * trust signal (Cointier differentiator).
 */
export function HackHistory({ hacks, locale }: HackHistoryProps) {
  if (hacks.length === 0) {
    return (
      <section className="surface p-5 space-y-2 border-gain/30 bg-gain/[0.03]">
        <h2 className="section-heading flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gain" />
          {locale === 'ja' ? 'セキュリティ履歴' : 'Security history'}
          <Badge className="text-[9px] py-0 bg-gain/10 text-gain border-gain/30">CLEAN</Badge>
        </h2>
        <p className="text-[12px] text-muted-foreground">
          {locale === 'ja'
            ? 'DeFiLlama Hacks DB に該当インシデント記録なし — Cointier 検知時点で安全評価。'
            : 'No incidents on file in DeFiLlama Hacks DB at the time of this snapshot.'}
        </p>
      </section>
    );
  }

  const sorted = [...hacks].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const totalLost = hacks.reduce((s, h) => s + (h.amount_lost_usd ?? 0), 0);

  return (
    <section className="surface p-5 space-y-4 border-loss/30">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <h2 className="section-heading flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-loss" />
          {locale === 'ja' ? 'セキュリティ履歴' : 'Security history'}
          <Badge variant="outline" className="text-[9px] py-0 text-loss border-loss/40">DeFiLlama Hacks</Badge>
        </h2>
        <div className="grid grid-cols-2 gap-4 text-right">
          <Kpi label={locale === 'ja' ? '件数' : 'Incidents'} value={hacks.length.toString()} />
          <Kpi label={locale === 'ja' ? '累計被害' : 'Total lost'} value={totalLost > 0 ? formatCompact(totalLost) : '—'} />
        </div>
      </div>

      <ol className="space-y-2.5">
        {sorted.slice(0, 8).map((h, i) => (
          <li key={`${h.date}-${i}`} className="rounded-lg border border-loss/20 bg-loss/[0.03] p-3 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {h.root_cause && (
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border', causeStyle(h.root_cause))}>
                    {h.root_cause}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {h.date}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{locale === 'ja' ? '被害額' : 'Lost'}</div>
                  <div className="num font-semibold tabular-nums text-[13px] text-loss">
                    {h.amount_lost_usd ? formatCompact(h.amount_lost_usd) : '—'}
                  </div>
                </div>
                {h.source_urls?.[0] && (
                  <a
                    href={h.source_urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-loss hover:text-loss/80"
                    aria-label="Source"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            {h.description && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">{h.description}</p>
            )}
          </li>
        ))}
      </ol>

      {hacks.length > 8 && (
        <div className="text-[11px] text-muted-foreground text-center pt-1 border-t border-border/50">
          {locale === 'ja' ? `他 ${hacks.length - 8} 件` : `${hacks.length - 8} more incidents`}
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="num tabular-nums text-[13px] font-semibold">{value}</div>
    </div>
  );
}
