import { setRequestLocale } from 'next-intl/server';
import { Calculator } from 'lucide-react';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { ConverterClient } from '@/components/tools/ConverterClient';
import { getMarkets, getExchangeRates } from '@/lib/api/coingecko';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300;

export default async function ConverterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const [top, rates] = await Promise.all([
    getMarkets({ perPage: 100, sparkline: false }).catch(() => []),
    getExchangeRates().catch(() => ({ USD: 1 } as Record<string, number>)),
  ]);
  const coins = top.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, image: c.image, priceUsd: c.current_price }));

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? '通貨コンバーター' : 'Crypto converter'}
        subtitle={locale === 'ja' ? '暗号資産・法定通貨を任意の組み合わせで即時換算' : 'Any-to-any conversion across crypto and 30+ fiats'}
        meta={<PageBadge><Calculator className="h-3 w-3 mr-1" />Free tool</PageBadge>}
      />
      <ConverterClient coins={coins} rates={rates} locale={locale} />
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Crypto Converter | Cointier' };
}
