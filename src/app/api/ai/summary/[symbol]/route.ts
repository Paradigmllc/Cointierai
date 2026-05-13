import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateSummary } from '@/lib/llm/summary-service';
import type { Locale } from '@/types/database';

/**
 * GET /api/ai/summary/[symbol]?locale=ja
 *
 * On-demand AI summary generation + cache
 *
 * Production:
 *   - 24h ISR cache (s-maxage=86400)
 *   - Rate limit: 1 req/sec per IP (Coolify層で対応推奨)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const locale = (req.nextUrl.searchParams.get('locale') ?? 'ja') as Locale;
  const force = req.nextUrl.searchParams.get('force') === '1';

  try {
    const result = await getOrGenerateSummary(symbol, locale, { force });
    if (!result) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    return NextResponse.json(
      {
        symbol,
        locale,
        summary: result.summary,
        generated_at: result.generated_at,
        from_cache: result.from_cache,
      },
      {
        headers: {
          'Cache-Control': result.from_cache ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'public, s-maxage=300',
        },
      },
    );
  } catch (e) {
    console.error('[/api/ai/summary] err', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
