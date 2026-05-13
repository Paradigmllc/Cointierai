/**
 * scripts/ingest-defillama.ts
 *
 * DeFiLlama (完全無料) から:
 *   - Raises → funding_rounds + vc_funds
 *   - Hacks → hacks テーブル
 *
 * 実行: pnpm ingest:defillama
 */

import 'dotenv/config';
import { getRaises, getHacks } from '../src/lib/api/defillama';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function ingestRaises() {
  const supabase = createServiceSupabase();
  const { raises } = await getRaises();
  console.log(`[ingest:defillama] raises: ${raises.length}`);

  // VC fund master を upsert
  const investorMap = new Map<string, { name: string; deals: number }>();
  for (const r of raises) {
    for (const investor of [...r.leadInvestors, ...r.otherInvestors]) {
      if (!investor) continue;
      const e = investorMap.get(investor) ?? { name: investor, deals: 0 };
      e.deals += 1;
      investorMap.set(investor, e);
    }
  }
  const vcFundRows = [...investorMap.values()].map((v) => ({
    slug: v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: v.name,
    portfolio_count: v.deals,
    source: 'defillama',
    is_asia: false,  // RootData 統合時に上書き
  }));
  const { error: vcError } = await supabase.from('vc_funds').upsert(vcFundRows, { onConflict: 'slug' });
  if (vcError) console.error('[ingest:defillama] vc_funds error:', vcError);
  else console.log(`[ingest:defillama] vc_funds upserted: ${vcFundRows.length}`);

  // funding_rounds (project 名 → coins.id にマッチする場合のみ insert)
  // (現状はマッチ無しでも insert; ingest:cryptorank で coin_id を埋める)
  // 簡略化: name をそのまま記録、coin_id null 許可するため schema 更新検討
  // 今は無視 (要 schema 更新)
}

async function ingestHacks() {
  const supabase = createServiceSupabase();
  const hacks = await getHacks();
  console.log(`[ingest:defillama] hacks: ${hacks.length}`);

  const rows = hacks.slice(0, 1000).map((h) => ({
    protocol_name: h.name,
    date: new Date(h.date * 1000).toISOString().slice(0, 10),
    amount_lost_usd: h.amount,
    root_cause: h.classification,
    source_urls: h.source ? [h.source] : [],
  }));

  // upsert キーがないので chunk 単位で insert (重複を防ぐため事前に truncate も検討)
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await supabase.from('hacks').insert(chunk);
    if (error && !error.message.includes('duplicate')) {
      console.error('[ingest:defillama] hacks insert error:', error);
    }
  }
}

async function main() {
  const startedAt = Date.now();
  await ingestRaises();
  await ingestHacks();
  console.log(`[ingest:defillama] done · ${Math.round((Date.now() - startedAt) / 1000)}s`);
}

main().catch((err) => {
  console.error('[ingest:defillama] fatal', err);
  process.exit(1);
});
