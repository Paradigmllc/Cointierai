/**
 * Etherscan / Arbiscan / Polygonscan / Optimistic / Base / BSC — unified holders + supply tracker.
 *
 * Free tier: 5 req/s, 100K req/day per chain. One API key per chain.
 * Use the multichain v2 endpoint when ETHERSCAN_V2_KEY is set (recommended).
 */

const V2_KEY = process.env.ETHERSCAN_V2_KEY;

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42_161,
  optimism: 10,
  polygon: 137,
  base: 8453,
  bsc: 56,
  avalanche: 43_114,
};

export interface EsHolder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
}

export interface EsTokenInfo {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  totalSupply: string;
  holders: string;
}

async function v2Fetch<T>(chain: string, module: string, action: string, params: Record<string, string> = {}): Promise<T | null> {
  const chainId = CHAIN_IDS[chain];
  if (!chainId || !V2_KEY) return null;
  const qs = new URLSearchParams({ chainid: String(chainId), module, action, apikey: V2_KEY, ...params });
  const res = await fetch(`https://api.etherscan.io/v2/api?${qs}`, {
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const json = (await res.json()) as { status: string; result: T };
  if (json.status !== '1') return null;
  return json.result;
}

/** Top 10 holders of an ERC20-compatible token. */
export async function getTopHolders(chain: string, contract: string, top = 10): Promise<EsHolder[]> {
  const result = await v2Fetch<EsHolder[]>(chain, 'token', 'tokenholderlist', {
    contractaddress: contract,
    page: '1',
    offset: String(top),
  });
  return result ?? [];
}

export async function getTokenInfo(chain: string, contract: string): Promise<EsTokenInfo | null> {
  const result = await v2Fetch<EsTokenInfo[]>(chain, 'token', 'tokeninfo', {
    contractaddress: contract,
  });
  return result?.[0] ?? null;
}
