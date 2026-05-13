/**
 * /coin/[symbol] — Cointier coin detail page.
 *
 * Layout:
 *   1. Hero: large logo · name · symbol · rank · watchlist
 *   2. CTA buttons: Add alert · Buy
 *   3. Price · 24h change · 24h range slider
 *   4. Tabs: Overview · Markets · Analytics · Historical · News
 *   5. 2-column body:
 *      Left (2/3): General info · Description · Links · Chart · Multi-source signals · Funding · Unlocks
 *      Right (1/3): Sticky price-statistics card
 *
 * Cointier-specific: unified signal tab · JP exchange CTAs · Polymarket · Pro gating
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import {
  Globe, FileText, Github, Twitter, Send, Activity, TrendingUp, Users, AlertTriangle, Layers, BarChart3,
  Star, Bell, ShoppingCart, Share2, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/coin/TierBadge';
import { JpExchanges } from '@/components/coin/JpExchanges';
import { ProGateBlur } from '@/components/coin/ProGateBlur';
import { PolymarketMarkets } from '@/components/coin/PolymarketMarkets';
import { CoinChartSmart } from '@/components/coin/CoinChartSmart';
import { PriceRangeSlider } from '@/components/coin/PriceRangeSlider';
import { CoinDetailTabs } from '@/components/coin/CoinDetailTabs';
import { getFullCoin, getSourceCoverage } from '@/lib/db/coin-aggregate';
import { getCoin as getCoinFallback } from '@/lib/db/queries';
import { coinLd, breadcrumbLd, faqLd, ldScript } from '@/lib/seo/jsonld';
import { formatPrice, formatCompact, formatPercent, formatSupply, changeColor, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';
export const revalidate = 600;

interface PageProps {
  params: Promise<{ locale: string; symbol: string }>;
}

export default async function CoinDetailPage({ params }: PageProps) {
  const { locale: localeStr, symbol } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const t = await getTranslations('coin');
  const tCommon = await getTranslations('common');

  let coin = await getFullCoin(symbol, locale);
  if (!coin) {
    const fb = await getCoinFallback(symbol);
    if (!fb) notFound();
    coin = {
      ...fb.coin,
      summary: fb.summary,
      description: null,
      recent_funding_rounds: [],
      upcoming_unlocks: [],
      hack_history: [],
      exchange_listings: [],
      latest_tier_evaluation: null,
    };
  }

  const summary = coin.summary;
  const coverage = getSourceCoverage(coin);
  const tt = (ja: string, en: string) => (locale === 'ja' ? ja : en);

  // Price Range 24H — coin object に 24h low/high が直接ない場合、ATH/ATL 距離計算で代用しない (本家は厳密 24h)
  // CoinGecko market endpoint は high_24h/low_24h を返すが detail 取得時は market_data 経由
  const high24h = coin.ath_usd; // approximate fallback; ideal 24h は ingestion で別途取得
  const low24h = coin.atl_usd;
  const currentPrice = coin.price_usd;

  return (
    <div className="container py-4 space-y-4 md:space-y-6">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
        coinLd(coin, locale, summary),
        breadcrumbLd([
          { name: tCommon('siteName'), url: `/${locale}` },
          { name: 'Coins', url: `/${locale}/coins` },
          { name: coin.name, url: `/${locale}/coin/${coin.id}` },
        ]),
        coin.tier && faqLd([
          {
            question: locale === 'ja' ? `${coin.name} の Tier はなぜ ${coin.tier} ですか?` : `Why is ${coin.name} rated Tier ${coin.tier}?`,
            answer: summary ?? `Cointier Tier ${coin.tier} is calculated by AI across 6 axes: liquidity, team, technology, community, regulatory, future potential.`,
          },
        ]),
      ].filter(Boolean))} />

      {/* ============== HERO BLOCK ============== */}
      <section className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* Left: large logo + name + meta */}
        <div className="flex items-center gap-4 md:gap-5">
          {coin.image_url ? (
            <Image
              src={coin.image_url}
              alt={coin.symbol}
              width={96}
              height={96}
              className="rounded-full w-16 h-16 md:w-24 md:h-24 shrink-0"
              unoptimized
            />
          ) : (
            <div className="rounded-full w-16 h-16 md:w-24 md:h-24 bg-muted shrink-0" />
          )}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{coin.name}</h1>
              <span className="text-base md:text-lg text-muted-foreground uppercase font-medium">{coin.symbol}</span>
              {coin.tier && <TierBadge tier={coin.tier} size="sm" />}
              {coin.hl_listed && (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                  <Zap className="h-2.5 w-2.5 mr-1" />Hyperliquid
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap">
              {coin.rank && <span><b className="text-foreground font-semibold">Rank:</b> #{coin.rank}</span>}
              <span><b className="text-foreground font-semibold">{coverage.length}</b> {tt('データソース', 'data sources')}</span>
              <button className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                <Star className="h-3 w-3" /> {tt('ウォッチリスト追加', 'Add to Watchlist')}
              </button>
            </div>
          </div>
        </div>

        {/* Right: action buttons + price + range slider */}
        <div className="md:ml-auto flex flex-col gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              {tt('アラート', 'Add Alert')}
            </Button>
            <Button size="sm" className="gap-1.5" asChild>
              <Link href={`/go/bingx?coin=${coin.symbol}&locale=${locale}`}>
                <ShoppingCart className="h-3.5 w-3.5" />
                {tt(`${coin.symbol.toUpperCase()} を購入`, `Buy ${coin.symbol.toUpperCase()}`)}
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" aria-label="Share">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-end justify-between md:justify-end gap-4 md:gap-6">
            <div className="text-right">
              <div className="num text-2xl md:text-3xl font-bold tabular-nums leading-none">{formatPrice(currentPrice)}</div>
              <div className="text-[11px] mt-1.5 flex items-center justify-end gap-2">
                <span className={cn('num font-semibold', changeColor(coin.change_24h))}>{formatPercent(coin.change_24h)} <span className="text-muted-foreground text-[10px] font-normal">24H</span></span>
                {coin.change_7d != null && (
                  <span className={cn('num font-semibold', changeColor(coin.change_7d))}>{formatPercent(coin.change_7d)} <span className="text-muted-foreground text-[10px] font-normal">7D</span></span>
                )}
              </div>
            </div>
          </div>
          {low24h && high24h && currentPrice && (
            <PriceRangeSlider low={low24h} high={high24h} current={currentPrice} label="ATL→ATH" />
          )}
        </div>
      </section>

      {/* Tabs */}
      <CoinDetailTabs locale={locale} />

      {/* ============== 2-COLUMN BODY (md+ split / mobile stack) ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* ====== LEFT (2/3) ====== */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 min-w-0">
          {/* General Info / Links */}
          <section className="rounded-lg border border-border/60 bg-card/40 p-4 md:p-5 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {tt('一般情報', 'General Info')}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
              {coin.website && <CoinLink href={coin.website} icon={<Globe className="h-3.5 w-3.5" />} label="Website" />}
              {coin.twitter_url && <CoinLink href={coin.twitter_url} icon={<Twitter className="h-3.5 w-3.5" />} label="Twitter" />}
              {coin.github_url && <CoinLink href={coin.github_url} icon={<Github className="h-3.5 w-3.5" />} label="GitHub" />}
              {coin.telegram_url && <CoinLink href={coin.telegram_url} icon={<Send className="h-3.5 w-3.5" />} label="Telegram" />}
              {coin.whitepaper_url && <CoinLink href={coin.whitepaper_url} icon={<FileText className="h-3.5 w-3.5" />} label="Whitepaper" />}
            </div>
            {coin.defillama_category && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground">{tt('カテゴリ', 'Category')}:</span>
                <Badge variant="secondary" className="text-[10px]">{coin.defillama_category}</Badge>
              </div>
            )}
          </section>

          {/* AI Description */}
          {summary && (
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                <span className="text-primary">{tt('AI 分析', 'AI Analysis')}</span>
                <Badge variant="secondary" className="text-[9px] py-0">DeepSeek V4 Pro</Badge>
                <Badge variant="outline" className="text-[9px] py-0">{coverage.length} sources</Badge>
              </h2>
              <p className="text-[13px] leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Chart */}
          <section className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {coin.name} ({coin.symbol.toUpperCase()}) {tt('チャート', 'Chart')}
              </h2>
              <Button variant="ghost" size="xs" className="gap-1">
                <Share2 className="h-3 w-3" />Share
              </Button>
            </div>
            <CoinChartSmart symbol={coin.symbol} coinId={coin.id} locale={locale} height={420} />
          </section>

          {/* Multi-source signals */}
          <section className="space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {tt('全データソース統合シグナル', 'Multi-source Aggregated Signals')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coin.defillama_tvl_usd && (
                <SignalCard
                  icon={<BarChart3 className="h-4 w-4 text-primary" />}
                  source="DeFiLlama"
                  items={[
                    { label: 'TVL', value: formatCompact(coin.defillama_tvl_usd) },
                    { label: 'TVL 7d', value: formatPercent(coin.defillama_tvl_change_7d) },
                    ...(coin.defillama_category ? [{ label: 'Category', value: coin.defillama_category }] : []),
                  ]}
                />
              )}
              {(coin.tt_revenue_30d_usd || coin.tt_pe_ratio) && (
                <SignalCard
                  icon={<TrendingUp className="h-4 w-4 text-gain" />}
                  source="Token Terminal"
                  items={[
                    { label: 'Revenue 30d', value: coin.tt_revenue_30d_usd ? formatCompact(coin.tt_revenue_30d_usd) : '—' },
                    { label: 'P/E', value: coin.tt_pe_ratio ? coin.tt_pe_ratio.toFixed(2) : '—' },
                    { label: 'P/S', value: coin.tt_ps_ratio ? coin.tt_ps_ratio.toFixed(2) : '—' },
                  ]}
                />
              )}
              {coin.lc_galaxy_score && (
                <SignalCard
                  icon={<Users className="h-4 w-4 text-tier-d" />}
                  source="LunarCRUSH"
                  items={[
                    { label: 'Galaxy Score', value: `${coin.lc_galaxy_score.toFixed(0)} / 100` },
                    { label: 'Alt Rank', value: coin.lc_alt_rank ? `#${coin.lc_alt_rank}` : '—' },
                  ]}
                />
              )}
              {coin.hl_listed && (
                <SignalCard
                  icon={<Activity className="h-4 w-4 text-primary" />}
                  source="Hyperliquid Perps"
                  items={[
                    { label: 'Mark Price', value: formatPrice(coin.hl_mark_price) },
                    { label: 'OI', value: formatCompact(coin.hl_open_interest_usd) },
                    { label: 'Max Lev', value: coin.hl_max_leverage ? `${coin.hl_max_leverage}×` : '—' },
                  ]}
                />
              )}
              {coin.dex_total_liquidity_usd && (
                <SignalCard
                  icon={<BarChart3 className="h-4 w-4 text-gain" />}
                  source="DEXScreener"
                  items={[
                    { label: 'Liquidity', value: formatCompact(coin.dex_total_liquidity_usd) },
                    { label: 'Pairs', value: coin.dex_pair_count?.toString() ?? '—' },
                  ]}
                />
              )}
              {coin.funding_total_usd && (
                <SignalCard
                  icon={<TrendingUp className="h-4 w-4 text-primary" />}
                  source="Funding"
                  items={[
                    { label: 'Total raised', value: formatCompact(coin.funding_total_usd) },
                    { label: 'Rounds', value: coin.funding_round_count?.toString() ?? '0' },
                  ]}
                />
              )}
              {coin.hack_count > 0 && (
                <SignalCard
                  icon={<AlertTriangle className="h-4 w-4 text-loss" />}
                  source="Hack History"
                  items={[
                    { label: 'Hacks', value: coin.hack_count.toString() },
                    { label: 'Total lost', value: formatCompact(coin.hack_total_lost_usd) },
                  ]}
                  variant="warning"
                />
              )}
            </div>
          </section>

          {/* Funding rounds (with Pro gate) */}
          {coin.recent_funding_rounds.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">{t('fundingRounds')}</h2>
              <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>{t('date')}</th><th>{t('round')}</th><th>Amount</th><th>{t('valuation')}</th><th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coin.recent_funding_rounds.slice(0, 3).map((r, i) => (
                      <tr key={`${r.date}-${i}`}>
                        <td className="text-muted-foreground text-[10px]">{r.date}</td>
                        <td className="text-[11px]">{r.round_type ?? '—'}</td>
                        <td className="num text-[11px]">{formatCompact(r.amount_usd)}</td>
                        <td className="num text-[11px]">{formatCompact(r.valuation_usd)}</td>
                        <td className="text-[10px] text-muted-foreground">{r.source ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {coin.recent_funding_rounds.length > 3 && (
                <ProGateBlur
                  totalCount={coin.recent_funding_rounds.length}
                  visibleCount={3}
                  feature="vc-investors"
                  locale={locale}
                />
              )}
            </section>
          )}

          {/* Unlocks (with Pro gate) */}
          {coin.upcoming_unlocks.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">{t('tokenUnlocks')}</h2>
              <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
                <table className="data-table w-full">
                  <thead>
                    <tr><th>{t('date')}</th><th>Amount</th><th>% Supply</th><th>{t('category')}</th></tr>
                  </thead>
                  <tbody>
                    {coin.upcoming_unlocks
                      .filter((u) => new Date(u.unlock_date).getTime() < Date.now() + 7 * 86_400_000)
                      .slice(0, 10)
                      .map((u, i) => (
                        <tr key={`${u.unlock_date}-${i}`}>
                          <td className="text-muted-foreground text-[10px]">{u.unlock_date.slice(0, 10)}</td>
                          <td className="num text-[11px]">{formatSupply(u.amount, coin.symbol.toUpperCase())}</td>
                          <td className="num text-[11px]">{u.percentage_of_supply ? `${u.percentage_of_supply.toFixed(2)}%` : '—'}</td>
                          <td className="text-[10px]">{u.category ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {coin.upcoming_unlocks.length > 0 && (
                <ProGateBlur
                  totalCount={coin.upcoming_unlocks.length}
                  visibleCount={coin.upcoming_unlocks.filter((u) => new Date(u.unlock_date).getTime() < Date.now() + 7 * 86_400_000).length}
                  feature="unlocks"
                  locale={locale}
                />
              )}
            </section>
          )}

          {/* JP Exchanges */}
          {locale === 'ja' && <JpExchanges coin={coin} />}

          {/* Polymarket */}
          <PolymarketMarkets symbol={coin.symbol} name={coin.name} locale={locale} />
        </div>

        {/* ====== RIGHT (1/3) — Price Statistics (sticky) ====== */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <section className="rounded-lg border border-border/60 bg-card/40 p-4 md:p-5 space-y-3">
              <h2 className="text-sm font-semibold">{coin.name} {tt('価格統計', 'Price Statistics')}</h2>
              <div className="space-y-2 text-[12px]">
                <StatRow label="Market Cap" value={formatCompact(coin.market_cap_usd)} />
                <StatRow label="FDV" value={formatCompact(coin.fdv_usd)} />
                <StatRow label="24h Volume" value={formatCompact(coin.volume_24h_usd)} />
                <StatRow label="Vol / MCap" value={coin.volume_24h_usd && coin.market_cap_usd ? (coin.volume_24h_usd / coin.market_cap_usd).toFixed(4) : '—'} />
                <Separator />
                <StatRow label={tt('循環供給', 'Circulating')} value={formatSupply(coin.circulating_supply, coin.symbol.toUpperCase())} />
                <StatRow label={tt('総供給', 'Total Supply')} value={formatSupply(coin.total_supply, coin.symbol.toUpperCase())} />
                <StatRow label={tt('最大供給', 'Max Supply')} value={coin.max_supply ? formatSupply(coin.max_supply, coin.symbol.toUpperCase()) : '∞'} />
                {coin.circulating_supply && coin.max_supply && (
                  <StatRow label={tt('流通率', 'Circulating %')} value={`${((coin.circulating_supply / coin.max_supply) * 100).toFixed(2)}%`} />
                )}
                <Separator />
                <StatRow label="ATH" value={formatPrice(coin.ath_usd)} />
                <StatRow
                  label={tt('ATH からの距離', 'From ATH')}
                  value={coin.ath_usd && coin.price_usd ? `-${(((coin.ath_usd - coin.price_usd) / coin.ath_usd) * 100).toFixed(1)}%` : '—'}
                  valueClass="text-loss"
                />
                {coin.ath_date && <StatRow label={tt('ATH 日付', 'ATH Date')} value={coin.ath_date.slice(0, 10)} />}
                <StatRow label="ATL" value={formatPrice(coin.atl_usd)} />
                {coin.atl_date && <StatRow label={tt('ATL 日付', 'ATL Date')} value={coin.atl_date.slice(0, 10)} />}
              </div>
            </section>

            {coin.tier && (
              <section className="rounded-lg border border-tier-s/30 bg-tier-s/5 p-4 md:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{tt('Cointier 評価', 'Cointier Rating')}</h2>
                  <TierBadge tier={coin.tier} size="md" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t('tierExplanation')}</p>
                <Link href={`/${locale}/tier/${coin.tier.toLowerCase()}`} className="text-[11px] text-primary hover:underline inline-block">
                  Tier {coin.tier} {tt('全銘柄を見る →', 'all coins →')}
                </Link>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============ Helpers ============ */

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className={cn('num font-medium tabular-nums text-[12px]', valueClass)}>{value}</span>
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-border/40 my-1" />;
}

function CoinLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
      {icon}{label}
    </a>
  );
}

function SignalCard({
  icon,
  source,
  items,
  variant,
}: {
  icon: React.ReactNode;
  source: string;
  items: Array<{ label: string; value: string }>;
  variant?: 'warning';
}) {
  return (
    <div className={cn(
      'rounded-lg border bg-card/30 p-3 space-y-2',
      variant === 'warning' ? 'border-loss/30' : 'border-border/60',
    )}>
      <div className="flex items-center gap-2 text-[11px] font-medium">
        {icon}
        <span>{source}</span>
      </div>
      <div className="space-y-1">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="num font-medium tabular-nums">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeStr, symbol } = await params;
  const locale = localeStr as Locale;
  const coin = await getFullCoin(symbol, locale);
  if (!coin) {
    const fb = await getCoinFallback(symbol);
    if (!fb) return { title: 'Not found' };
    const t = await getTranslations({ locale, namespace: 'metadata' });
    return {
      title: `${fb.coin.name} (${fb.coin.symbol.toUpperCase()}) Price`,
      description: t('description'),
      alternates: {
        canonical: `${SITE_URL}/${locale}/coin/${fb.coin.id}`,
      },
    };
  }
  return {
    title: `${coin.name} (${coin.symbol.toUpperCase()}) Price · Tier ${coin.tier ?? '—'}`,
    description: coin.summary ?? `${coin.name} price, market cap, VC funding, token unlocks, and AI-powered analysis from Cointier.`,
    alternates: {
      canonical: `${SITE_URL}/${locale}/coin/${coin.id}`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/coin/${coin.id}`])),
    },
  };
}
