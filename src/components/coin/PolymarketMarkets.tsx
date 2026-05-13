import { useTranslations } from 'next-intl';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { getRelatedMarkets, type PmMarket } from '@/lib/api/polymarket';
import { Badge } from '@/components/ui/badge';
import { formatCompact, cn } from '@/lib/utils';

interface PolymarketMarketsProps {
  symbol: string;
  name: string;
  locale: string;
}

/**
 * 予測マーケットタブ (Notion L2333-2352)
 *
 * 規制対応:
 *   - M1 は「表示のみ」(賭博罪・幇助リスク回避)
 *   - 取引導線は外部リンクのみ (rel=noopener noreferrer)
 *   - 「予測情報」「投資判断はご自身で」明記
 *   - M6+ で Verified Builder 申請後に Builder Fee 実装
 */
export async function PolymarketMarkets({ symbol, name, locale }: PolymarketMarketsProps) {
  const markets = await getRelatedMarkets(symbol, name);
  if (!markets.length) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-tier-d" />
          {locale === 'ja' ? '関連する予測マーケット' : 'Related prediction markets'}
        </h3>
        <Badge variant="secondary" className="text-[10px]">Polymarket</Badge>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {locale === 'ja'
          ? '予測市場の情報表示のみ。取引は外部サイトで自己責任で行ってください。投資推奨ではありません。'
          : 'Display only. Trading happens on the external site at your own risk. Not investment advice.'}
      </p>

      <ul className="space-y-2">
        {markets.map((m) => (
          <MarketRow key={m.id} market={m} locale={locale} />
        ))}
      </ul>
    </div>
  );
}

function MarketRow({ market, locale }: { market: PmMarket; locale: string }) {
  const yesPrice = parseFloat(market.outcomePrices[0] ?? '0');
  const noPrice = parseFloat(market.outcomePrices[1] ?? '0');
  const volume = parseFloat(market.volume ?? '0');

  return (
    <li className="flex items-center justify-between gap-3 py-2 border-t border-border/30 first:border-t-0">
      <a
        href={`https://polymarket.com/market/${market.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 hover:text-primary transition-colors group"
      >
        <div className="text-sm font-medium truncate flex items-center gap-1">
          {market.question}
          <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Vol {formatCompact(volume)} · {locale === 'ja' ? '締切' : 'Ends'} {new Date(market.endDate).toISOString().slice(0, 10)}
        </div>
      </a>
      <div className="flex gap-2 shrink-0">
        <div className={cn('px-2 py-1 rounded text-xs font-medium', 'bg-gain/10 text-gain border border-gain/30')}>
          YES {(yesPrice * 100).toFixed(0)}¢
        </div>
        <div className={cn('px-2 py-1 rounded text-xs font-medium', 'bg-loss/10 text-loss border border-loss/30')}>
          NO {(noPrice * 100).toFixed(0)}¢
        </div>
      </div>
    </li>
  );
}
