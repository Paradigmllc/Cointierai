import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { getMarkets } from '@/lib/api/coingecko';
import type { Coin, Tier } from '@/types/database';
import { COIN_NULL_DEFAULTS } from '@/lib/db/coin-defaults';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: Locale }>;
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
    id: m.id,
    cmc_id: null,
    cryptorank_id: null,
    symbol: m.symbol,
    name: m.name,
    chain_id: null,
    contract_address: null,
    image_url: m.image,
    website: null,
    whitepaper_url: null,
    github_url: null,
    twitter_url: null,
    telegram_url: null,
    discord_url: null,
    rank: m.market_cap_rank ?? null,
    price_usd: m.current_price,
    market_cap_usd: m.market_cap,
    fdv_usd: m.fully_diluted_valuation,
    volume_24h_usd: m.total_volume,
    circulating_supply: m.circulating_supply,
    total_supply: m.total_supply,
    max_supply: m.max_supply,
    ath_usd: m.ath,
    ath_date: m.ath_date,
    atl_usd: m.atl,
    atl_date: m.atl_date,
    change_1h: m.price_change_percentage_1h_in_currency ?? null,
    change_24h: m.price_change_percentage_24h,
    change_7d: m.price_change_percentage_7d_in_currency ?? null,
    change_30d: m.price_change_percentage_30d_in_currency ?? null,
    change_1y: m.price_change_percentage_1y_in_currency ?? null,
    tier: tierFromRank(m.market_cap_rank ?? null),
    tier_score: null,
    tier_updated_at: null,
    is_active: true,
    source: 'coingecko',
    primary_source_id: m.id,
    created_at: m.last_updated ?? new Date().toISOString(),
    updated_at: m.last_updated ?? new Date().toISOString(),
  };
}

export default async function CoinsListPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { page: pageStr, perPage: perPageStr } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const page = Math.max(1, Number(pageStr) || 1);
  const perPage = Math.min(250, Math.max(50, Number(perPageStr) || 250));

  const marketCoins = await getMarkets({ page, perPage }).catch(() => []);
  const coins = marketCoins.map(mapCoin);

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('exploreAll')}</h1>
        <p className="text-sm text-muted-foreground">
          Page {page} · {coins.length} coins (CoinGecko Demo · 17K+ universe)
        </p>
      </div>
      <CoinsTable data={coins} pageSize={perPage} showPagination={false} />

      {/* Server-side pagination via query string */}
      <nav className="flex items-center justify-between text-sm text-muted-foreground" aria-label="Pagination">
        <a
          href={page > 1 ? `?page=${page - 1}&perPage=${perPage}` : undefined}
          className={page > 1 ? 'text-primary hover:underline' : 'opacity-50 pointer-events-none'}
        >
          ← Previous
        </a>
        <span>Page {page}</span>
        <a
          href={coins.length === perPage ? `?page=${page + 1}&perPage=${perPage}` : undefined}
          className={coins.length === perPage ? 'text-primary hover:underline' : 'opacity-50 pointer-events-none'}
        >
          Next →
        </a>
      </nav>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('exploreAll') };
}
