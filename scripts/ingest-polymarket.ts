/**
 * scripts/ingest-polymarket.ts
 *
 * Polymarket 関連 markets を ingestion (Notion L2266-2424)
 *
 * M1 段階: データ取得・表示のみ (賭博罪・幇助リスク回避)
 * M6+: Verified Builder 申請後に Builder Fee 実装
 *
 * 戦略: 主要 coin (BTC/ETH/SOL etc) の symbol で検索し関連 market を取得
 */

import 'dotenv/config';
import { searchMarkets } from '../src/lib/api/polymarket';
import { createServiceSupabase } from '../src/lib/db/supabase';

const TARGET_SYMBOLS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple', 'dogecoin', 'litecoin'];

async function main() {
  const supabase = createServiceSupabase();
  let total = 0;

  for (const symbol of TARGET_SYMBOLS) {
    try {
      const markets = await searchMarkets(symbol);
      for (const m of markets.slice(0, 10)) {
        const { data: coin } = await supabase
          .from('coins')
          .select('id')
          .eq('id', symbol)
          .maybeSingle();

        const { error } = await supabase.from('polymarket_markets').upsert({
          id: m.id,
          slug: m.slug,
          question: m.question,
          yes_price: parseFloat(m.outcomePrices[0] ?? '0'),
          no_price: parseFloat(m.outcomePrices[1] ?? '0'),
          volume_usd: parseFloat(m.volume ?? '0'),
          end_date: m.endDate,
          related_coin_id: coin?.id ?? null,
          related_keywords: [symbol, m.category].filter(Boolean) as string[],
          is_active: m.active && !m.closed,
          external_url: `https://polymarket.com/market/${m.slug}`,
        });
        if (!error) total++;
      }
    } catch (e) {
      console.warn('[ingest:pm]', symbol, e instanceof Error ? e.message : e);
    }
  }
  console.log(`[ingest:pm] done · ${total} markets`);
}

main().catch((err) => {
  console.error('[ingest:pm] fatal', err);
  process.exit(1);
});
