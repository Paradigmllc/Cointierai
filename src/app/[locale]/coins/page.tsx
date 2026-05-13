/**
 * /coins — Cointier full-market listing.
 *
 *  - PageHeader (28px title / 13px subtitle)
 *  - 8-column sortable data table + sparkline + pagination
 *  - 250 rows per page · server-side ?page=N&perPage=N
 *  - Bottom pagination control
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { PageHeader, PageBadge } from '@/components/layout/PageHeader';
import { getMarkets } from '@/lib/api/coingecko';
import type { Coin, Tier } from '@/types/database';
import { COIN_NULL_DEFAULTS } from '@/lib/db/coin-defaults';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; perPage?: string }>;
}

function tierFromRank(rank: number | null): Tier | null {
  if (rank === null) return null;
  if (rank <= 20) return 'S';
  if (rank <= 100) return 'A';
  if (rank <= 500) return 'B';
  if (rank <= 2000) return 'C';
  if (rank <= 5000) return 'D';
  return 'F';
}

function mapCoin(m: Awaited<ReturnType<typeof getMarkets>>[number]): Coin {
  return {
    ...COIN_NULL_DEFAULTS,
    id: m.id, cmc_id: null, cryptorank_id: null,
    symbol: m.symbol, name: m.name,
    chain_id: null, contract_address: null, image_url: m.image,
    website: null, whitepaper_url: null, github_url: null, twitter_url: null, telegram_url: null, discord_url: null,
    rank: m.market_cap_rank ?? null,
    price_usd: m.current_price, market_cap_usd: m.market_cap, fdv_usd: m.fully_diluted_valuation, volume_24h_usd: m.total_volume,
    circulating_supply: m.circulating_supply, total_supply: m.total_supply, max_supply: m.max_supply,
    ath_usd: m.ath, ath_date: m.ath_date, atl_usd: m.atl, atl_date: m.atl_date,
    change_1h: m.price_change_percentage_1h_in_currency ?? null,
    change_24h: m.price_change_percentage_24h,
    change_7d: m.price_change_percentage_7d_in_currency ?? null,
    change_30d: m.price_change_percentage_30d_in_currency ?? null,
    change_1y: m.price_change_percentage_1y_in_currency ?? null,
    tier: tierFromRank(m.market_cap_rank ?? null),
    tier_score: null, tier_updated_at: null,
    is_active: true, source: 'coingecko', primary_source_id: m.id,
    created_at: m.last_updated ?? new Date().toISOString(),
    updated_at: m.last_updated ?? new Date().toISOString(),
  };
}

export default async function CoinsListPage({ params, searchParams }: PageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const { page: pageStr, perPage: perPageStr } = await searchParams;
  setRequestLocale(locale);

  const page = Math.max(1, Number(pageStr) || 1);
  const perPage = Math.min(250, Math.max(50, Number(perPageStr) || 100));

  const marketCoins = await getMarkets({ page, perPage, sparkline: true, priceChangePct: ['1h', '24h', '7d', '30d'] }).catch(() => []);
  const coins = marketCoins.map(mapCoin);

  const sparklineMap: Record<string, number[]> = {};
  for (const m of marketCoins) {
    if (m.sparkline_in_7d?.price?.length) {
      sparklineMap[m.symbol.toLowerCase()] = m.sparkline_in_7d.price;
      sparklineMap[m.id] = m.sparkline_in_7d.price;
    }
  }

  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);

  return (
    <div className="container py-4 space-y-4">
      <PageHeader
        title={t('全銘柄 — 時価総額順', 'All Cryptocurrencies — Ranked by Market Cap')}
        subtitle={t(`${coins.length} 件表示中 · Page ${page} / 17,000+ universe`, `Showing ${coins.length} · Page ${page} of 17,000+ universe`)}
        meta={<PageBadge>CoinGecko</PageBadge>}
      />

      <CoinsTable data={coins} pageSize={perPage} showPagination={false} sparklineMap={sparklineMap} density="dense" />

      {/* Server-side bottom pagination */}
      <nav className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/30" aria-label="Pagination">
        <span>
          {t('Page', 'Page')} {page} · {coins.length} / page
        </span>
        <div className="flex items-center gap-3">
          <a
            href={page > 1 ? `?page=${page - 1}&perPage=${perPage}` : undefined}
            className={page > 1 ? 'text-primary hover:underline' : 'opacity-40 pointer-events-none'}
          >
            ← {t('前へ', 'Previous')}
          </a>
          <span className="text-foreground font-medium">{page}</span>
          <a
            href={coins.length === perPage ? `?page=${page + 1}&perPage=${perPage}` : undefined}
            className={coins.length === perPage ? 'text-primary hover:underline' : 'opacity-40 pointer-events-none'}
          >
            {t('次へ', 'Next')} →
          </a>
        </div>
      </nav>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('exploreAll') };
}
