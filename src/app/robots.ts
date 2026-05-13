import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

/**
 * robots.txt — 285,000 ページ pSEO に最適化
 *  - 全公開ページを許可
 *  - /api/ は disallow (B2B API は別ドメイン or 別 path で公開予定)
 *  - sitemap reference を明示
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/dashboard/', '/_next/', '/admin/'],
      },
      // SEO 主要 bot は明示的に許可
      {
        userAgent: ['Googlebot', 'Bingbot', 'DuckDuckBot'],
        allow: '/',
      },
      // GEO AI bot も許可 (Perplexity / ChatGPT / Gemini 引用元になる)
      {
        userAgent: ['PerplexityBot', 'ChatGPT-User', 'GPTBot', 'Google-Extended', 'Anthropic-AI', 'ClaudeBot'],
        allow: '/',
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-coins.xml`,
      `${SITE_URL}/sitemap-vcs.xml`,
      `${SITE_URL}/sitemap-categories.xml`,
    ],
    host: SITE_URL,
  };
}
