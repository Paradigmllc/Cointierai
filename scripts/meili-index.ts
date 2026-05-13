/**
 * Build / refresh Meilisearch indexes.
 *
 * Usage:
 *   MEILISEARCH_HOST=... MEILISEARCH_API_KEY=... npm run meili:index
 *
 * Indexes:
 *   coins      — full CoinGecko market universe (17K+)
 *   exchanges  — CoinGecko /exchanges (top 100)
 *   categories — CoinGecko /coins/categories
 *
 * Schema decisions:
 *   - sortableAttributes: market_cap_rank, market_cap_usd  → enables sorted facet filtering
 *   - filterableAttributes: tier, ecosystem  → enables tier=S facet on the picker
 *   - searchableAttributes: prioritise symbol > name > id so "btc" surfaces Bitcoin first
 */
import 'dotenv/config';
import { MeiliSearch } from 'meilisearch';
import { getMarkets, getExchanges, getCategories } from '../src/lib/api/coingecko';

const HOST = process.env.MEILISEARCH_HOST;
const KEY = process.env.MEILISEARCH_ADMIN_KEY ?? process.env.MEILISEARCH_API_KEY;

if (!HOST) {
  console.error('MEILISEARCH_HOST is not set');
  process.exit(1);
}

const client = new MeiliSearch({ host: HOST, apiKey: KEY });

async function indexCoins() {
  const idx = client.index('coins');
  await idx.updateSettings({
    searchableAttributes: ['symbol', 'name', 'id'],
    sortableAttributes: ['market_cap_rank', 'market_cap_usd'],
    filterableAttributes: ['tier'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 3, twoTypos: 5 } },
  });

  // 17K → fetch in pages of 250
  const all: Array<Record<string, unknown>> = [];
  for (let page = 1; page <= 70; page += 1) {
    const batch = await getMarkets({ page, perPage: 250, sparkline: false }).catch(() => []);
    if (batch.length === 0) break;
    for (const c of batch) {
      all.push({
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        market_cap_rank: c.market_cap_rank ?? null,
        image: c.image,
        market_cap_usd: c.market_cap,
      });
    }
    console.log(`[meili coins] page ${page} → ${all.length} so far`);
    await new Promise((r) => setTimeout(r, 1_500)); // 30 req/min CG free limit
  }
  await idx.addDocuments(all, { primaryKey: 'id' });
  console.log(`[meili coins] indexed ${all.length}`);
}

async function indexExchanges() {
  const idx = client.index('exchanges');
  await idx.updateSettings({
    searchableAttributes: ['name', 'id'],
    sortableAttributes: ['trust_score'],
    filterableAttributes: ['country', 'market_type'],
  });
  const list = await getExchanges(1, 100).catch(() => []);
  const docs = list.map((e) => ({
    id: e.id,
    name: e.name,
    market_type: 'spot' as const,
    country: e.country,
    trust_score: e.trust_score,
    image: e.image,
  }));
  await idx.addDocuments(docs, { primaryKey: 'id' });
  console.log(`[meili exchanges] indexed ${docs.length}`);
}

async function indexCategories() {
  const idx = client.index('categories');
  await idx.updateSettings({ searchableAttributes: ['name'] });
  const cats = await getCategories().catch(() => []);
  await idx.addDocuments(
    cats.map((c) => ({ id: c.id, name: c.name, market_cap: c.market_cap })),
    { primaryKey: 'id' },
  );
  console.log(`[meili categories] indexed ${cats.length}`);
}

(async () => {
  await indexCoins();
  await indexExchanges();
  await indexCategories();
  console.log('✓ Meilisearch indexing complete');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
