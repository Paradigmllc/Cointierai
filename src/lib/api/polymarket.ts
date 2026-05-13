/**
 * Polymarket API client (Notion L2266-2424)
 *
 * 銘柄詳細ページに「予測マーケット」タブを実装するためのデータ取得。
 * M1 段階: 表示のみ (賭博罪リスク回避・外部リンクのみ)
 * M6+: Verified Builder Code 申請・Builder Fee 実装
 *
 * 公開 API: https://gamma-api.polymarket.com/
 */

const BASE = 'https://gamma-api.polymarket.com';

export interface PmMarket {
  id: string;
  slug: string;
  question: string;
  description: string | null;
  outcomes: string[];       // ["Yes", "No"] etc
  outcomePrices: string[];  // ["0.67", "0.33"]
  volume: string;
  volume24hr: string;
  liquidity: string;
  endDate: string;
  category: string | null;
  active: boolean;
  closed: boolean;
}

async function pmFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Cointier/0.1' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 600 }, // 10min
  });
  if (!res.ok) {
    throw new Error(`Polymarket ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/**
 * Active markets を keyword で検索
 * (BTC / Bitcoin / ETH 等の coin symbol で関連 market を引く)
 */
export async function searchMarkets(query: string): Promise<PmMarket[]> {
  const params = new URLSearchParams({
    active: 'true',
    closed: 'false',
    limit: '20',
    order: 'volume24hr',
    ascending: 'false',
  });
  // gamma API の search は path query で
  return pmFetch<PmMarket[]>(`/markets?${params}`).then((markets) =>
    markets.filter((m) =>
      m.question.toLowerCase().includes(query.toLowerCase()) ||
      m.slug.toLowerCase().includes(query.toLowerCase()),
    ),
  );
}

/**
 * Coin に関連する予測 market を取得 (symbol + name 両方で検索)
 */
export async function getRelatedMarkets(coinSymbol: string, coinName: string): Promise<PmMarket[]> {
  try {
    const [bySymbol, byName] = await Promise.all([
      searchMarkets(coinSymbol),
      searchMarkets(coinName),
    ]);
    // dedup by id
    const seen = new Set<string>();
    const result: PmMarket[] = [];
    for (const m of [...bySymbol, ...byName]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        result.push(m);
      }
    }
    return result.slice(0, 5);
  } catch (e) {
    console.error('[polymarket] search failed', e);
    return [];
  }
}
