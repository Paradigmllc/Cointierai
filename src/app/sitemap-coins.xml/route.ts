import { createServiceSupabase } from '@/lib/db/supabase';
import { SUPPORTED_LOCALES } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';
const MAX_PER_SITEMAP = 40_000; // Google 上限 50K · 7 locale で multiply するので 1 coin = 7 URL → 7K coins/file

export const dynamic = 'force-dynamic';
export const revalidate = 86_400;

/**
 * /sitemap-coins.xml — 全 coin × 7 locale の URL を出力
 *
 * 件数が 50K を超える場合は ?chunk=0,1,2... でページネーション
 *   /sitemap-coins.xml?chunk=0 → coins 0-5,714
 *   /sitemap-coins.xml?chunk=1 → coins 5,715-11,428
 *   ... (37K / 5714 ≒ 7 chunks)
 *
 * sitemap index で参照する設計 (root sitemap.ts で見る場合)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const chunk = Math.max(parseInt(url.searchParams.get('chunk') ?? '0', 10), 0);
  const coinsPerChunk = Math.floor(MAX_PER_SITEMAP / SUPPORTED_LOCALES.length);
  const offset = chunk * coinsPerChunk;

  try {
    const supabase = createServiceSupabase();
    const { data: coins } = await supabase
      .from('coins')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('market_cap_usd', { ascending: false, nullsFirst: false })
      .range(offset, offset + coinsPerChunk - 1);

    const urlsXml: string[] = [];
    for (const c of coins ?? []) {
      for (const locale of SUPPORTED_LOCALES) {
        const lastmod = c.updated_at ?? new Date().toISOString();
        const alternates = SUPPORTED_LOCALES
          .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}/coin/${c.id}" />`)
          .join('');
        urlsXml.push(
          `<url>` +
            `<loc>${SITE_URL}/${locale}/coin/${c.id}</loc>` +
            `<lastmod>${lastmod}</lastmod>` +
            `<changefreq>daily</changefreq>` +
            `<priority>0.7</priority>` +
            alternates +
          `</url>`,
        );
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('[sitemap-coins] error', e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
