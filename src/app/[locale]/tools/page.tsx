/**
 * /tools — pUtility tools hub (Aha Moment funnel entry).
 * Each card promises a registration-free value within TTFV < 30s.
 */
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Activity, Calculator, FileBarChart2, Calendar, FileText, Wallet, ArrowUpRight, Sparkles } from 'lucide-react';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/i18n/routing';

export const revalidate = 86_400;

const TOOLS = [
  { slug: 'risk-score', icon: Activity, color: 'text-tier-d', titleJa: 'ポートフォリオ リスクスコアラー', titleEn: 'Portfolio risk scorer', descJa: 'ウォレットアドレスから集中度・ボラ・ピアランクを 15 秒で判定', descEn: 'Drop a wallet — get concentration, vol, and peer-rank in 15s.', badge: 'Aha Moment' },
  { slug: 'converter', icon: Calculator, color: 'text-primary', titleJa: '通貨コンバーター', titleEn: 'Crypto converter', descJa: '任意のコイン同士 + 法定通貨 30 種で即変換', descEn: 'Convert any-to-any + 30 fiats with deep-link copy.', badge: 'Always free' },
  { slug: 'dca-simulator', icon: FileBarChart2, color: 'text-gain', titleJa: 'DCA バックテスト', titleEn: 'DCA backtest', descJa: '過去 N 年定期積立した場合の損益を即計算', descEn: 'What if I had DCA\'d $X/week for N years?', badge: 'Always free' },
  { slug: 'unlock-impact', icon: Calendar, color: 'text-tier-a', titleJa: 'アンロック影響試算', titleEn: 'Unlock impact calculator', descJa: '今後 30 日の供給増 vs 取引高を試算', descEn: 'Supply pressure vs daily volume forecast.', badge: 'Free 7d / Pro 30d' },
  { slug: 'tax-jp', icon: FileText, color: 'text-loss', titleJa: '日本 雑所得シミュ', titleEn: 'JP miscellaneous-income tax', descJa: 'CSV 投入 → 累進+住民税の概算 PDF', descEn: 'Upload CSV → progressive + resident tax PDF.', badge: 'Pro' },
  { slug: 'portfolio-import', icon: Wallet, color: 'text-primary', titleJa: 'ポートフォリオ AI 分析', titleEn: 'Portfolio AI analyser', descJa: 'EVM / Solana ウォレットを接続 → AI 分析', descEn: 'Connect a wallet → AI breakdown.', badge: 'Pro' },
] as const;

export default async function ToolsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const isJa = locale === 'ja';

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={isJa ? 'クリプト ユーティリティ' : 'Crypto utilities'}
        subtitle={isJa ? '登録不要・30 秒で価値を確認できる無料ツール集' : 'No signup. Value in 30 seconds.'}
        meta={<PageBadge>{TOOLS.length} tools</PageBadge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TOOLS.map(({ slug, icon: Icon, color, titleJa, titleEn, descJa, descEn, badge }) => (
          <Link
            key={slug}
            href={`/tools/${slug}`}
            className="surface p-5 space-y-2 hover:shadow-card hover:-translate-y-px transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-muted/50">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
            </div>
            <h3 className="font-semibold text-[14px] group-hover:text-primary transition-colors">{isJa ? titleJa : titleEn}</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">{isJa ? descJa : descEn}</p>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      <section className="surface p-5 space-y-2 border-primary/30 bg-primary/5">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Pro tools</h3>
        <p className="text-[12px] text-muted-foreground">
          {isJa
            ? '日本確定申告 PDF・アンロック影響アラート・Hyperliquid 取引履歴の自動 P/L レポートは Pro プランで利用できます。'
            : 'JP tax-filing PDF, unlock-impact alerts, and Hyperliquid auto P/L reports are bundled in the Pro plan.'}
        </p>
        <Link href="/pricing" className="inline-flex items-center text-[12px] text-primary hover:underline">
          {isJa ? 'Pro プランを見る →' : 'See Pro plan →'}
        </Link>
      </section>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Crypto utilities | Cointier' };
}
