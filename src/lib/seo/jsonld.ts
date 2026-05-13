/**
 * Schema.org JSON-LD helpers
 *
 * GEO (Perplexity / ChatGPT / Gemini) が引用判断に使う構造化データ。
 * 全 pSEO ページに埋め込む必須インフラ。
 *
 * 出力形式: <script type="application/ld+json"> JSON.stringify(obj) </script>
 */

import type { Coin } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';
const ORG_NAME = 'Cointier';

// ============ Organization (全ページ root) ============
export const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: ORG_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "Asia's AI-Powered Crypto Intelligence — 37,000+ coins analyzed across 7 languages",
  sameAs: [
    'https://twitter.com/cointier',
    'https://github.com/Paradigmllc/Cointierai',
    'https://medium.com/@cointier',
  ],
});

export const websiteLd = (locale: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: ORG_NAME,
  url: `${SITE_URL}/${locale}`,
  inLanguage: locale,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/${locale}/coins?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

// ============ Coin page ============
export const coinLd = (coin: Coin, locale: string, summary?: string | null) => ({
  '@context': 'https://schema.org',
  '@type': 'FinancialProduct',
  '@id': `${SITE_URL}/${locale}/coin/${coin.id}`,
  name: `${coin.name} (${coin.symbol.toUpperCase()})`,
  description: summary || `${coin.name} cryptocurrency overview and AI tier evaluation.`,
  url: `${SITE_URL}/${locale}/coin/${coin.id}`,
  image: coin.image_url,
  category: 'Cryptocurrency',
  identifier: coin.id,
  ...(coin.tier && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: coin.tier_score ?? 50,
      bestRating: 100,
      worstRating: 0,
      ratingCount: 1,
      reviewCount: 1,
      author: {
        '@type': 'Organization',
        name: 'Cointier AI',
      },
    },
  }),
  ...(coin.price_usd && {
    offers: {
      '@type': 'Offer',
      price: coin.price_usd.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }),
});

// ============ Breadcrumb ============
export const breadcrumbLd = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
  })),
});

// ============ ItemList (for ranking/category pages) ============
export const itemListLd = (params: {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string; rank: number }>;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: params.name,
  description: params.description,
  url: params.url,
  numberOfItems: params.items.length,
  itemListElement: params.items.map((item) => ({
    '@type': 'ListItem',
    position: item.rank,
    name: item.name,
    url: item.url,
  })),
});

// ============ FAQ (GEO 最強・Perplexity が好む) ============
export const faqLd = (items: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((q) => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
    },
  })),
});

// ============ Article (for category overview pages) ============
export const articleLd = (params: {
  title: string;
  description: string;
  url: string;
  locale: string;
  publishedAt?: string;
  updatedAt?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: params.title,
  description: params.description,
  url: params.url,
  inLanguage: params.locale,
  publisher: organizationLd(),
  datePublished: params.publishedAt ?? new Date().toISOString(),
  dateModified: params.updatedAt ?? new Date().toISOString(),
});

// ============ Helper: <script> JSX 文字列の作成 ============
export function ldScript(data: object | object[]): { __html: string } {
  return { __html: JSON.stringify(data) };
}
