/**
 * Homepage — Cointier market overview.
 * Stripe-inspired clean dashboard. Full-width vertical sections, surface cards.
 *
 * Sections:
 *   1. Global stats bar (sticky · layout-level)
 *   2. Page heading
 *   3. Highlight cards (4 KPIs)
 *   4. Top market cap table
 *   5. Trending coins
 *   6. Recently listed
 *   7. Recent funding rounds + upcoming IDO/ICO
 *   8. Top gainers / losers
 *   9. New ATH list
 *   10. Market heatmap
 *   11. Data attribution
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { TrendingUp, TrendingDown, Flame, Sparkles, DollarSign, Calendar, Trophy } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { TradingViewTickerTape } from '@/components/coin/TradingViewTickerTape';
import { TradingViewHeatmap } from '@/components/coin/TradingViewHeatmap';
import { GlobalStatsBar } from '@/components/home/GlobalStatsBar';
import { HighlightCards } from '@/components/home/HighlightCards';
import { Sparkline } from '@/components/coin/Sparkline';
import { TierBadge } from '@/components/coin/TierBadge';
import { getMarketGlobal, getTopMovers } from '@/lib/db/queries';
import { getMarkets, getTrending } from '@/lib/api/coingecko';
import { COIN_NULL_DEFAULTS } from '@/lib/db/coin-defaults';
import { getFearGreed, getEthGasGwei, calcAltcoinSeasonIndex, getTotalUnlocks7d } from '@/lib/api/market-extras';
import { formatPrice, formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';
import type { Coin, Tier } from '@/types/database';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300;

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

  // Parallel server fetch
  const [markets, gainers, losers, global, trending, fearGreed, ethGas, unlocks7d] = await Promise.all([
    getMarkets({ page: 1, perPage: 100, sparkline: true, priceChangePct: ['1h', '24h', '7d', '30d'] }).catch(() => []),
    getTopMovers('gainers', 10).catch(() => []),
    getTopMovers('losers', 10).catch(() => []),
    getMarketGlobal().catch(() => null),
    getTrending().catch(() => null),
    getFearGreed().catch(() => null),
    getEthGasGwei().catch(() => null),
    getTotalUnlocks7d().catch(() => null),
  ]);

  const coins: Coin[] = markets.map((m): Coin => ({
    ...COIN_NULL_DEFAULTS,
    id: m.id, cmc_id: null, cryptorank_id: null,
    symbol: m.symbol, name: m.name,
    chain_id: null, contract_address: null, image_url: m.image,
    website: null, whitepaper_url: null, github_url: null, twitter_url: null, telegram_url: null, discord_url: null,
    rank: m.market_cap_rank ?? null,
    price_usd: m.current_price,
    market_cap_usd: m.market_cap,
    fdv_usd: m.fully_diluted_valuation,
    volume_24h_usd: m.total_volume,
    circulating_supply: m.circulating_supply,
    total_supply: m.total_supply,
    max_supply: m.max_supply,
    ath_usd: m.ath, ath_date: m.ath_date,
    atl_usd: m.atl, atl_date: m.atl_date,
    change_1h: m.price_change_percentage_1h_in_currency ?? null,
    change_24h: m.price_change_percentage_24h,
    change_7d: m.price_change_percentage_7d_in_currency ?? null,
    change_30d: m.price_change_percentage_30d_in_currency ?? null,
    change_1y: null,
    tier: tierFromRank(m.market_cap_rank ?? null),
    tier_score: null, tier_updated_at: null,
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

  const btcCoin = coins.find((c) => c.id === 'bitcoin');
  const altcoinIndex = btcCoin
    ? calcAltcoinSeasonIndex(coins.map((c) => ({ id: c.id, change_30d: c.change_30d })), btcCoin.change_30d)
    : null;

  // Recently listed proxy: rank > 500 (CryptoRank Recently Listed)
  const recentlyListed = coins.filter((c) => (c.rank ?? 0) > 200).slice(0, 8);
  // New ATH proxy: ath_date 直近 30d 内 + 価格が ATH の 95% 以上
  const newAth = coins
    .filter((c) => {
      if (!c.ath_date || !c.ath_usd || !c.price_usd) return false;
      const daysSince = (Date.now() - new Date(c.ath_date).getTime()) / 86_400_000;
      return daysSince < 30 && c.price_usd / c.ath_usd > 0.95;
    })
    .slice(0, 8);

  return (
    <>
      {/* Sticky global market KPI bar */}
      <GlobalStatsBar global={global} ethGasGwei={ethGas} />

      {/* Ticker tape — top movers price stream */}
      <TradingViewTickerTape locale={locale} />

      <div className="container py-6 space-y-8">
        {/* Page heading */}
        <section className="space-y-1.5">
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight">{t('heroTitle')}</h1>
          <p className="text-[13px] text-muted-foreground">{t('heroSubtitle')}</p>
        </section>

        {/* KPI highlight cards */}
        {global && (
          <HighlightCards
            btcDominance={global.btcDominance}
            totalUnlocks7dUsd={unlocks7d ?? undefined}
            altcoinIndex={altcoinIndex ?? undefined}
            fearGreed={fearGreed ?? undefined}
            locale={locale}
          />
        )}

        {/* Top market cap ranking */}
        <section className="surface p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="section-heading">
              {locale === 'ja' ? '時価総額ランキング' : 'Top cryptocurrencies by market cap'}
            </h2>
            <Badge variant="secondary" className="text-[10px]">{coins.length} of 17K+</Badge>
          </div>
          <CoinsTable data={coins} pageSize={50} showPagination sparklineMap={sparklineMap} density="dense" />
        </section>

        {/* Trending coins */}
        {trending && <TrendingSection trending={trending} sparklineMap={sparklineMap} locale={locale} />}

        {/* Recently listed */}
        {recentlyListed.length > 0 && <RecentlyListedSection coins={recentlyListed} sparklineMap={sparklineMap} locale={locale} />}

        {/* Funding rounds + upcoming IDO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FundingRoundsSection locale={locale} />
          <UpcomingIdoSection locale={locale} />
        </div>

        {/* Top gainers / losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MoversSection title={locale === 'ja' ? '値上がり Top 10' : 'Top gainers (24h)'} coins={gainers} sparklineMap={sparklineMap} icon={<TrendingUp className="h-4 w-4 text-gain" />} />
          <MoversSection title={locale === 'ja' ? '値下がり Top 10' : 'Top losers (24h)'} coins={losers} sparklineMap={sparklineMap} icon={<TrendingDown className="h-4 w-4 text-loss" />} />
        </div>

        {/* New ATH */}
        {newAth.length > 0 && <NewAthSection coins={newAth} sparklineMap={sparklineMap} locale={locale} />}

        {/* Market heatmap */}
        <section className="surface p-5 space-y-3">
          <h2 className="section-heading">{locale === 'ja' ? '市場ヒートマップ' : 'Market heatmap'}</h2>
          <TradingViewHeatmap height={460} locale={locale} />
        </section>

        {/* Attribution */}
        <div className="text-[10px] text-muted-foreground/70 text-center pt-6 border-t border-border/50">
          Data: CoinGecko · CryptoRank · DeFiLlama · Hyperliquid · Token Terminal · RootData · LunarCRUSH · alternative.me · beaconcha.in
        </div>
      </div>
    </>
  );
}

