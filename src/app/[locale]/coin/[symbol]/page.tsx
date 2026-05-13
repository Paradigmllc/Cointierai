import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Globe, FileText, Github, Twitter, Send, Activity, TrendingUp, Users, AlertTriangle, Layers, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TierBadge } from '@/components/coin/TierBadge';
import { JpExchanges } from '@/components/coin/JpExchanges';
import { ProGateBlur } from '@/components/coin/ProGateBlur';
import { PolymarketMarkets } from '@/components/coin/PolymarketMarkets';
import { getFullCoin, getSourceCoverage } from '@/lib/db/coin-aggregate';
import { getCoin as getCoinFallback } from '@/lib/db/queries';
import { coinLd, breadcrumbLd, faqLd, ldScript } from '@/lib/seo/jsonld';
import { formatPrice, formatCompact, formatPercent, formatSupply, changeColor, cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 600;

interface PageProps {
  params: Promise<{ locale: Locale; symbol: string }>;
}

export default async function CoinDetailPage({ params }: PageProps) {
  const { locale, symbol } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('coin');
  const tCommon = await getTranslations('common');
  const tTier = await getTranslations('tier');

  // DB から full aggregated record を取得 (CoinGecko fallback あり)
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

  return (
    <div className="container py-8 space-y-8">
      {/* JSON-LD for SEO/GEO */}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4">
          {coin.image_url && <Image src={coin.image_url} alt={coin.symbol} width={64} height={64} className="rounded-full" unoptimized />}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{coin.name}</h1>
              <Badge variant="secondary" className="uppercase">{coin.symbol}</Badge>
              {coin.rank && <Badge variant="outline">#{coin.rank}</Badge>}
              <TierBadge tier={coin.tier} size="md" />
              {coin.hl_listed && <Badge className="bg-primary/20 text-primary border-primary/40">⚡ Hyperliquid</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{t('tierExplanation')}</p>
          </div>
        </div>
        <div className="md:ml-auto text-right space-y-1">
          <div className="text-3xl font-bold num tabular-nums">{formatPrice(coin.price_usd)}</div>
          <div className={cn('text-sm font-medium num', changeColor(coin.change_24h))}>{formatPercent(coin.change_24h)} (24h)</div>
          {coin.change_7d != null && <div className={cn('text-xs num', changeColor(coin.change_7d))}>{formatPercent(coin.change_7d)} (7d)</div>}
        </div>
      </div>

      {/* TradingView Advanced Chart — CryptoRank / CMC を超える UI */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {locale === 'ja' ? '価格チャート' : 'Price Chart'}
          </h2>
          <Badge variant="secondary" className="text-[10px]">Powered by TradingView</Badge>
        </div>
        <TradingViewChart symbol={coin.symbol} locale={locale} height={500} />
      </section>

      <Separator />

      {/* AI Summary (中立教育者) */}
      {summary && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h2 className="font-semibold text-sm flex items-center gap-2 flex-wrap">
            <span className="text-primary">{t('aiAnalysis')}</span>
            <Badge variant="secondary" className="text-[10px]">DeepSeek V4 Pro · {locale}</Badge>
            {coverage.length > 0 && (
              <Badge variant="outline" className="text-[10px] ml-auto">
                {coverage.length} sources merged
              </Badge>
            )}
          </h2>
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      <Separator />

      {/* Key metrics grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Market Cap" value={formatCompact(coin.market_cap_usd)} />
        <MetricCard label="FDV" value={formatCompact(coin.fdv_usd)} />
        <MetricCard label="24h Volume" value={formatCompact(coin.volume_24h_usd)} />
        <MetricCard label="Tier Score" value={coin.tier_score ? coin.tier_score.toFixed(1) : '—'} />
        <MetricCard label="Circulating" value={formatSupply(coin.circulating_supply, coin.symbol.toUpperCase())} />
        <MetricCard label="Total Supply" value={formatSupply(coin.total_supply, coin.symbol.toUpperCase())} />
        <MetricCard label="Max Supply" value={coin.max_supply ? formatSupply(coin.max_supply, coin.symbol.toUpperCase()) : '∞'} />
        <MetricCard label="ATH" value={formatPrice(coin.ath_usd)} />
      </section>

      {/* Multi-source signals grid (新規・集約 DB の核) */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          {locale === 'ja' ? '全データソース統合シグナル' : 'Multi-source Aggregated Signals'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* DeFiLlama */}
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

          {/* Token Terminal */}
          {(coin.tt_revenue_30d_usd || coin.tt_pe_ratio) && (
            <SignalCard
              icon={<TrendingUp className="h-4 w-4 text-gain" />}
              source="Token Terminal"
              items={[
                { label: 'Revenue 30d', value: coin.tt_revenue_30d_usd ? formatCompact(coin.tt_revenue_30d_usd) : '—' },
                { label: 'P/E ratio', value: coin.tt_pe_ratio ? coin.tt_pe_ratio.toFixed(2) : '—' },
                { label: 'P/S ratio', value: coin.tt_ps_ratio ? coin.tt_ps_ratio.toFixed(2) : '—' },
              ]}
            />
          )}

          {/* LunarCRUSH */}
          {coin.lc_galaxy_score && (
            <SignalCard
              icon={<Users className="h-4 w-4 text-tier-d" />}
              source="LunarCRUSH"
              items={[
                { label: 'Galaxy Score', value: `${coin.lc_galaxy_score.toFixed(0)} / 100` },
                { label: 'Alt Rank', value: coin.lc_alt_rank ? `#${coin.lc_alt_rank}` : '—' },
                { label: 'Sentiment', value: coin.lc_sentiment ? `${coin.lc_sentiment.toFixed(2)} / 5` : '—' },
              ]}
            />
          )}

          {/* Hyperliquid */}
          {coin.hl_listed && (
            <SignalCard
              icon={<Activity className="h-4 w-4 text-primary" />}
              source="Hyperliquid Perps"
              items={[
                { label: 'Mark Price', value: formatPrice(coin.hl_mark_price) },
                { label: 'Open Interest', value: formatCompact(coin.hl_open_interest_usd) },
                { label: 'Funding (1h)', value: coin.hl_funding_rate ? `${(coin.hl_funding_rate * 100).toFixed(4)}%` : '—' },
                { label: 'Max leverage', value: coin.hl_max_leverage ? `${coin.hl_max_leverage}×` : '—' },
              ]}
            />
          )}

          {/* DEXScreener */}
          {coin.dex_total_liquidity_usd && (
            <SignalCard
              icon={<BarChart3 className="h-4 w-4 text-gain" />}
              source="DEXScreener"
              items={[
                { label: 'Total Liquidity', value: formatCompact(coin.dex_total_liquidity_usd) },
                { label: 'Pair count', value: coin.dex_pair_count?.toString() ?? '—' },
                { label: 'Top chain', value: coin.dex_top_pair_chain ?? '—' },
              ]}
            />
          )}

          {/* VC Funding aggregate */}
          {coin.funding_total_usd && (
            <SignalCard
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              source="Funding (DeFiLlama + CryptoRank)"
              items={[
                { label: 'Total raised', value: formatCompact(coin.funding_total_usd) },
                { label: 'Rounds', value: coin.funding_round_count?.toString() ?? '0' },
                { label: 'Latest', value: coin.funding_latest_round ?? '—' },
              ]}
            />
          )}

          {/* Community (CoinGecko) */}
          {(coin.github_stars || coin.twitter_followers) && (
            <SignalCard
              icon={<Users className="h-4 w-4 text-tier-d" />}
              source="Community"
              items={[
                ...(coin.github_stars ? [{ label: 'GitHub stars', value: coin.github_stars.toLocaleString() }] : []),
                ...(coin.twitter_followers ? [{ label: 'Twitter', value: coin.twitter_followers.toLocaleString() }] : []),
                ...(coin.reddit_subscribers ? [{ label: 'Reddit', value: coin.reddit_subscribers.toLocaleString() }] : []),
              ]}
            />
          )}

          {/* Hack history */}
          {coin.hack_count > 0 && (
            <SignalCard
              icon={<AlertTriangle className="h-4 w-4 text-loss" />}
              source="Hack History (DeFiLlama)"
              items={[
                { label: 'Hacks', value: coin.hack_count.toString() },
                { label: 'Total lost', value: formatCompact(coin.hack_total_lost_usd) },
              ]}
              variant="warning"
            />
          )}
        </div>
      </section>

      {/* Funding rounds detail */}
      {coin.recent_funding_rounds.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('fundingRounds')}</h2>
          <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
            <table className="data-table">
              <thead>
                <tr><th>{t('date')}</th><th>{t('round')}</th><th>Amount</th><th>{t('valuation')}</th><th>Source</th></tr>
              </thead>
              <tbody>
                {/* Free: 上位 3 件のみ — Notion L1959-1962 */}
                {coin.recent_funding_rounds.slice(0, 3).map((r, i) => (
                  <tr key={`${r.date}-${i}`}>
                    <td className="text-muted-foreground text-data-xs">{r.date}</td>
                    <td>{r.round_type ?? '—'}</td>
                    <td className="num">{formatCompact(r.amount_usd)}</td>
                    <td className="num">{formatCompact(r.valuation_usd)}</td>
                    <td className="text-data-xs text-muted-foreground">{r.source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Free→Pro 転換壁① — 残り N 件ぼかし */}
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

      {/* 🇯🇵 国内取引所マッピング — 日本特化最強差別化 (locale=ja のみ) */}
      {locale === 'ja' && <JpExchanges coin={coin} />}

      {/* Polymarket 関連予測マーケット — M1 表示のみ (規制対応・賭博罪回避) */}
      <PolymarketMarkets symbol={coin.symbol} name={coin.name} locale={locale} />

      {/* Upcoming unlocks */}
      {coin.upcoming_unlocks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('tokenUnlocks')}</h2>
          <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
            <table className="data-table">
              <thead>
                <tr><th>{t('date')}</th><th>Amount</th><th>% Supply</th><th>{t('category')}</th></tr>
              </thead>
              <tbody>
                {/* Free: 直近 7 日のみ — Notion L1888 */}
                {coin.upcoming_unlocks
                  .filter((u) => new Date(u.unlock_date).getTime() < Date.now() + 7 * 86_400_000)
                  .slice(0, 10)
                  .map((u, i) => (
                    <tr key={`${u.unlock_date}-${i}`}>
                      <td className="text-muted-foreground text-data-xs">{u.unlock_date.slice(0, 10)}</td>
                      <td className="num">{formatSupply(u.amount, coin.symbol.toUpperCase())}</td>
                      <td className="num">{u.percentage_of_supply ? `${u.percentage_of_supply.toFixed(2)}%` : '—'}</td>
                      <td className="text-data-xs">{u.category ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Free→Pro 転換壁② — アンロックアラート Pro 限定 */}
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

      {/* 2-column: Description + Links */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold">{t('overview')}</h2>
          {coin.description ? (
            <div className="prose prose-invert max-w-none text-sm prose-a:text-primary" dangerouslySetInnerHTML={{ __html: coin.description }} />
          ) : summary ? (
            <p className="text-sm leading-relaxed">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Description coming soon.</p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
            <h3 className="font-semibold text-sm">Links</h3>
            <div className="space-y-2">
              {coin.website && <LinkRow icon={<Globe className="h-4 w-4" />} label="Website" href={coin.website} />}
              {coin.whitepaper_url && <LinkRow icon={<FileText className="h-4 w-4" />} label="Whitepaper" href={coin.whitepaper_url} />}
              {coin.github_url && <LinkRow icon={<Github className="h-4 w-4" />} label="GitHub" href={coin.github_url} />}
              {coin.twitter_url && <LinkRow icon={<Twitter className="h-4 w-4" />} label="Twitter" href={coin.twitter_url} />}
              {coin.telegram_url && <LinkRow icon={<Send className="h-4 w-4" />} label="Telegram" href={coin.telegram_url} />}
            </div>
          </div>

          {/* Available exchanges — 規制対応 (景表法): 「推奨」NG → 「利用可能な取引所」表現 */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h3 className="font-semibold text-sm">
                {locale === 'ja' ? '利用可能な取引所' : 'Available exchanges'}
              </h3>
              <Badge variant="secondary" className="text-[10px]">PR</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground/80">
              {locale === 'ja'
                ? '広告リンクを含みます。投資推奨ではありません。'
                : 'Contains affiliate links. Not investment advice.'}
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full" size="sm">
                <a href={`https://bingx.com/?ref=cointier&coin=${coin.symbol}`} target="_blank" rel="noopener noreferrer">
                  {locale === 'ja' ? 'BingX で購入可能' : 'Available on BingX'}
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <a href={`https://mexc.com/?ref=cointier&coin=${coin.symbol}`} target="_blank" rel="noopener noreferrer">
                  {locale === 'ja' ? 'MEXC で購入可能' : 'Available on MEXC'}
                </a>
              </Button>
              {coin.hl_listed && (
                <Button asChild variant="outline" className="w-full" size="sm">
                  <a href={`https://app.hyperliquid.xyz/trade/${coin.symbol}`} target="_blank" rel="noopener noreferrer">
                    {locale === 'ja' ? 'Hyperliquid で取引可能' : 'Available on Hyperliquid'}
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Source coverage */}
          {coverage.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
              <h3 className="font-semibold text-sm">Data Sources</h3>
              <div className="flex flex-wrap gap-1">
                {coverage.map((s) => (
                  <Badge
                    key={s.source}
                    variant={s.isRecent ? 'success' : 'secondary'}
                    className="text-[10px]"
                    title={s.lastIngest ? `Last: ${new Date(s.lastIngest).toLocaleString()}` : undefined}
                  >
                    {s.source}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tier breakdown */}
          {coin.latest_tier_evaluation && (
            <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <TierBadge tier={coin.tier} size="sm" />
                {tTier('explained')}
              </h3>
              <ul className="space-y-1 text-xs">
                <FactorBar label={tTier('factors.liquidity')} value={coin.latest_tier_evaluation.liquidity_score} />
                <FactorBar label={tTier('factors.team')} value={coin.latest_tier_evaluation.team_score} />
                <FactorBar label={tTier('factors.technology')} value={coin.latest_tier_evaluation.technology_score} />
                <FactorBar label={tTier('factors.community')} value={coin.latest_tier_evaluation.community_score} />
                <FactorBar label={tTier('factors.regulatory')} value={coin.latest_tier_evaluation.regulatory_score} />
                <FactorBar label={tTier('factors.future')} value={coin.latest_tier_evaluation.future_score} />
              </ul>
              <p className="text-[10px] text-muted-foreground/70 pt-2">Pattern B · 個人投資家向け</p>
            </div>
          )}
        </aside>
      </section>

      <p className="text-xs text-muted-foreground pt-4">
        Aggregated from {coverage.length} sources · Tier by Cointier AI (Pattern B · DeepSeek V4 Pro) ·{' '}
        <Link href="/" className="text-primary hover:underline">{tCommon('viewAll')}</Link>
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SignalCard({
  icon,
  source,
  items,
  variant = 'default',
}: {
  icon: React.ReactNode;
  source: string;
  items: Array<{ label: string; value: string }>;
  variant?: 'default' | 'warning';
}) {
  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3',
      variant === 'warning' ? 'border-loss/30 bg-loss/5' : 'border-border/60 bg-card/30',
    )}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{source}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="num font-medium tabular-nums">{it.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  const color = v >= 70 ? 'bg-gain' : v >= 40 ? 'bg-tier-d' : 'bg-loss';
  return (
    <li className="flex items-center gap-2">
      <span className="text-muted-foreground w-24 text-[10px]">{label}</span>
      <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
        <div className={cn('h-full transition-all', color)} style={{ width: `${v}%` }} />
      </div>
      <span className="num text-[10px] w-8 text-right tabular-nums">{v.toFixed(0)}</span>
    </li>
  );
}

function LinkRow({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
      {icon}
      <span>{label}</span>
    </a>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, symbol } = await params;
  const coin = await getFullCoin(symbol, locale);
  if (!coin) {
    const fb = await getCoinFallback(symbol);
    if (!fb) return { title: 'Not found' };
    const t = await getTranslations({ locale, namespace: 'metadata' });
    return { title: `${fb.coin.name} (${fb.coin.symbol.toUpperCase()})`, description: t('description') };
  }
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: `${coin.name} (${coin.symbol.toUpperCase()}) · Tier ${coin.tier ?? '—'}`,
    description: coin.summary ?? `${coin.name} — ${t('description')}`,
    alternates: {
      canonical: `${SITE_URL}/${locale}/coin/${symbol}`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/coin/${symbol}`])),
    },
    openGraph: {
      title: `${coin.name} · Tier ${coin.tier ?? '—'}`,
      description: coin.summary ?? '',
      images: [`/api/og/coin/${symbol}`],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og/coin/${symbol}`],
    },
  };
}
