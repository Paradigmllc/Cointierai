/**
 * scripts/ingest-rootdata.ts
 *
 * RootData (アジア VC 特化) から VC fund / funding round を取得。
 * Cointier 差別化コア (⭐⭐⭐⭐⭐) — CryptoRank にないアジア VC データ
 *
 * 実行: pnpm tsx scripts/ingest-rootdata.ts
 */

import 'dotenv/config';
import { getInvestorBatch } from '../src/lib/api/rootdata';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function main() {
  const supabase = createServiceSupabase();
  try {
    const { data: investors } = await getInvestorBatch();
    console.log(`[ingest:rootdata] investors: ${investors.length}`);
    for (const inv of investors) {
      const slug = inv.invest_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const isAsia = inv.area?.includes('Asia') || /asia|japan|korea|china|singapore|hong/i.test(inv.area?.join(' ') ?? '');
      await supabase.from('vc_funds').upsert({
        slug,
        name: inv.invest_name,
        country: inv.area?.[0] ?? null,
        portfolio_count: inv.invest_num,
        description: { en: inv.description ?? '' },
        is_asia: !!isAsia,
        source: 'rootdata',
      }, { onConflict: 'slug' });
    }
    console.log(`[ingest:rootdata] done`);
  } catch (e) {
    console.error('[ingest:rootdata] failed', e);
    process.exit(1);
  }
}

main();
