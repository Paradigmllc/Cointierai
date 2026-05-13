/**
 * Hyperliquid Production Client — 取引履歴インポート + Builder Fee tracking
 *
 * Notion L1649-1650, L2153-2161:
 *   - ユーザーのウォレットアドレスから過去取引を fetch
 *   - Builder Fee の永続収益を追跡
 *   - 損益計算 → 税務レポートに連携
 *
 * @nktkas/hyperliquid SDK 互換の独自 fetch 実装 (依存最小化)
 */

const HL_INFO = 'https://api.hyperliquid.xyz/info';

export interface HlUserFill {
  coin: string;
  px: string;       // execution price
  sz: string;       // size
  side: 'B' | 'A';  // Buy / Ask (sell)
  time: number;     // ms timestamp
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  builderFee?: string;
  feeToken: string;
  tid: number;
}

export interface HlBuilderRevenue {
  builder: string;
  totalNotional: number;   // 取引量合計
  totalFeesUsd: number;    // Cointier が受け取った Builder Fee 合計
  uniqueUsers: number;
}

async function hlPost<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(HL_INFO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Hyperliquid ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/**
 * ユーザー (wallet address) の過去取引 fill 取得
 *
 * @param user wallet address (0x...)
 * @param startTime ms timestamp (default: 30 days ago)
 */
export async function getUserFills(user: string, startTime?: number): Promise<HlUserFill[]> {
  const since = startTime ?? Date.now() - 30 * 86_400_000;
  return hlPost<HlUserFill[]>({
    type: 'userFillsByTime',
    user: user.toLowerCase(),
    startTime: since,
  });
}

/**
 * Builder Fee 承認状態確認
 *  - 0 なら未承認 / 0.0005 (= 0.05%) なら承認済
 */
export async function getApprovedMaxBuilderFee(user: string, builder: string): Promise<number> {
  try {
    const result = await hlPost<{ maxFeeRate: string }>({
      type: 'maxBuilderFee',
      user: user.toLowerCase(),
      builder: builder.toLowerCase(),
    });
    // result.maxFeeRate is decimal string e.g. "0.0005"
    return parseFloat(result.maxFeeRate ?? '0');
  } catch (e) {
    console.warn('[hyperliquid-client] approval check failed', e);
    return 0;
  }
}

/**
 * Builder 収益集計 — Cointier 自身の wallet を builder として渡す
 *
 * 戻り値: 取引量・手数料合計・ユニークユーザー数
 */
export async function getBuilderRevenue(builderAddress: string, daysBack = 30): Promise<HlBuilderRevenue> {
  // Hyperliquid API では builder の収益集計エンドポイントが直接ない
  // 代替: builder_fee_approvals に紐付いた wallet 群の fills を集計
  // (本実装は scripts/aggregate-builder-revenue.ts で n8n cron 実行)
  return {
    builder: builderAddress,
    totalNotional: 0,
    totalFeesUsd: 0,
    uniqueUsers: 0,
  };
}
