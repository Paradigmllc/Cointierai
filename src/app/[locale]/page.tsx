import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowRight, TrendingUp, Activity, Coins, BarChart3, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { getMarkets, getGlobal, getTrending } from '@/lib/api/coingecko';
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';
import type { Coin, Tier } from '@/types/database';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300; // 5min ISR

/**
 * CoinGecko market data を Cointier Coin 形式へマップ
 * (Tier は後で AI 計算で埋める — 現状は market_cap_rank ベース仮置き)
 */
function mapMarketCoinToCoin(m: Awaited<ReturnType<typeof getMarkets>>[number]): Coin {
  const rank = m.market_cap_rank ?? null;
  // 暫定 Tier: rank ベース粗付け (本実装は src/lib/tier-evaluation/score.ts で AI 算出)
  let tier: Tier | null = null;
  if (rank !== null) {
    if (rank <= 20) tier = 'S';
    else if (rank <= 100) tier = 'A';
    else if (rank <= 500) tier = 'B';
    else if (rank <= 2000) tier = 'C';
    else if (rank <= 5000) tier = 'D';
    else tier = 'F';
  }
  return {
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
    rank,
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
    tier,
    tier_score: null,
    tier_updated_at: null,
    is_active: true,
    source: 'coingecko',
    primary_source_id: m.id,
    created_at: m.last_updated ?? new Date().toISOString(),
    updated_at: m.last_updated ?? new Date().toISOString(),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tTier = await getTranslations('tier');

  // ============ Parallel data fetch ============
  const [marketsResult, globalResult, trendingResult] = await Promise.allSettled([
    getMarkets({ page: 1, perPage: 250 }),
    getGlobal(),
    getTrending(),
  ]);

  const marketCoins = marketsResult.status === 'fulfilled' ? marketsResult.value : [];
  const global = globalResult.status === 'fulfilled' ? globalResult.value : null;
  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : null;

  const coins = marketCoins.map(mapMarketCoinToCoin);

  // Top gainers / losers (24h)
  const topGainers = [...coins].filter((c) => c.change_24h !== null).sort((a, b) => (b.change_24h ?? 0) - (a.change_24h ?? 0)).slice(0, 5);
  const topLosers = [...coins].filter((c) => c.change_24h !== null).sort((a, b) => (a.change_24h ?? 0) - (b.change_24h ?? 0)).slice(0, 5);

  return (
    <div className="container py-8 space-y-10">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{t('heroTitle')}</h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl">{t('heroSubtitle')}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/coins">
              {t('ctaPrimary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tools/risk-score">{t('ctaSecondary')}</Link>
          </Button>
        </div>
      </section>

      {/* Global stats */}
      {global && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={<BarChart3 className="h-4 w-4" />}
            label={t('marketCap')}
            value={formatCompact(global.data.total_market_cap.usd)}
            change={global.data.market_cap_change_percentage_24h_usd}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label={t('volume24h')}
            value={formatCompact(global.data.total_volume.usd)}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label={t('btcDominance')}
            value={`${global.data.market_cap_percentage.btc?.toFixed(1)}%`}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label={t('ethDominance')}
            value={`${global.data.market_cap_percentage.eth?.toFixed(1)}%`}
          />
          <StatCard
            icon={<Coins className="h-4 w-4" />}
            label={t('activeCoins')}
            value={global.data.active_cryptocurrencies.toLocaleString()}
          />
        </section>
      )}

      {/* Top gainers / losers / trending — 3 column grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MovementCard title={t('topGainers')} coins={topGainers} icon={<TrendingUp className="h-4 w-4 text-gain" />} />
        <MovementCard title={t('topLosers')} coins={topLosers} icon={<TrendingUp className="h-4 w-4 text-loss rotate-180" />} />
        <TrendingCard title={t('trending')} trending={trending} />
      </section>

      {/* Main coins table */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t('exploreAll')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tTier('explained')} · S / A / B / C / D / F · {tTier('factors.liquidity')} · {tTier('factors.team')} · {tTier('factors.technology')} · {tTier('factors.community')} · {tTier('factors.regulatory')} · {tTier('factors.future')}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/coins">
              View all 37,000+
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <CoinsTable data={coins} pageSize={100} />
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, change }: { icon: React.ReactNode; label: string; value: string; change?: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-1">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        {icon}
      </div>
      <div className="num font-semibold text-base tabular-nums">{value}</div>
      {change !== undefined && (
        <div className={cn('num text-xs', changeColor(change))}>{formatPercent(change)}</div>
      )}
    </div>
  );
}

function MovementCard({ title, coins, icon }: { title: string; coins: Coin[]; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <ul className="space-y-2">
        {coins.map((c) => (
          <li key={c.id}>
            <Link href={`/coin/${c.id}`} className="flex items-center justify-between text-sm hover:bg-accent/50 -mx-2 px-2 py-1 rounded transition-colors">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{c.symbol.toUpperCase()}</span>
                <span className="text-xs text-muted-foreground truncate">{c.name}</span>
              </span>
              <span className={cn('num text-data-xs font-medium shrink-0', changeColor(c.change_24h))}>
                {formatPercent(c.change_24h, 2)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendingCard({ title, trending }: { title: string; trending: Awaited<ReturnType<typeof getTrending>> | null }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-tier-d" />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="text-[10px]">CoinGecko</Badge>
      </div>
      <ul className="space-y-2">
        {trending?.coins.slice(0, 5).map(({ item }) => (
          <li key={item.id}>
            <Link href={`/coin/${item.id}`} className="flex items-center gap-2 text-sm hover:bg-accent/50 -mx-2 px-2 py-1 rounded transition-colors">
              <span className="font-medium">{item.symbol.toUpperCase()}</span>
              <span className="text-xs text-muted-foreground truncate">{item.name}</span>
              {item.market_cap_rank && <span className="ml-auto text-xs text-muted-foreground">#{item.market_cap_rank}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
