'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from 'next-intl';

interface AffiliateCTAProps {
  coinSymbol: string;
  partners: Array<{
    code: string;
    label: string;
    variant?: 'default' | 'outline';
  }>;
}

/**
 * 統一アフィリエイト CTA — 全 affiliate リンクを /go/[code]?coin={symbol} 形式に統一
 *
 * 規制対応 (景表法):
 *   - 「推奨」表現 NG → 「利用可能」表現
 *   - PR バッジ + 「広告リンクを含みます・投資推奨ではありません」明示
 *
 * 追跡:
 *   - クリック時に /go/[code] へ → click_id 生成 + DB 記録 + Cookie 永続化
 *   - Session ↔ User の永久リンク (10 年スパン)
 */
export function AffiliateCTA({ coinSymbol, partners }: AffiliateCTAProps) {
  const locale = useLocale();
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <h3 className="font-semibold text-sm">
          {locale === 'ja' ? '利用可能な取引所' : 'Available exchanges'}
        </h3>
        <Badge variant="secondary" className="text-[10px]">PR</Badge>
      </div>
      <p className="text-[10px] text-muted-foreground/80">
        {locale === 'ja'
          ? '広告リンクを含みます。投資推奨ではありません。'
          : 'Contains affiliate links. Not investment advice.'}
      </p>
      <div className="space-y-2">
        {partners.map((p, i) => (
          <Button
            key={p.code}
            asChild
            variant={p.variant ?? (i === 0 ? 'default' : 'outline')}
            className="w-full"
            size="sm"
          >
            <a href={`/go/${p.code}?coin=${encodeURIComponent(coinSymbol)}&locale=${locale}`} target="_blank" rel="noopener noreferrer">
              {p.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
