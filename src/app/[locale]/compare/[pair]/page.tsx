import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getCoin } from '@/lib/db/queries';
import { getCompareArticle } from '@/lib/db/ssot-queries';
import { TierBadge } from '@/components/coin/TierBadge';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatPrice, formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';
import { breadcrumbLd, articleLd, ldScript } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';
import type { Coin } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 1800;

interface PageProps {
  params: Promise<{ locale: string; pair: string }>;
}

/**
 * /[locale]/compare/btc-vs-eth — combinatorial pSEO
 *
 * Top 1000 coins の組み合わせ = 1000×999/2 = ~500K pairs
 * × 7 locales = ~3.5M pages (やりすぎ → 上位 100 だけで初期は 4,950 pairs × 7 = 35K pages)
 */
export default async function ComparePage({ params }: PageProps) {
  const { locale: localeStr, pair } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const tT = await getTranslations({ locale });
  const tCommon = await getTranslations('common');
  const tCoin = await getTranslations('coin');

  // Parse "btc-vs-eth"
  const [aSlug, sep, bSlug] = pair.split('-');
  if (sep !== 'vs' || !aSlug || !bSlug) {
    // try a different separator pattern
    const m = pair.match(/^(.+?)-vs-(.+)$/);
    if (!m) notFound();
  }
  const m = pair.match(/^(.+?)-vs-(.+)$/);
  const symbolA = m?.[1];
  const symbolB = m?.[2];
  if (!symbolA || !symbolB) notFound();

  const [resultA, resultB] = await Promise.all([getCoin(symbolA!), getCoin(symbolB!)]);
  if (!resultA || !resultB) notFound();
  const a = resultA.coin;
  const b = resultB.coin;

  // Canonical: alphabetical order. /eth-vs-btc → 301 to /btc-vs-eth.
  // Both URLs share one DB row in compare_articles.
  const canonicalPair = [a.id, b.id].sort().join('-vs-');
  if (canonicalPair !== `${a.id}-vs-${b.id}`) {
    redirect(`/${locale}/compare/${canonicalPair}`);
  }

  // SSOT pSEO article (cointier.compare_articles)
  const article = await getCompareArticle(a.id, b.id, locale);

  const url = `${SITE_URL}/${locale}/compare/${pair}`;

  return (
    <div className="container py-4 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
        breadcrumbLd([
          { name: tCommon('siteName'), url: `/${locale}` },
          { name: 'Compare', url: `/${locale}/compare/btc-vs-eth` },
          { name: `${a.symbol.toUpperCase()} vs ${b.symbol.toUpperCase()}`, url: `/${locale}/compare/${pair}` },
        ]),
        articleLd({
          title: `${a.name} vs ${b.name} — Cointier`,
          description: `Side-by-side comparison of ${a.name} (${a.symbol.toUpperCase()}) and ${b.name} (${b.symbol.toUpperCase()}).`,
          url,
          locale,
        }),
      ])} />

      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold">
          {article?.title ?? `${a.name} vs ${b.name}`}
        </h1>
        <p className="text-[13px] text-muted-foreground">{article?.intro ?? `${tCommon('siteName')} side-by-side comparison`}</p>
      </header>

      {/* AI Verdict (pSEO core) */}
      {article && (
        <section className="surface p-5 space-y-4 border-primary/30 bg-primary/[0.04]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{locale === 'ja' ? 'Cointier AI による評定' : 'Cointier AI verdict'}</h2>
            <Badge variant="secondary" className="text-[9px]">DeepSeek V4 Pro</Badge>
          </div>
          <p className="text-[13px] leading-relaxed">{article.verdict}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gain/30 bg-gain/5 p-3 space-y-1">
              <div className="text-[11px] font-semibold inline-flex items-center gap-1 text-gain"><ThumbsUp className="h-3 w-3" />{a.symbol.toUpperCase()} Bull case</div>
              <p className="text-[12px] leading-snug">{article.bull_case_a}</p>
              <div className="text-[11px] font-semibold inline-flex items-center gap-1 text-loss pt-2"><ThumbsDown className="h-3 w-3" />Bear</div>
              <p className="text-[12px] leading-snug">{article.bear_case_a}</p>
            </div>
            <div className="rounded-lg border border-gain/30 bg-gain/5 p-3 space-y-1">
              <div className="text-[11px] font-semibold inline-flex items-center gap-1 text-gain"><ThumbsUp className="h-3 w-3" />{b.symbol.toUpperCase()} Bull case</div>
              <p className="text-[12px] leading-snug">{article.bull_case_b}</p>
              <div className="text-[11px] font-semibold inline-flex items-center gap-1 text-loss pt-2"><ThumbsDown className="h-3 w-3" />Bear</div>
              <p className="text-[12px] leading-snug">{article.bear_case_b}</p>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4">
        <CoinCard coin={a} locale={locale} />
        <CoinCard coin={b} locale={locale} />
      </section>

      {/* Metric comparison */}
      <section className="rounded-lg border border-border/60 bg-card/30 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{tCoin('overview')}</th>
              <th className="text-right">{a.symbol.toUpperCase()}</th>
              <th className="text-right">{b.symbol.toUpperCase()}</th>
              <th className="text-right">Winner</th>
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Tier" a={a.tier ?? '—'} b={b.tier ?? '—'} winner={betterTier(a.tier, b.tier)} />
            <MetricRow label="Rank" a={`#${a.rank ?? '—'}`} b={`#${b.rank ?? '—'}`} winner={(a.rank ?? Infinity) < (b.rank ?? Infinity) ? 'a' : 'b'} />
            <MetricRow label="Price" a={formatPrice(a.price_usd)} b={formatPrice(b.price_usd)} winner="" />
            <MetricRow
              label="Market Cap"
              a={formatCompact(a.market_cap_usd)}
              b={formatCompact(b.market_cap_usd)}
              winner={(a.market_cap_usd ?? 0) > (b.market_cap_usd ?? 0) ? 'a' : 'b'}
            />
            <MetricRow
              label="24h Volume"
              a={formatCompact(a.volume_24h_usd)}
              b={formatCompact(b.volume_24h_usd)}
              winner={(a.volume_24h_usd ?? 0) > (b.volume_24h_usd ?? 0) ? 'a' : 'b'}
            />
            <MetricRow
              label="24h Change"
              a={formatPercent(a.change_24h)}
              b={formatPercent(b.change_24h)}
              winner={(a.change_24h ?? 0) > (b.change_24h ?? 0) ? 'a' : 'b'}
            />
            <MetricRow
              label="7d Change"
              a={formatPercent(a.change_7d)}
              b={formatPercent(b.change_7d)}
              winner={(a.change_7d ?? 0) > (b.change_7d ?? 0) ? 'a' : 'b'}
            />
            <MetricRow label="ATH" a={formatPrice(a.ath_usd)} b={formatPrice(b.ath_usd)} winner="" />
          </tbody>
        </table>
      </section>

      {article?.faq && article.faq.length > 0 && (
        <section className="surface p-5 space-y-3">
          <h2 className="text-sm font-semibold">FAQ</h2>
          <div className="space-y-3">
            {article.faq.map((qa, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[13px] font-semibold">{qa.q}</div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{qa.a}</p>
              </div>
            ))}
          </div>
          {/* FAQPage schema for SEO */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: article.faq.map((qa) => ({
                '@type': 'Question',
                name: qa.q,
                acceptedAnswer: { '@type': 'Answer', text: qa.a },
              })),
            }),
          }} />
        </section>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {tT('compare.thisComparisonShowsFactsSide')}
      </p>
    </div>
  );
}

