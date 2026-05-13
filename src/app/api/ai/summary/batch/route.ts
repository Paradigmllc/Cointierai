import { NextRequest, NextResponse } from 'next/server';
import { regenerateStaleBatch } from '@/lib/llm/summary-service';
import type { Locale } from '@/types/database';

/**
 * POST /api/ai/summary/batch — Admin endpoint
 *
 * Body: { limit?: number; locales?: Locale[]; staleDays?: number; secret: string }
 *
 * Cron job 用. CRON_SECRET で保護.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { limit?: number; locales?: Locale[]; staleDays?: number; secret: string };
    if (body.secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const result = await regenerateStaleBatch({
      limit: body.limit ?? 100,
      locales: body.locales ?? ['ja', 'en'],
      staleDays: body.staleDays ?? 30,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
