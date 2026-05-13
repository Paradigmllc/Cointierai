/**
 * AiVerdictHero — the hero "Cointier AI verdict" card on coin detail pages.
 *
 * Reads cointier.coin_verdicts (populated by generateVerdictsBatch). When
 * no row exists yet (long-tail coins, fresh listings) it renders nothing,
 * which is intentional — empty hero space is preferable to fake content.
 */
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCoinVerdict } from '@/lib/db/ssot-queries';
import { cn } from '@/lib/utils';

interface Props {
  coinId: string;
  locale: 'ja' | 'en' | string;
}

function scoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground';
  if (score > 0.4) return 'text-gain';
  if (score < -0.4) return 'text-loss';
  return 'text-tier-d';
}

function scoreLabel(score: number | null, locale: string): string {
  if (score == null) return '—';
  if (locale === 'ja') {
    if (score > 0.6) return '長期向け強気';
    if (score > 0.2) return '構造的に良好';
    if (score > -0.2) return '中立';
    if (score > -0.6) return '注意';
    return '高ボラ・要警戒';
  }
  if (score > 0.6) return 'Strong fundamentals';
  if (score > 0.2) return 'Constructive';
  if (score > -0.2) return 'Neutral';
  if (score > -0.6) return 'Caution';
  return 'High risk';
}

export async function AiVerdictHero({ coinId, locale }: Props) {
  const v = await getCoinVerdict(coinId, locale);
  if (!v || !v.tldr) return null;

  return (
    <section className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-5 space-y-4 relative overflow-hidden">
      {/* Decorative subtle gradient ring */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" aria-hidden />

      <header className="flex items-center justify-between gap-2 flex-wrap relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{locale === 'ja' ? 'Cointier AI 評定' : 'Cointier AI Verdict'}</h2>
          <Badge variant="secondary" className="text-[9px]">DeepSeek V4 Pro</Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {v.time_horizon && <span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{v.time_horizon}</span>}
          {v.confidence != null && <span>conf {(v.confidence * 100).toFixed(0)}%</span>}
        </div>
      </header>

      <div className="flex items-baseline gap-3 flex-wrap relative">
        <span className={cn('text-2xl md:text-3xl font-bold tabular-nums', scoreColor(v.verdict_score))}>
          {v.verdict ?? scoreLabel(v.verdict_score, locale)}
        </span>
        {v.verdict_score != null && (
          <span className="text-[12px] text-muted-foreground">
            score {v.verdict_score >= 0 ? '+' : ''}{v.verdict_score.toFixed(2)} · {scoreLabel(v.verdict_score, locale)}
          </span>
        )}
      </div>

      <p className="text-[13px] leading-relaxed relative">{v.tldr}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
        {v.bull_case && v.bull_case.length > 0 && (
          <div className="rounded-lg border border-gain/30 bg-gain/5 p-3 space-y-1.5">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-gain"><TrendingUp className="h-3 w-3" />Bull case</div>
            <ul className="space-y-1 text-[12px]">
              {v.bull_case.slice(0, 3).map((bc, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-gain">▲</span>
                  <span className="leading-snug">{bc.point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {v.bear_case && v.bear_case.length > 0 && (
          <div className="rounded-lg border border-loss/30 bg-loss/5 p-3 space-y-1.5">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-loss"><TrendingDown className="h-3 w-3" />Bear case</div>
            <ul className="space-y-1 text-[12px]">
              {v.bear_case.slice(0, 3).map((bc, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-loss">▼</span>
                  <span className="leading-snug">{bc.point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {v.catalysts && v.catalysts.length > 0 && (
        <div className="space-y-1.5 relative">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"><Zap className="h-3 w-3" />{locale === 'ja' ? 'カタリスト' : 'Catalysts to watch'}</div>
          <div className="flex flex-wrap gap-1.5">
            {v.catalysts.slice(0, 3).map((c, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5">
                <span className="font-medium">{c.title}</span>
                {c.date && <span className="text-muted-foreground"> · {c.date}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {v.risk_factors && v.risk_factors.length > 0 && (
        <div className="space-y-1 relative">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-tier-d"><AlertTriangle className="h-3 w-3" />{locale === 'ja' ? 'リスク要因' : 'Risk factors'}</div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {v.risk_factors.map((r) => r.factor).join(' · ')}
          </p>
        </div>
      )}

      <p className="text-[9px] text-muted-foreground/70 relative">
        {locale === 'ja'
          ? '※ AI 生成の中立分析であり、投資推奨ではありません。投資判断はご自身でお願いします。'
          : '※ AI-generated neutral analysis. Not investment advice. DYOR.'}
      </p>
    </section>
  );
}
