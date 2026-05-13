import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowRight, TrendingUp, Activity, Coins, BarChart3, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { TradingViewTickerTape } from '@/components/coin/TradingViewTickerTape';
import { TradingViewHeatmap } from '@/components/coin/TradingViewHeatmap';
import { getTopCoins, getMarketGlobal, getTopMovers } from '@/lib/db/queries';
import { getTrending } from '@/lib/api/coingecko';
import { formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';
import type { Coin } from '@/types/database';
import type { Locale } from '@/i18n/routing';

export const revalidate = 300; // 5 min ISR

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('home');
  const tTier = await getTranslations('tier');

  // Parallel data fetch (DB-first, CoinGecko fallback inside queries)
  const [coins, gainers, losers, global, trending] = await Promise.all([
    getTopCoins({ limit: 250 }),
    getTopMovers('gainers', 5),
    getTopMovers('losers', 5),
    getMarketGlobal(),
    getTrending().catch(() => null),
  ]);

  return (
    <>
      {/* TradingView Ticker Tape — CryptoRank/CMC 風流れる価格表示 */}
      <TradingViewTickerTape locale={locale} />

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
            value={formatCompact(global.totalMarketCapUsd)}
            change={global.marketCapChange24h}
          />
          <StatCard icon={<Activity className="h-4 w-4" />} label={t('volume24h')} value={formatCompact(global.totalVolume24hUsd)} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label={t('btcDominance')} value={`${global.btcDominance.toFixed(1)}%`} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label={t('ethDominance')} value={`${global.ethDominance.toFixed(1)}%`} />
          <StatCard icon={<Coins className="h-4 w-4" />} label={t('activeCoins')} value={global.activeCoins.toLocaleString()} />
        </section>
      )}

      {/* Top gainers / losers / trending */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MovementCard title={t('topGainers')} coins={gainers} icon={<TrendingUp className="h-4 w-4 text-gain" />} />
        <MovementCard title={t('topLosers')} coins={losers} icon={<TrendingUp className="h-4 w-4 text-loss rotate-180" />} />
        <TrendingCard title={t('trending')} trending={trending} />
      </section>

      {/* Main coins table */}
      <section className="space-y-3">
        <div className="flex items-end justify-between flex-wrap gap-2">
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

      {/* TradingView Heatmap — CryptoRank にない要素・市場全体 sentiment 可視化 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-tier-d" />
            {locale === 'ja' ? '市場ヒートマップ' : 'Market Heatmap'}
          </h2>
          <Badge variant="secondary" className="text-[10px]">Powered by TradingView</Badge>
        </div>
        <TradingViewHeatmap height={500} locale={locale} />
      </section>
      </div>
    </>
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
      {change !== undefined && <div className={cn('num text-xs', changeColor(change))}>{formatPercent(change)}</div>}
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
              <span className={cn('num text-data-xs font-medium shrink-0', changeColor(c.change_24h))}>{formatPercent(c.change_24h, 2)}</span>
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
