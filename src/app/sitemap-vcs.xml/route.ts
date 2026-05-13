import { createServiceSupabase } from '@/lib/db/supabase';
import { SUPPORTED_LOCALES } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai';

export const dynamic = 'force-dynamic';
export const revalidate = 86_400;

export async function GET() {
  try {
    const supabase = createServiceSupabase();
    const { data: vcs } = await supabase
      .from('vc_funds')
      .select('slug, updated_at')
      .order('portfolio_count', { ascending: false, nullsFirst: false })
      .limit(5000);

    const urlsXml: string[] = [];
    for (const v of vcs ?? []) {
      for (const locale of SUPPORTED_LOCALES) {
        const lastmod = v.updated_at ?? new Date().toISOString();
        const alternates = SUPPORTED_LOCALES
          .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}/vc/${v.slug}" />`)
          .join('');
        urlsXml.push(
          `<url><loc>${SITE_URL}/${locale}/vc/${v.slug}</loc>` +
            `<lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority>` +
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
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' },
    });
  } catch {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
