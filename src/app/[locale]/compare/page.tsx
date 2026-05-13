/**
 * /compare — coin comparison entry point with picker.
 * User selects 2-4 coins via cmdk picker → routed to /compare/[pair].
 */
import { setRequestLocale } from 'next-intl/server';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { getMarkets } from '@/lib/api/coingecko';
import { ComparePicker } from '@/components/compare/ComparePicker';
import type { Locale } from '@/i18n/routing';

export const revalidate = 600;

export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);

  const top = await getMarkets({ perPage: 100, sparkline: false }).catch(() => []);
  const seeds = top.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, image: c.image, rank: c.market_cap_rank }));

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={locale === 'ja' ? '銘柄比較' : 'Compare coins'}
        subtitle={locale === 'ja' ? '2-4 銘柄を選んで価格・KPI・パフォーマンスを横並びで比較' : 'Select 2-4 coins to compare side-by-side'}
        meta={<PageBadge>CoinGecko</PageBadge>}
      />
      <ComparePicker seeds={seeds} locale={locale} />
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Compare coins | Cointier' };
}
