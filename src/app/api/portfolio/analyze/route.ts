import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/db/supabase';

/**
 * Portfolio AI 分析 endpoint (Notion L1660-1669)
 *
 * 入力: wallet address (Ethereum / Arbitrum)
 * 処理:
 *   1. Etherscan / Arbiscan API で保有銘柄取得 (ERC-20 残高)
 *   2. coins テーブルから各銘柄の market_cap / unlock 情報を JOIN
 *   3. アンロックリスク・VC 集中リスク・流動性リスクを集計
 *   4. (M4) DeepSeek V4 Pro で個別アラート生成
 */
export async function POST(req: NextRequest) {
  try {
    const { address, locale = 'ja' } = (await req.json()) as { address: string; locale?: string };
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: 'invalid address' }, { status: 400 });
    }

    // TODO(M4): Etherscan API で実 holdings 取得
    // 現状は Mock data (UI 確認用)
    const supabase = createServiceSupabase();
    const { data: topCoins } = await supabase
      .from('coins')
      .select('id, symbol, name, price_usd, market_cap_usd, tier')
      .order('market_cap_usd', { ascending: false, nullsFirst: false })
      .limit(5);

    const mockHoldings = (topCoins ?? []).map((c, i) => ({
      symbol: c.symbol.toUpperCase(),
      value: 1000 * (5 - i),
      allocation: (5 - i) / 15,
    }));

    return NextResponse.json({
      totalValueUsd: mockHoldings.reduce((s, h) => s + h.value, 0),
      coinCount: mockHoldings.length,
      riskScore: 67,
      alerts: [
        {
          type: 'unlock',
          severity: 'high',
          message: locale === 'ja'
            ? 'XYZ token unlock in 3 days · 5% of supply · 過去同条件で平均 -12%'
            : 'XYZ token unlock in 3 days · 5% of supply · historical avg -12%',
        },
        {
          type: 'concentration',
          severity: 'medium',
          message: locale === 'ja'
            ? '40% を単一 VC 系プロジェクトに集中'
            : '40% concentrated in single VC-backed project',
        },
      ],
      topHoldings: mockHoldings,
      _notice: 'Mock data — full holdings sync via Etherscan in M4',
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
