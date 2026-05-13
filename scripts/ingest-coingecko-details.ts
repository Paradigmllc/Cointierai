/**
 * scripts/ingest-coingecko-details.ts
 *
 * 既存 coins テーブルに対して /coins/{id} 詳細を集約 materialize:
 *   - description / links → coins (website / github_url / etc)
 *   - categories         → categories + coin_categories
 *   - developer_data     → coins.github_stars / forks / subscribers
 *   - community_data     → coins.twitter_followers / reddit / telegram
 *   - en description     → coin_translations
 *
 * 月間 call 消費: Top N coins × 1 call (DETAILS_LIMIT で制御)
 */

import 'dotenv/config';
import { getCoinDetail } from '../src/lib/api/coingecko';
import { createServiceSupabase } from '../src/lib/db/supabase';

const TARGET_LIMIT = parseInt(process.env.DETAILS_LIMIT ?? '500', 10);
const SLEEP_MS = parseInt(process.env.DETAILS_SLEEP_MS ?? '2500', 10);

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
  const categoriesSeen = new Set<string>();

  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    try {
      const d = await getCoinDetail(c.id);

      // Developer / community data
      const dev = d.developer_data as Record<string, number> | undefined;
      const community = d.community_data as Record<string, number> | undefined;

      // 1. coins テーブル update
      await supabase
        .from('coins')
        .update({
          website: d.links?.homepage?.[0] ?? null,
          whitepaper_url: d.links?.whitepaper ?? null,
          github_url: d.links?.repos_url?.github?.[0] ?? null,
          twitter_url: d.links?.twitter_screen_name ? `https://twitter.com/${d.links.twitter_screen_name}` : null,
          telegram_url: d.links?.telegram_channel_identifier ? `https://t.me/${d.links.telegram_channel_identifier}` : null,
          discord_url: d.links?.chat_url?.find((u) => u?.includes('discord')) ?? null,
          github_stars: dev?.stars ?? null,
          github_forks: dev?.forks ?? null,
          github_subscribers: dev?.subscribers ?? null,
          twitter_followers: community?.twitter_followers ?? null,
          reddit_subscribers: community?.reddit_subscribers ?? null,
          telegram_users: community?.telegram_channel_user_count ?? null,
          last_ingest_coingecko: new Date().toISOString(),
        })
        .eq('id', c.id);

      // 2. categories upsert + coin_categories
      for (const cat of d.categories ?? []) {
        const catId = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (!catId) continue;
        if (!categoriesSeen.has(catId)) {
          await supabase
            .from('categories')
            .upsert({ id: catId, name: { en: cat, ja: cat, th: cat, vi: cat, id: cat, 'zh-TW': cat, ko: cat } });
          categoriesSeen.add(catId);
        }
        await supabase.from('coin_categories').upsert({ coin_id: c.id, category_id: catId });
      }

      // 3. EN description → coin_translations
      const enDesc = d.description?.en;
      if (enDesc && enDesc.length > 10) {
        await supabase
          .from('coin_translations')
          .upsert(
            {
              coin_id: c.id,
              locale: 'en',
              description: enDesc.slice(0, 4000),
              generated_by: 'coingecko',
              is_reviewed: true,
            },
            { onConflict: 'coin_id,locale' },
          );
      }

      // 4. 取引所カバレッジ (tickers → coin_exchanges + count)
      if (d.tickers?.length) {
        const exchanges = new Set<string>();
        for (const t of d.tickers.slice(0, 50)) {
          const exId = t.market?.identifier;
          if (exId) exchanges.add(exId);
        }
        // ⚠️ exchanges テーブル未登録 ID は無視 (FK error 防止) — 既知 ID のみ insert
        const known = ['binance', 'mexc', 'bingx', 'bitget', 'kucoin', 'coinbase', 'kraken', 'okx', 'hashkey', 'bitkub', 'indodax', 'coins-ph', 'coindcx'];
        const matched = [...exchanges].filter((e) => known.includes(e));
        await supabase
          .from('coins')
          .update({ exchange_listing_count: matched.length })
          .eq('id', c.id);
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
