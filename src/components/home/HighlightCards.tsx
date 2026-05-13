/**
 * HighlightCards — CryptoRank.io 風 4 つのメトリクスカード行
 *
 * BTC Dominance Chart | Token Unlocks 7d | Altcoin Index | Fear & Greed
 *
 * server component (server-side fetch · 24h cache)
 */
import { Sparkline } from '@/components/coin/Sparkline';
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';
import { TrendingUp, Lock, BarChart3, Activity } from 'lucide-react';

interface HighlightCardsProps {
  btcDominance: number;
  btcDomChange24h?: number;
  totalUnlocks7dUsd?: number;
  altcoinIndex?: number;
  fearGreed?: { value: number; classification: string };
  /** BTC dominance 7d 履歴 (sparkline 用) */
  btcDomSparkline?: number[];
  locale?: string;
}

export function HighlightCards({
  btcDominance,
  btcDomChange24h,
  totalUnlocks7dUsd,
  altcoinIndex,
  fearGreed,
  btcDomSparkline,
  locale = 'ja',
}: HighlightCardsProps) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* BTC Dominance */}
      <Card
        icon={<TrendingUp className="h-3.5 w-3.5 text-tier-d" />}
        title="BTC Dominance"
        value={`${btcDominance.toFixed(2)}%`}
        change={btcDomChange24h}
        sparkline={btcDomSparkline}
      />
      {/* Token Unlocks 7d */}
      <Card
        icon={<Lock className="h-3.5 w-3.5 text-tier-d" />}
        title={t('7日 アンロック', 'Token Unlocks 7d')}
        value={totalUnlocks7dUsd != null ? formatCompact(totalUnlocks7dUsd) : '—'}
        subtle={t('DeFiLlama 集計', 'Aggregated by DeFiLlama')}
      />
      {/* Altcoin Index */}
      <Card
        icon={<BarChart3 className="h-3.5 w-3.5 text-tier-a" />}
        title="Altcoin Season Index"
        value={altcoinIndex != null ? `${altcoinIndex}/100` : '—'}
        subtle={
          altcoinIndex == null
            ? undefined
            : altcoinIndex >= 75
              ? t('アルトシーズン', 'Altcoin Season')
              : altcoinIndex <= 25
                ? t('ビットコインシーズン', 'Bitcoin Season')
                : t('中立', 'Neutral')
        }
        progress={altcoinIndex}
      />
      {/* Fear & Greed */}
      <Card
        icon={<Activity className="h-3.5 w-3.5 text-tier-b" />}
        title="Fear & Greed"
        value={fearGreed != null ? `${fearGreed.value}/100` : '—'}
        subtle={fearGreed?.classification}
        progress={fearGreed?.value}
        progressColor={fearGreed != null && fearGreed.value < 50 ? 'loss' : 'gain'}
      />
    </div>
  );
}

function Card({
  icon,
  title,
  value,
  change,
  subtle,
  sparkline,
  progress,
  progressColor = 'gain',
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: number;
  subtle?: string;
  sparkline?: number[];
  progress?: number;
  progressColor?: 'gain' | 'loss';
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {change !== undefined && (
          <span className={cn('num text-[10px]', changeColor(change))}>{formatPercent(change, 2)}</span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="num text-lg font-semibold tabular-nums">{value}</div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} width={64} height={24} strokeWidth={1.2} />
        )}
      </div>
      {subtle && <div className="text-[10px] text-muted-foreground">{subtle}</div>}
      {typeof progress === 'number' && (
        <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={cn('h-full', progressColor === 'loss' ? 'bg-loss' : 'bg-gain')}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
