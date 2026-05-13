import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

/**
 * Root sitemap — 静的ページ + sitemap index 役割
 *
 * 285K URL を 1 ファイルに入れられない (Google 上限 50K) ため、
 * coin/vc/category 別に sitemap split を route handler で返す。
 *
 * Strategy:
 *   /sitemap.xml          → 静的ページ + tier + tools (本ファイル)
 *   /sitemap-coins.xml    → 全 coin (chunk 単位で route handler)
 *   /sitemap-vcs.xml      → 全 VC
 *   /sitemap-categories.xml → categories
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',           // home
    '/coins',
    '/vcs',
    '/ido',
    '/unlocks',
    '/unlocks-calendar',
    '/exchanges',
    '/dex',
    '/yields',
    '/stablecoins',
    '/bridges',
    '/sectors',
    '/funds',
    '/airdrops',
    '/news',
    '/hyperliquid',
    '/compare',
    '/tools',
    '/tools/risk-score',
    '/tools/unlock-calendar',
    '/tools/unlock-impact',
    '/tools/ido-roi',
    '/tools/dca-simulator',
    '/tools/converter',
    '/tools/tax-jp',
    '/tools/portfolio-import',
    '/pricing',
    '/docs',
    // Tier ranking pages
    '/tier/s',
    '/tier/a',
    '/tier/b',
    '/tier/c',
    '/tier/d',
    '/tier/f',
  ];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' ? 'hourly' : 'daily',
        priority: path === '' ? 1.0 : path.startsWith('/tier/') ? 0.7 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]),
          ),
        },
      });
    }
  }

  return entries;
}
