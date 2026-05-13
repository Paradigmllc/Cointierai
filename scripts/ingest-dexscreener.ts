/**
 * scripts/ingest-dexscreener.ts
 *
 * DEXScreener — Long-tail DEX token coverage
 * CoinGecko Demo (17K coins) を超える Long-tail を取得し coin_exchanges に紐付け。
 *
 * Coverage: 80+ chains, 300+ DEX, 2M+ tokens (全件取得は規約・コスト的に無理)
 * → 既存 coins テーブルの coin について DEX pair 情報を補完するパターンを採用。
 */

import 'dotenv/config';
import { getPairsByToken } from '../src/lib/api/dexscreener';
import { createServiceSupabase } from '../src/lib/db/supabase';

async function main() {
  const supabase = createServiceSupabase();
  const { data: coins } = await supabase
    .from('coins')
    .select('id, symbol, contract_address')
    .not('contract_address', 'is', null)
    .limit(500);

  let total = 0;
  for (const c of coins ?? []) {
    if (!c.contract_address) continue;
    try {
      const { pairs } = await getPairsByToken('ethereum', c.contract_address);
      for (const p of pairs.slice(0, 5)) {
        const { error } = await supabase.from('coin_exchanges').upsert({
          coin_id: c.id,
          exchange_id: p.dexId,
          trading_pair: `${p.baseToken.symbol}/${p.quoteToken.symbol}`,
          volume_24h_usd: p.volume.h24,
        });
        if (!error) total++;
      }
    } catch (e) {
      console.warn('[ingest:dex] failed', c.symbol, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`[ingest:dex] done · pairs ingested: ${total}`);
}

main().catch((err) => {
  console.error('[ingest:dex] fatal', err);
  process.exit(1);
});