/* ===================== Sections ===================== */

function TrendingSection({
  trending,
  sparklineMap,
  locale,
}: {
  trending: NonNullable<Awaited<ReturnType<typeof getTrending>>>;
  sparklineMap: Record<string, number[]>;
  locale: Locale;
}) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  return (
    <section className="surface p-5 space-y-4">
      <h2 className="section-heading flex items-center gap-2">
        <Flame className="h-4 w-4 text-tier-d" />
        {t('トレンド銘柄', 'Trending coins')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {trending.coins.slice(0, 7).map(({ item }) => (
          <Link
            key={item.id}
            href={`/coin/${item.id}`}
            className="rounded-lg border border-border bg-subtle hover:border-primary/40 hover:bg-accent/40 transition-colors p-2.5 space-y-1"
          >
            <div className="flex items-center gap-2">
              {item.thumb && <Image src={item.thumb} alt={item.symbol} width={18} height={18} className="rounded-full" unoptimized />}
              <span className="font-medium uppercase text-[11px]">{item.symbol}</span>
              {item.market_cap_rank && <span className="ml-auto text-[9px] text-muted-foreground">#{item.market_cap_rank}</span>}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">{item.name}</div>
            <Sparkline data={sparklineMap[item.symbol.toLowerCase()] ?? sparklineMap[item.id]} width={120} height={28} strokeWidth={1.2} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentlyListedSection({
  coins,
  sparklineMap,
  locale,
}: {
  coins: Coin[];
  sparklineMap: Record<string, number[]>;
  locale: Locale;
}) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  return (
    <section className="surface p-5 space-y-4">
      <h2 className="section-heading flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-tier-a" />
        {t('新規上場', 'Recently listed')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {coins.map((c) => (
          <Link
            key={c.id}
            href={`/coin/${c.id}`}
            className="rounded-lg border border-border bg-subtle hover:border-primary/40 hover:bg-accent/40 transition-colors p-2.5 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              {c.image_url && <Image src={c.image_url} alt={c.symbol} width={20} height={20} className="rounded-full" unoptimized />}
              <span className="font-medium text-[12px] truncate">{c.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase shrink-0">{c.symbol}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="num font-medium tabular-nums">{formatPrice(c.price_usd)}</span>
              <span className={cn('num tabular-nums', changeColor(c.change_24h))}>{formatPercent(c.change_24h, 1)}</span>
            </div>
            <Sparkline data={sparklineMap[c.symbol.toLowerCase()] ?? sparklineMap[c.id]} width={140} height={28} strokeWidth={1.2} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function MoversSection({
  title,
  coins,
  sparklineMap,
  icon,
}: {
  title: string;
  coins: Coin[];
  sparklineMap: Record<string, number[]>;
  icon: React.ReactNode;
}) {
  return (
    <section className="surface p-5 space-y-3">
      <h2 className="section-heading flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="rounded-lg border border-border bg-subtle divide-y divide-border/70">
        {coins.slice(0, 10).map((c, i) => (
          <Link
            key={c.id}
            href={`/coin/${c.id}`}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 transition-colors text-[12px]"
          >
            <span className="text-muted-foreground text-[10px] w-4 shrink-0">{i + 1}</span>
            {c.image_url && <Image src={c.image_url} alt={c.symbol} width={18} height={18} className="rounded-full shrink-0" unoptimized />}
            <span className="font-medium flex-1 truncate">{c.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{c.symbol}</span>
            <TierBadge tier={c.tier} size="sm" />
            <span className="num tabular-nums text-[11px] w-20 text-right shrink-0">{formatPrice(c.price_usd)}</span>
            <Sparkline data={sparklineMap[c.symbol.toLowerCase()] ?? sparklineMap[c.id]} width={56} height={20} strokeWidth={1.1} withFill={false} />
            <span className={cn('num font-semibold tabular-nums text-[11px] w-14 text-right shrink-0', changeColor(c.change_24h))}>
              {formatPercent(c.change_24h, 1)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewAthSection({
  coins,
  sparklineMap,
  locale,
}: {
  coins: Coin[];
  sparklineMap: Record<string, number[]>;
  locale: Locale;
}) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  return (
    <section className="surface p-5 space-y-4">
      <h2 className="section-heading flex items-center gap-2">
        <Trophy className="h-4 w-4 text-tier-s" />
        {t('新規 ATH (30日)', 'New ATH (30d)')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {coins.map((c) => (
          <Link
            key={c.id}
            href={`/coin/${c.id}`}
            className="rounded-lg border border-tier-s/40 bg-tier-s/5 p-2.5 hover:border-tier-s/70 transition-colors space-y-1.5"
          >
            <div className="flex items-center gap-2">
              {c.image_url && <Image src={c.image_url} alt={c.symbol} width={20} height={20} className="rounded-full" unoptimized />}
              <span className="font-medium text-[12px] truncate">{c.name}</span>
              <Trophy className="h-3 w-3 text-tier-s ml-auto" />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="num font-medium tabular-nums">{formatPrice(c.price_usd)}</span>
              <span className={cn('num tabular-nums', changeColor(c.change_24h))}>{formatPercent(c.change_24h, 1)}</span>
            </div>
            <Sparkline data={sparklineMap[c.symbol.toLowerCase()] ?? sparklineMap[c.id]} width={140} height={28} strokeWidth={1.2} forceColor="gain" />
          </Link>
        ))}
      </div>
    </section>
  );
}

async function FundingRoundsSection({ locale }: { locale: Locale }) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  // Empty-state CTA while ingestion job populates the DB
  return (
    <section className="surface p-5 space-y-3">
      <h2 className="section-heading flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-gain" />
        {t('最近の資金調達', 'Recent funding rounds')}
      </h2>
      <div className="rounded-lg border border-border bg-subtle p-5 text-center text-[12px] text-muted-foreground space-y-1.5">
        <p>{t('CryptoRank + RootData + DeFiLlama Raises 統合中', 'Aggregating CryptoRank + RootData + DeFiLlama Raises')}</p>
        <p className="text-[10px]">{t('ingestion job 完了後に表示', 'Visible after ingestion job runs')}</p>
        <Link href="/vcs" className="inline-block text-primary hover:underline text-[11px] mt-1">
          {t('VC 一覧を見る →', 'See VC list →')}
        </Link>
      </div>
    </section>
  );
}

async function UpcomingIdoSection({ locale }: { locale: Locale }) {
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  return (
    <section className="surface p-5 space-y-3">
      <h2 className="section-heading flex items-center gap-2">
        <Calendar className="h-4 w-4 text-tier-a" />
        {t('IDO カレンダー (今後 30 日)', 'Upcoming IDO/ICO (30d)')}
      </h2>
      <div className="rounded-lg border border-border bg-subtle p-5 text-center text-[12px] text-muted-foreground space-y-1.5">
        <p>{t('CryptoRank Basic API 経由で取得予定', 'Fetched via CryptoRank Basic API')}</p>
        <p className="text-[10px]">{t('ingestion job 完了後に表示', 'Visible after ingestion job runs')}</p>
        <Link href="/ido" className="inline-block text-primary hover:underline text-[11px] mt-1">
          {t('IDO ページ →', 'IDO calendar →')}
        </Link>
      </div>
    </section>
  );
}
