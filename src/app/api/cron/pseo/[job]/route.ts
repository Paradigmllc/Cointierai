/**
 * /api/cron/pseo/[job] — pSEO content generation triggers.
 *
 *   /api/cron/pseo/verdicts?topN=50
 *   /api/cron/pseo/compare?topN=30        (top 30 × top 30 = 435 pairs × 7 locales = ~3K articles)
 *   /api/cron/pseo/verdict?coin=bitcoin   (single coin all locales)
 *
 * Auth: CRON_SECRET (query or Bearer header).
 */
import { NextResponse } from 'next/server';
import { generateCompareMatrix } from '@/lib/pseo/compare-generator';
import { generateVerdict, generateVerdictsBatch } from '@/lib/pseo/verdict-generator';
import { LOCALES, type Locale } from '@/lib/pseo/compare-generator';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request, ctx: { params: Promise<{ job: string }> }) {
  if (!authorised(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { job } = await ctx.params;
  const url = new URL(req.url);

  if (job === 'verdicts') {
    const topN = Math.min(200, Math.max(1, Number(url.searchParams.get('topN')) || 50));
    const result = await generateVerdictsBatch({ topN });
    return NextResponse.json(result);
  }
  if (job === 'verdict') {
    const coin = url.searchParams.get('coin');
    const localeParam = url.searchParams.get('locale');
    if (!coin) return NextResponse.json({ error: 'missing_coin' }, { status: 400 });
    const locales: Locale[] = localeParam ? [localeParam as Locale] : [...LOCALES];
    const out: Array<{ locale: string; ok: boolean; error?: string }> = [];
    for (const locale of locales) {
      const r = await generateVerdict(coin, locale);
      out.push({ locale, ok: r.ok, error: r.error });
    }
    return NextResponse.json({ results: out });
  }
  if (job === 'compare') {
    const topN = Math.min(100, Math.max(2, Number(url.searchParams.get('topN')) || 30));
    const result = await generateCompareMatrix(topN);
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: 'unknown_job' }, { status: 404 });
}
