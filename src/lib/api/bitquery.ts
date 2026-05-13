/**
 * Bitquery — multichain on-chain GraphQL API.
 * Free tier: 100K points/month (≈ 3K-5K queries).
 * Docs: https://docs.bitquery.io/
 */

const BASE = 'https://streaming.bitquery.io/eap';
const TOKEN = process.env.BITQUERY_API_KEY;

async function bqFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
  if (!TOKEN) return null;
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
    next: { revalidate: 1800 },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors || !json.data) return null;
  return json.data;
}

export interface BqTransfer {
  block: { timestamp: string };
  amount: string;
  sender: { address: string };
  receiver: { address: string };
}

export interface BqHolderStats {
  totalHolders: number;
  top10ConcentrationPct: number;
}

const TOP_HOLDERS_QUERY = /* GraphQL */ `
  query TopHolders($network: evm_network!, $contract: String!) {
    EVM(network: $network, dataset: archive) {
      TokenHolders(
        date: "now"
        tokenSmartContract: $contract
        limit: { count: 100 }
        orderBy: { descending: Balance_Amount }
      ) {
        Holder { Address }
        Balance { Amount }
      }
    }
  }
`;

export async function getEvmTopHolders(
  network: 'eth' | 'arbitrum' | 'optimism' | 'matic' | 'base' | 'bsc',
  contract: string,
): Promise<{ address: string; amount: string }[]> {
  const data = await bqFetch<{ EVM: { TokenHolders: { Holder: { Address: string }; Balance: { Amount: string } }[] } }>(
    TOP_HOLDERS_QUERY,
    { network, contract },
  );
  if (!data) return [];
  return data.EVM.TokenHolders.map((h) => ({ address: h.Holder.Address, amount: h.Balance.Amount }));
}
