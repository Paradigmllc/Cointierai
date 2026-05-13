/**
 * /tools/portfolio-import — wallet → AI breakdown.
 *
 * Free preview: paste an EVM address, see top 10 holdings + USD value
 * (Etherscan v2 + CoinGecko prices). Detailed P/L / tax report is Pro.
 */
import { setRequestLocale } from 'next-intl/server';
import { Wallet, Lock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { PortfolioImportClient } from '@/components/tools/PortfolioImportClient';
import type { Locale } from '@/i18n/routing';

export default async function PortfolioImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const isJa = locale === 'ja';

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={isJa ? 'ポートフォリオ AI 分析' : 'Portfolio AI analyser'}
        subtitle={isJa ? 'EVM ウォレットを入力 → 保有資産・分散度・リスクスコア' : 'Paste an EVM wallet → holdings, allocation, risk score'}
        meta={<PageBadge><Wallet className="h-3 w-3 mr-1" />Free preview</PageBadge>}
      />
      <PortfolioImportClient locale={locale} />
      <section className="surface p-5 space-y-2 border-primary/30 bg-primary/5">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />{isJa ? '実損 P/L レポートは Pro' : 'Realised P/L report — Pro'}</h3>
        <p className="text-[12px] text-muted-foreground">
          {isJa
            ? '無料版は現在の保有内訳まで。取得タイミングからの実損益・税務サマリーは Pro プランで提供します。'
            : 'Free shows current holdings only. Realised P/L since acquisition + tax summary live in Pro.'}
        </p>
        <Link href="/pricing" className="inline-flex items-center text-[12px] text-primary hover:underline">
          {isJa ? 'Pro プランへ →' : 'Upgrade →'}
        </Link>
      </section>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Portfolio AI analyser | Cointier' };
}
