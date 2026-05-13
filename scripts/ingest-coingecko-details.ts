/**
 * scripts/ingest-coingecko-details.ts
 *
 * 既に ingest-coingecko.ts で投入済の coins について、
 * /coins/{id} エンドポイントで description / links / categories を補完する。
 *
 * 月間 call 消費:
 *   - 17K coins × 1 call = 17K calls/月 → CoinGecko Demo 月 10K 制限を超過
 *   - 対策: Top 1000 銘柄に絞る (1K calls)・残りは Pro 移行後または on-demand
 *
 * 実行: pnpm tsx scripts/ingest-coingecko-details.ts
 */

import 'dotenv/config';
import { getCoinDetail } from '../src/lib/api/coingecko';
import { createServiceSupabase } from '../src/lib/db/supabase';

const TARGET_LIMIT = parseInt(process.env.DETAILS_LIMIT ?? '1000', 10);
const SLEEP_MS = parseInt(process.env.DETAILS_SLEEP_MS ?? '2500', 10); // 30 call/分

async function main() {
  const supabase = createServiceSupabase();
  const { data: coins, error } = await supabase
    .from('coins')
    .select('id')
    .order('market_cap_usd', { ascending: false, nullsFirst: false })
    .limit(TARGET_LIMIT);
  if (error || !coins) {
    console.error('[ingest:details] failed to fetch coin list:', error);
    process.exit(1);
  }

  console.log(`[ingest:details] enriching ${coins.length} coins`);
  let ok = 0;
  let fail = 0;
  let categoriesSeen = new Set<string>();

  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    try {
      const d = await getCoinDetail(c.id);
      // 1. coin update
      await supabase.from('coins').update({
        website: d.links?.homepage?.[0] ?? null,
        whitepaper_url: d.links?.whitepaper ?? null,
        github_url: d.links?.repos_url?.github?.[0] ?? null,
        twitter_url: d.links?.twitter_screen_name ? `https://twitter.com/${d.links.twitter_screen_name}` : null,
        telegram_url: d.links?.telegram_channel_identifier ? `https://t.me/${d.links.telegram_channel_identifier}` : null,
        updated_at: new Date().toISOString(),
      }).eq('id', c.id);

      // 2. categories upsert
      for (const cat of d.categories ?? []) {
        const catId = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (!catId) continue;
        if (!categoriesSeen.has(catId)) {
          await supabase.from('categories').upsert({
            id: catId,
            name: { en: cat, ja: cat, th: cat, vi: cat, id: cat, 'zh-TW': cat, ko: cat },
          });
          categoriesSeen.add(catId);
        }
        await supabase.from('coin_categories').upsert({ coin_id: c.id, category_id: catId });
      }

      // 3. coin_translations (en description のみここで・他言語は LLM 生成)
      const enDesc = d.description?.en;
      if (enDesc && enDesc.length > 10) {
        await supabase.from('coin_translations').upsert({
          coin_id: c.id,
          locale: 'en',
          description: enDesc.slice(0, 4000),
          generated_by: 'coingecko',
          is_reviewed: true,
        }, { onConflict: 'coin_id,locale' });
      }

      ok++;
      if ((i + 1) % 50 === 0) {
        console.log(`[ingest:details] ${i + 1}/${coins.length} · ok ${ok} · fail ${fail}`);
      }
    } catch (e) {
      fail++;
      console.warn('[ingest:details] failed', c.id, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  console.log(`[ingest:details] done · ok ${ok} · fail ${fail}`);
}

main().catch((err) => {
  console.error('[ingest:details] fatal', err);
  process.exit(1);
});
