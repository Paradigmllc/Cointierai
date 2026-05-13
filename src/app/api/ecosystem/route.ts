/**
 * DeFiLlama chain protocols ranking proxy.
 *   /api/ecosystem?chain=Ethereum  → top dApps on Ethereum by TVL
 */
import { NextResponse } from 'next/server';
import { getProtocols } from '@/lib/api/defillama';

export const revalidate = 3600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chain = url.searchParams.get('chain') ?? '';
  if (!chain) return NextResponse.json({ name: '', tvl: 0, protocols: [] });
  const protocols = await getProtocols().catch(() => []);
  const filtered = protocols
    .filter((p) => p.chains?.includes(chain) || p.chain === chain)
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
    .slice(0, 20)
    .map((p) => ({ name: p.name, tvl: p.tvl ?? 0, category: p.category }));
  const totalTvl = filtered.reduce((s, p) => s + p.tvl, 0);
  return NextResponse.json({ name: chain, tvl: totalTvl, protocols: filtered });
}