function CoinCard({ coin, locale }: { coin: Coin; locale: Locale }) {
  return (
    <a
      href={`/${locale}/coin/${coin.id}`}
      className="block rounded-lg border border-border/60 bg-card/30 p-5 hover:border-primary/40 transition-colors space-y-3"
    >
      <div className="flex items-center gap-3">
        {coin.image_url && <Image src={coin.image_url} alt={coin.symbol} width={48} height={48} className="rounded-full" unoptimized />}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{coin.name}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase">{coin.symbol}</span>
            {coin.rank && <Badge variant="outline">#{coin.rank}</Badge>}
          </div>
        </div>
        <TierBadge tier={coin.tier} size="md" />
      </div>
      <div>
        <div className="num text-2xl font-bold">{formatPrice(coin.price_usd)}</div>
        <div className={cn('num text-sm', changeColor(coin.change_24h))}>{formatPercent(coin.change_24h)} (24h)</div>
      </div>
    </a>
  );
}

function MetricRow({ label, a, b, winner }: { label: string; a: string; b: string; winner: 'a' | 'b' | '' }) {
  return (
    <tr>
      <td className="font-medium">{label}</td>
      <td className={cn('text-right num', winner === 'a' && 'text-gain font-semibold')}>{a}</td>
      <td className={cn('text-right num', winner === 'b' && 'text-gain font-semibold')}>{b}</td>
      <td className="text-right text-xs text-muted-foreground">
        {winner === 'a' && <TrendingUp className="inline h-3 w-3 text-gain" />}
        {winner === 'b' && <TrendingDown className="inline h-3 w-3 text-gain" />}
        {!winner && <Minus className="inline h-3 w-3" />}
      </td>
    </tr>
  );
}

function betterTier(a: string | null, b: string | null): 'a' | 'b' | '' {
  const ORDER = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
  const va = a ? (ORDER as Record<string, number>)[a] ?? 0 : 0;
  const vb = b ? (ORDER as Record<string, number>)[b] ?? 0 : 0;
  if (va > vb) return 'a';
  if (vb > va) return 'b';
  return '';
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, pair } = await params;
  return {
    title: pair.replace('-vs-', ' vs ').toUpperCase(),
    alternates: {
      canonical: `${SITE_URL}/${locale}/compare/${pair}`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/compare/${pair}`])),
    },
  };
}
