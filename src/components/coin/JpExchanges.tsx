import { useTranslations } from 'next-intl';
import { JP_EXCHANGES, getJpAvailability } from '@/lib/jp-exchanges';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Coin } from '@/types/database';

interface JpExchangesProps {
  coin: Pick<Coin, 'id' | 'symbol' | 'name'>;
}

/**
 * 国内取引所での取扱状況表示 — 日本特化最強差別化機能
 *
 * Notion L1723-1728: 日本人投資家が最初に見る情報 = CoinGecko 等にない一次情報
 * 規制対応 (景表法): 「推奨」表現 NG → 「利用可能」表現に統一
 */
export function JpExchanges({ coin }: JpExchangesProps) {
  const availability = getJpAvailability(coin);
  const t = useTranslations('coin');

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          🇯🇵 国内取引所での取扱
        </h3>
        {availability.is_available_in_japan ? (
          <Badge variant="success" className="text-[10px]">
            {availability.count} 取引所で利用可能
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            国内未上場
          </Badge>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/80">
        金融庁届出済の国内取引所での取扱状況です。投資推奨ではなく、利用可能性の情報です。
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {JP_EXCHANGES.map((ex) => {
          const available = availability.jp_exchanges.some((e) => e.id === ex.id);
          return (
            <a
              key={ex.id}
              href={available ? ex.url : undefined}
              target={available ? '_blank' : undefined}
              rel={available ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-colors',
                available
                  ? 'border-gain/30 bg-gain/5 hover:bg-gain/10 text-foreground'
                  : 'border-border/30 bg-muted/10 text-muted-foreground/60',
              )}
            >
              {available ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-gain shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className="truncate">{ex.name}</span>
            </a>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/70">
        ※ 国内取引所の取扱銘柄は変動します。最新情報は各取引所サイトでご確認ください。
      </p>
    </div>
  );
}
