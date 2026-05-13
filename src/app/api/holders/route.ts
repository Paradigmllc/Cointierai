/**
 * On-chain top holders. Tries Etherscan v2 (multichain) first, falls back to Bitquery.
 */
import { NextResponse } from 'next/server';
import { getTopHolders, getTokenInfo } from '@/lib/api/etherscan';
import { getEvmTopHolders } from '@/lib/api/bitquery';

export const revalidate = 3600;

const BITQUERY_NET: Record<string, 'eth' | 'arbitrum' | 'optimism' | 'matic' | 'base' | 'bsc'> = {
  ethereum: 'eth',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  polygon: 'matic',
  base: 'base',
  bsc: 'bsc',
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chain = url.searchParams.get('chain') ?? '';
  const contract = url.searchParams.get('contract') ?? '';
  if (!chain || !contract) return NextResponse.json({ holders: [] }, { status: 400 });

  let totalSupply: number | null = null;
  const info = await getTokenInfo(chain, contract).catch(() => null);
  if (info?.totalSupply && info.divisor) {
    totalSupply = Number(info.totalSupply) / Math.pow(10, Number(info.divisor));
  }

  // Try Etherscan first
  const es = await getTopHolders(chain, contract, 10).catch(() => []);
  if (es.length > 0 && totalSupply) {
    const holders = es.map((h, i) => {
      const amount = Number(h.TokenHolderQuantity);
      return { rank: i + 1, address: h.TokenHolderAddress, amount, pct: (amount / totalSupply!) * 100 };
    });
    return NextResponse.json({ holders, source: 'etherscan' });
  }

  // Fallback to Bitquery
  const bnet = BITQUERY_NET[chain];
  if (bnet) {
    const bq = await getEvmTopHolders(bnet, contract).catch(() => []);
    if (bq.length > 0) {
      const supply = totalSupply ?? bq.reduce((s, h) => s + Number(h.amount), 0);
      const holders = bq.slice(0, 10).map((h, i) => {
        const amount = Number(h.amount);
        return { rank: i + 1, address: h.address, amount, pct: supply > 0 ? (amount / supply) * 100 : 0 };
      });
      return NextResponse.json({ holders, source: 'bitquery' });
    }
  }

  return NextResponse.json({ holders: [], source: 'none' });
}
