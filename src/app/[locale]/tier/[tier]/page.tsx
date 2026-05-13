import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTopCoins } from '@/lib/db/queries';
import { CoinsTable } from '@/components/tables/CoinsTable';
import { TierBadge } from '@/components/coin/TierBadge';
import { breadcrumbLd, itemListLd, ldScript, faqLd } from '@/lib/seo/jsonld';
import type { Locale } from '@/i18n/routing';
import type { Tier } from '@/types/database';

const VALID_TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const revalidate = 1800;
export const dynamicParams = false;

export function generateStaticParams() {
  return VALID_TIERS.map((tier) => ({ tier: tier.toLowerCase() }));
}

interface PageProps {
  params: Promise<{ locale: string; tier: string }>;
}

export default async function TierRankingPage({ params }: PageProps) {
  const { locale: localeStr, tier: tierLower } = await params;
  const locale = localeStr as Locale;
  setRequestLocale(locale);
  const tier = tierLower.toUpperCase() as Tier;
  if (!VALID_TIERS.includes(tier)) notFound();

  const tTier = await getTranslations('tier');
  const tHome = await getTranslations('home');
  const tCommon = await getTranslations('common');

  const coins = await getTopCoins({ limit: 250, tier });

  // FAQ data — Pattern B 中立教育者風
  const faqItems: Record<Locale, Array<{ question: string; answer: string }>> = {
    ja: [
      { question: `${tier} 級とは何ですか?`, answer: `Cointier ${tier} 級は流動性・チーム・テクノロジー・コミュニティ・規制・将来性の 6 軸を AI が評価して付ける格付けです。${tTier(`${tierLower}` as 'a')} の銘柄が該当します。` },
      { question: '評価はどのくらいの頻度で更新されますか?', answer: '価格データは毎時、Tier 評価は日次で更新されます。OpenRouter 経由で DeepSeek V4 Pro が AI 算出します。' },
      { question: 'なぜ草コインも S/A 級に入ることがあるのですか?', answer: 'Cointier はパターン B (個人投資家向け) を採用しており、コミュニティ熱量と将来性を 50% 重み付けします。時価総額が小さくても SNS で注目されたり VC backing があれば高評価になります。' },
    ],
    en: [
      { question: `What is Tier ${tier}?`, answer: `Cointier Tier ${tier} is an AI-generated rating across 6 axes: liquidity, team, technology, community, regulatory, and future potential. ${tTier(`${tierLower}` as 'a')} coins fall into this tier.` },
      { question: 'How often are evaluations updated?', answer: 'Prices update hourly. Tier evaluations update daily via OpenRouter + DeepSeek V4 Pro.' },
      { question: 'Why do some low-cap coins reach Tier S/A?', answer: 'Cointier uses Pattern B (retail investor focus) — community + future = 50% weight. Small-cap coins with strong SNS traction or VC backing can earn high tiers.' },
    ],
    th: [], vi: [], id: [], 'zh-TW': [], ko: [],
  };
  const faqs = faqItems[locale]?.length ? faqItems[locale] : faqItems.en;

  const url = `${SITE_URL}/${locale}/tier/${tierLower}`;

  return (
    <div className="container py-4 space-y-8">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript([
        breadcrumbLd([
          { name: tCommon('siteName'), url: `/${locale}` },
          { name: tTier('label'), url: `/${locale}/tier/s` },
          { name: `Tier ${tier}`, url: `/${locale}/tier/${tierLower}` },
        ]),
        itemListLd({
          name: `Tier ${tier} cryptocurrencies — Cointier`,
          description: `All Tier ${tier} cryptocurrencies ranked by Cointier AI.`,
          url,
          items: coins.slice(0, 100).map((c, i) => ({ name: c.name, url: `${SITE_URL}/${locale}/coin/${c.id}`, rank: i + 1 })),
        }),
        faqLd(faqs),
      ])} />

      {/* Header */}
      <section className="flex items-center gap-6 flex-wrap">
        <TierBadge tier={tier} size="lg" />
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold">{tTier(`${tierLower}` as 'a')}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{tTier('explained')}</p>
        </div>
      </section>

      {/* TL;DR (GEO 最適化) */}
      <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
        <h2 className="font-semibold text-sm">TL;DR</h2>
        <p className="text-sm leading-relaxed">
          {locale === 'ja' && (
            <>Tier {tier} は {coins.length} 銘柄が該当します。Cointier はパターン B (個人投資家向け) を採用し、コミュニティ熱量と将来性を重視した格付けで、CryptoRank.io 等の純時価総額ランキングとは異なる視点を提供します。</>
          )}
          {locale === 'en' && (
            <>Tier {tier} contains {coins.length} cryptocurrencies. Cointier uses Pattern B (retail-investor focus), weighting community engagement and future potential — a different lens than pure market-cap rankings.</>
          )}
        </p>
      </div>

      {/* Coin table */}
      <CoinsTable data={coins} pageSize={50} />

      {/* FAQ (rendered for users — Schema for bots already in head) */}
      <section className="space-y-4 max-w-3xl">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((f: { question: string; answer: string }, i: number) => (
            <details key={i} className="rounded-lg border border-border/60 bg-card/30 p-4">
              <summary className="font-medium cursor-pointer">{f.question}</summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, tier: tierLower } = await params;
  const tier = tierLower.toUpperCase() as Tier;
  if (!VALID_TIERS.includes(tier)) return { title: 'Not found' };
  const t = await getTranslations({ locale, namespace: 'tier' });
  return {
    title: `Tier ${tier} — ${t('label')}`,
    description: t('explained'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/tier/${tierLower}`,
      languages: Object.fromEntries(['ja', 'en', 'th', 'vi', 'id', 'zh-TW', 'ko'].map((l) => [l, `${SITE_URL}/${l}/tier/${tierLower}`])),
    },
  };
}
