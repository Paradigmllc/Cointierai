import { setRequestLocale } from 'next-intl/server';
import { FileBarChart2 } from 'lucide-react';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { DcaSimulatorClient } from '@/components/tools/DcaSimulatorClient';
import { getMarkets } from '@/lib/api/coingecko';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export default async function DcaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const top = await getMarkets({ perPage: 50, sparkline: false }).catch(() => []);
  const coins = top.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, image: c.image }));

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? 'DCA バックテスト' : 'DCA backtest simulator'}
        subtitle={locale === 'ja' ? '過去 N 年定期積立した場合の損益を即座に計算' : 'What if I had DCA\'d $X/week for N years?'}
        meta={<PageBadge><FileBarChart2 className="h-3 w-3 mr-1" />Free tool</PageBadge>}
      />
      <DcaSimulatorClient coins={coins} locale={locale} />
    </div>
  );
}

export function generateMetadata() {
  return { title: 'DCA Backtest | Cointier' };
}
