import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getCoin } from '@/lib/db/queries';
import { TierBadge } from '@/components/coin/TierBadge';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatCompact, formatPercent, changeColor, cn } from '@/lib/utils';
import { breadcrumbLd, articleLd, ldScript } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';
import type { Coin } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 1800;

interface PageProps {
  params: Promise<{ locale: Locale; pair: string }>;
}

/**
 * /[locale]/compare/btc-vs-eth — combinatorial pSEO
 *
 * Top 1000 coins の組み合わせ = 1000×999/2 = ~500K pairs
 * × 7 locales = ~3.5M pages (やりすぎ → 上位 100 だけで初期は 4,950 pairs × 7 = 35K pages)
 */
export default async function ComparePage({ params }: PageProps) {
  const { locale, pair } = await params;
  setRequestLocale(locale);
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

  const url = `${SITE_URL}/${locale}/compare/${pair}`;

  return (
    <div className="container py-8 space-y-8">
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

      <header className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">
          {a.name} <span className="text-muted-foreground">vs</span> {b.name}
        </h1>
        <p className="text-sm text-muted-foreground">{tCommon('siteName')} side-by-side comparison</p>
      </header>

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

      <p className="text-xs text-muted-foreground text-center">
        {locale === 'ja'
          ? '本ページの比較は事実の並列表示であり投資推奨ではありません。各銘柄の詳細は個別ページをご確認ください。'
          : 'This comparison shows facts side-by-side and is not investment advice. See individual coin pages for full details.'}
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
