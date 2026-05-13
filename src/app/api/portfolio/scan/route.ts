/**
 * Portfolio scan — free preview of EVM wallet holdings.
 *
 * Strategy:
 *   1. Etherscan v2 multichain `tokenholderlist` is for tokens (not wallets),
 *      so we use `addresstokenbalance` + `addresstokennftbalance` (chainid=1).
 *   2. For each ERC-20 returned, pivot the contract address through
 *      DeFiLlama /coins/prices for USD value (no extra API needed).
 *   3. Solana / non-EVM scanning is bumped to Pro (requires per-chain RPC).
 *
 * Limits: returns up to 50 tokens. Free preview shows top 10.
 */
import { NextResponse } from 'next/server';
import { getPrices } from '@/lib/api/defillama';

export const revalidate = 600;

const V2_KEY = process.env.ETHERSCAN_V2_KEY ?? '';

interface EsToken {
  TokenAddress: string;
  TokenName: string;
  TokenSymbol: string;
  TokenQuantity: string;
  TokenDivisor: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address')?.trim() ?? '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ holdings: [] }, { status: 400 });
  }
  if (!V2_KEY) {
    return NextResponse.json({ holdings: [], error: 'ETHERSCAN_V2_KEY not set' }, { status: 200 });
  }

  // Etherscan v2 — Ethereum mainnet only for preview tier.
  const qs = new URLSearchParams({
    chainid: '1',
    module: 'account',
    action: 'addresstokenbalance',
    address,
    page: '1',
    offset: '50',
    apikey: V2_KEY,
  });
  const res = await fetch(`https://api.etherscan.io/v2/api?${qs}`, {
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 600 },
  }).catch(() => null);
  if (!res || !res.ok) {
    return NextResponse.json({ holdings: [] });
  }
  const json = (await res.json()) as { status: string; result: EsToken[] | string };
  if (json.status !== '1' || !Array.isArray(json.result)) {
    return NextResponse.json({ holdings: [] });
  }
  const tokens = json.result;

  // Batch price lookup via DefiLlama
  const tokensForPrice = tokens.map((t) => `ethereum:${t.TokenAddress.toLowerCase()}`);
  const priceMap = await getPrices(tokensForPrice).catch(() => ({ coins: {} as Record<string, { price: number; symbol: string }> }));

  const holdings = tokens
    .map((t) => {
      const div = Math.pow(10, Number(t.TokenDivisor) || 18);
      const amount = Number(t.TokenQuantity) / div;
      const priceKey = `ethereum:${t.TokenAddress.toLowerCase()}`;
      const priceUsd = priceMap.coins[priceKey]?.price ?? 0;
      return {
        symbol: t.TokenSymbol,
        name: t.TokenName,
        amount,
        priceUsd,
        valueUsd: amount * priceUsd,
        chain: 'ethereum',
      };
    })
    .filter((h) => h.valueUsd > 1) // dust filter
    .sort((a, b) => b.valueUsd - a.valueUsd);

  return NextResponse.json({ holdings });
}
