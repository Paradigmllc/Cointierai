/**
 * Run every SSOT ingest job sequentially (CLI shortcut).
 *
 * Usage: SUPABASE_DB_URL=... CRYPTOPANIC_API_KEY=... … npm run ssot:all
 *
 * Identical effect to GET /api/cron/ssot/all but runnable without a deployed
 * server — handy for initial seeding from a developer machine.
 */
import 'dotenv/config';
import {
  ingestStablecoins, ingestBridges, ingestDexRankings, ingestExchanges,
  ingestYields, ingestNews, ingestDerivatives, ingestDexPairs, ingestMessari,
  ingestDeveloper, ingestHolders, type IngestSummary,
} from '../src/lib/ingest/ssot-jobs';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function topCoins(limit: number): Promise<string[]> {
  const { data } = await createServiceSupabase()
    .from('coins')
    .select('id')
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(limit);
  return (data ?? []).map((c) => c.id as string);
}

async function run(name: string, fn: () => Promise<IngestSummary>) {
  console.log(`\n→ ${name}`);
  try {
    const r = await fn();
    console.log(`  ${r.ok ? '✓' : '✗'} rows=${r.rows} ms=${r.ms} errors=${r.errors?.length ?? 0}`);
    if (r.errors?.length) console.log('  errors[0..3]:', r.errors.slice(0, 3));
  } catch (e) {
    console.error(`  ✗ ${name}:`, e instanceof Error ? e.message : e);
  }
}

(async () => {
  await run('stablecoins', ingestStablecoins);
  await run('bridges', ingestBridges);
  await run('dex_rankings', ingestDexRankings);
  await run('exchanges_index', ingestExchanges);
  await run('yields_pools', ingestYields);
  await run('news_articles', ingestNews);
  await run('derivatives_snapshots', () => ingestDerivatives());
  await run('dex_pairs', ingestDexPairs);
  const top200 = await topCoins(200);
  const top100 = top200.slice(0, 100);
  await run('messari (top 200)', () => ingestMessari(top200));
  await run('developer (top 100)', () => ingestDeveloper(top100));
  await run('holders (top 100)', () => ingestHolders(top100));
  console.log('\n✓ all ssot ingest jobs complete');
})();
