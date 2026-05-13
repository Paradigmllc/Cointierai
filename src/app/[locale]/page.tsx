import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowRight, Flame, TrendingUp, TrendingDown, Sparkles, Lock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { TradingViewTickerTape } from '@/components/coin/TradingViewTickerTape';
import { GlobalStatsBar } from '@/components/home/GlobalStatsBar';
import { HighlightCards } from '@/components/home/HighlightCards';
import { Sparkline } from '@/components/coin/Sparkline';
import { getMarketGlobal, getTopMovers } from '@/lib/db/queries';
import { getMarkets, getTrending } from '@/lib/api/coingecko';
import { COIN_NULL_DEFAULTS } from '@/lib/db/coin-defaults';
import { getFearGreed, getEthGasGwei, calcAltcoinSeasonIndex, getTotalUnlocks7d } from '@/lib/api/market-extras';
import { formatPercent, changeColor, cn } from '@/lib/utils';
import type { Coin, Tier } from '@/types/database';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300; // 5 min ISR

function tierFromRank(rank: number | null): Tier | null {
  if (rank === null) return null;
  if (rank <= 20) return 'S';
  if (rank <= 100) return 'A';
  if (rank <= 500) return 'B';
  if (rank <= 2000) return 'C';
  if (rank <= 5000) return 'D';
  return 'F';
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  // Parallel fetch (CoinGecko with sparkline=true → 1 call で 100 coin + sparkline)
  const [markets, gainers, losers, global, trending, fearGreed, ethGas, unlocks7d] = await Promise.all([
    getMarkets({ page: 1, perPage: 100, sparkline: true, priceChangePct: ['1h', '24h', '7d', '30d'] }).catch(() => []),
    getTopMovers('gainers', 5).catch(() => []),
    getTopMovers('losers', 5).catch(() => []),
    getMarketGlobal().catch(() => null),
    getTrending().catch(() => null),
    getFearGreed().catch(() => null),
    getEthGasGwei().catch(() => null),
    getTotalUnlocks7d().catch(() => null),
  ]);

  // markets → Coin[] + sparkline map
  const coins: Coin[] = markets.map((m): Coin => ({
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
    change_1y: null,
    tier: tierFromRank(m.market_cap_rank ?? null),
    tier_score: null,
    tier_updated_at: null,
    is_active: true,
    source: 'coingecko',
    primary_source_id: m.id,
    created_at: m.last_updated ?? new Date().toISOString(),
    updated_at: m.last_updated ?? new Date().toISOString(),
  }));

  const sparklineMap: Record<string, number[]> = {};
  for (const m of markets) {
    if (m.sparkline_in_7d?.price?.length) {
      sparklineMap[m.symbol.toLowerCase()] = m.sparkline_in_7d.price;
      sparklineMap[m.id] = m.sparkline_in_7d.price;
    }
  }

  // Altcoin Season Index — top 50 coins vs BTC 30d
  const btcCoin = coins.find((c) => c.id === 'bitcoin');
  const altcoinIndex = btcCoin
    ? calcAltcoinSeasonIndex(coins.map((c) => ({ id: c.id, change_30d: c.change_30d })), btcCoin.change_30d)
    : null;

  // Recently listed: rank > 1000 (proxy)
  const recentlyListed = coins.filter((c) => (c.rank ?? 0) > 500).slice(0, 6);

  return (
    <>
      {/* Sticky Global Stats Bar — CryptoRank.io 風 */}
      <GlobalStatsBar global={global} ethGasGwei={ethGas} />

      {/* TradingView Ticker Tape — 主要銘柄 streaming */}
      <TradingViewTickerTape locale={locale} />

      <div className="container py-6 space-y-6">
        {/* Compact Hero (CryptoRank には hero text なし・最小限) */}
        <section className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t('heroTitle')}</h1>
            <p className="text-xs text-muted-foreground max-w-2xl">{t('heroSubtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="default">
              <Link href="/coins">
                {t('ctaPrimary')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/tools/risk-score">{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </section>

        {/* Highlight Cards: BTC Dom / Unlocks / Altcoin Season / Fear & Greed */}
        {global && (
          <HighlightCards
            btcDominance={global.btcDominance}
            totalUnlocks7dUsd={unlocks7d ?? undefined}
            altcoinIndex={altcoinIndex ?? undefined}
            fearGreed={fearGreed ?? undefined}
            locale={locale}
          />
        )}

        {/* Main: Coins Table (left, lg:col-span-9) + Side Panels (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-9 space-y-3">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-semibold">{t('exploreAll')}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  CryptoRank と CMC を超えるアジア発インテリジェンス · {coins.length} 銘柄 (full: 17,000+)
                </p>
              </div>
              <Button asChild variant="ghost" size="xs">
                <Link href="/coins">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CoinsTable data={coins} pageSize={100} showPagination={false} sparklineMap={sparklineMap} density="dense" />
          </section>

          {/* Side Panels — CryptoRank の右カラム再現 */}
          <aside className="lg:col-span-3 space-y-3">
            <SidePanel
              title={t('topGainers')}
              icon={<TrendingUp className="h-3.5 w-3.5 text-gain" />}
              coins={gainers}
              sparklineMap={sparklineMap}
            />
            <SidePanel
              title={t('topLosers')}
              icon={<TrendingDown className="h-3.5 w-3.5 text-loss" />}
              coins={losers}
              sparklineMap={sparklineMap}
            />
            <TrendingPanel trending={trending} sparklineMap={sparklineMap} locale={locale} />
            <RecentlyListedPanel coins={recentlyListed} locale={locale} />
          </aside>
        </div>

        <div className="text-[10px] text-muted-foreground/60 text-right pt-4 border-t border-border/30">
          Data: CoinGecko · CryptoRank · DeFiLlama · Hyperliquid · LunarCRUSH · RootData · Token Terminal · alternative.me ·
          beaconcha.in
        </div>
      </div>
    </>
  );
}

/** SidePanel — Top Gainers/Losers (compact list w/ sparkline) */
function SidePanel({
  title,
  icon,
  coins,
  sparklineMap,
}: {
  title: string;
  icon: React.ReactNode;
  coins: Coin[];
  sparklineMap: Record<string, number[]>;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-2">
      <div className="flex items-center gap-2 pb-1.5 border-b border-border/30">
        {icon}
        <h3 className="font-semibold text-xs">{title}</h3>
      </div>
      <ul className="space-y-1">
        {coins.slice(0, 5).map((c) => (
          <li key={c.id}>
            <Link href={`/coin/${c.id}`} className="flex items-center justify-between text-[11px] hover:bg-accent/40 -mx-1.5 px-1.5 py-1 rounded transition-colors">
              <span className="font-medium text-foreground truncate flex-1 mr-2">{c.name}</span>
              <Sparkline data={sparklineMap[c.symbol.toLowerCase()] ?? sparklineMap[c.id]} width={36} height={16} strokeWidth={1} withFill={false} />
              <span className={cn('num font-medium tabular-nums text-[10px] ml-2 shrink-0 w-12 text-right', changeColor(c.change_24h))}>
                {formatPercent(c.change_24h, 1)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendingPanel({
  trending,
  sparklineMap,
  locale,
}: {
  trending: Awaited<ReturnType<typeof getTrending>> | null;
  sparklineMap: Record<string, number[]>;
  locale: Locale;
}) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  if (!trending?.coins?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
        <span className="inline-flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-tier-d" />
          <h3 className="font-semibold text-xs">{t('トレンド', 'Trending')}</h3>
        </span>
        <Badge variant="secondary" className="text-[9px] py-0">CoinGecko</Badge>
      </div>
      <ul className="space-y-1">
        {trending.coins.slice(0, 7).map(({ item }) => (
          <li key={item.id}>
            <Link href={`/coin/${item.id}`} className="flex items-center gap-1.5 text-[11px] hover:bg-accent/40 -mx-1.5 px-1.5 py-1 rounded transition-colors">
              <span className="font-medium uppercase shrink-0">{item.symbol}</span>
              <span className="text-muted-foreground truncate flex-1">{item.name}</span>
              <Sparkline data={sparklineMap[item.symbol.toLowerCase()] ?? sparklineMap[item.id]} width={36} height={16} strokeWidth={1} withFill={false} />
              {item.market_cap_rank && <span className="text-muted-foreground text-[9px] shrink-0">#{item.market_cap_rank}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentlyListedPanel({ coins, locale }: { coins: Coin[]; locale: Locale }) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  if (!coins.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-2">
      <div className="flex items-center gap-2 pb-1.5 border-b border-border/30">
        <Sparkles className="h-3.5 w-3.5 text-tier-a" />
        <h3 className="font-semibold text-xs">{t('新規上場', 'Recently Listed')}</h3>
      </div>
      <ul className="space-y-1">
        {coins.slice(0, 5).map((c) => (
          <li key={c.id}>
            <Link href={`/coin/${c.id}`} className="flex items-center gap-2 text-[11px] hover:bg-accent/40 -mx-1.5 px-1.5 py-1 rounded transition-colors">
              <span className="font-medium uppercase shrink-0">{c.symbol}</span>
              <span className="text-muted-foreground truncate flex-1">{c.name}</span>
              {c.rank && <span className="text-muted-foreground text-[9px] shrink-0">#{c.rank}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
