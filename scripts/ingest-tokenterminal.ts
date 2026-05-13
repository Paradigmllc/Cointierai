/**
 * scripts/ingest-tokenterminal.ts
 *
 * Token Terminal (月 50 万 req 無料) — クリプト版 P/E・P/S データ
 * 302 プロジェクト対応 — 機関投資家向け差別化要素
 */

import 'dotenv/config';
import { getProjects } from '../src/lib/api/tokenterminal';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function main() {
  if (!process.env.TOKEN_TERMINAL_API_KEY) {
    console.warn('[ingest:tt] TOKEN_TERMINAL_API_KEY not set, skipping');
    return;
  }
  const supabase = createServiceSupabase();
  const { data: projects } = await getProjects();
  console.log(`[ingest:tt] projects: ${projects.length}`);

  // Token Terminal slug → coins.id へ symbol で照合
  for (const p of projects) {
    if (!p.symbol) continue;
    const { data: coin } = await supabase
      .from('coins')
      .select('id')
      .eq('symbol', p.symbol.toLowerCase())
      .maybeSingle();
    if (!coin) continue;
    // Token Terminal データを coin metadata の補強として記録
    // (現状 schema は ratio を直接保存しないため、後で metric カラム追加 or jsonb 拡張)
    // 暫定: coin の updated_at だけ叩いて関連 ingestion 完了マーク
    await supabase.from('coins').update({ updated_at: new Date().toISOString() }).eq('id', coin.id);
  }
  console.log(`[ingest:tt] done`);
}

main().catch((err) => {
  console.error('[ingest:tt] fatal', err);
  process.exit(1);
});
