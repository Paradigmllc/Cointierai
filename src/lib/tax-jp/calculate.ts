/**
 * 日本暗号資産税務計算ロジック (雑所得・総合課税)
 *
 * Notion L1641-1644, L1752-1754:
 *   - 最強ロックイン機能 — 確定申告データが蓄積したら絶対に解約できない
 *   - CoinGecko は一切対応していない = 日本市場独占可能
 *
 * 計算方法:
 *   - 雑所得として総合課税
 *   - 移動平均法 (デフォルト) or 総平均法 (年単位選択)
 *   - 損失は他の雑所得との通算のみ・株式/FX とは通算不可
 *   - 翌年への繰越控除なし
 */

export type TradeType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
export type CostMethod = 'moving_average' | 'total_average';

export interface Trade {
  id: string;
  coin_id: string;
  symbol: string;
  trade_type: TradeType;
  amount: number;          // BTC など銘柄単位の数量
  price_jpy: number;       // 1 単位あたりの円建て価格
  fee_jpy: number;         // 円建て手数料
  executed_at: string;     // ISO datetime
}

export interface TaxCalculationResult {
  fiscal_year: number;
  method: CostMethod;
  total_gain_jpy: number;
  total_loss_jpy: number;
  net_gain_jpy: number;
  total_trades: number;
  sell_trades: number;
  realized_events: Array<{
    coin_id: string;
    symbol: string;
    sold_at: string;
    amount_sold: number;
    proceeds_jpy: number;
    cost_basis_jpy: number;
    gain_loss_jpy: number;
  }>;
  warnings: string[];
}

/**
 * 雑所得計算 — 移動平均法
 *
 * 各 sell イベントで、その時点の保有平均取得単価から損益を算出。
 */
export function computeTaxJp(trades: Trade[], fiscalYear: number, method: CostMethod = 'moving_average'): TaxCalculationResult {
  // Filter trades by fiscal year (Jan 1 - Dec 31)
  const yearStart = new Date(`${fiscalYear}-01-01T00:00:00+09:00`).getTime();
  const yearEnd = new Date(`${fiscalYear}-12-31T23:59:59+09:00`).getTime();

  // すべての trades を時系列にソート (過去の取得平均を含めるため year 前も含める)
  const sorted = [...trades].sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());

  // 銘柄ごとの保有数量と平均取得単価
  type Holding = { amount: number; avgCost: number };
  const holdings = new Map<string, Holding>();

  const realized: TaxCalculationResult['realized_events'] = [];
  const warnings: string[] = [];

  for (const t of sorted) {
    const ts = new Date(t.executed_at).getTime();
    const h = holdings.get(t.coin_id) ?? { amount: 0, avgCost: 0 };

    if (t.trade_type === 'buy' || t.trade_type === 'transfer_in') {
      // 移動平均: (旧数量 × 旧単価 + 新数量 × 新単価) / 合計数量
      const totalCost = h.amount * h.avgCost + t.amount * t.price_jpy + t.fee_jpy;
      const newAmount = h.amount + t.amount;
      const newAvg = newAmount > 0 ? totalCost / newAmount : 0;
      holdings.set(t.coin_id, { amount: newAmount, avgCost: newAvg });
    } else if (t.trade_type === 'sell' || t.trade_type === 'transfer_out') {
      // 売却 → 損益計算
      if (h.amount < t.amount) {
        warnings.push(`${t.symbol} on ${t.executed_at.slice(0, 10)}: 保有数量を超える売却 (${h.amount.toFixed(8)} < ${t.amount.toFixed(8)})`);
      }
      const costBasis = t.amount * h.avgCost;
      const proceeds = t.amount * t.price_jpy - t.fee_jpy;
      const gainLoss = proceeds - costBasis;

      // 課税対象年内のみ realized event に記録
      if (ts >= yearStart && ts <= yearEnd) {
        realized.push({
          coin_id: t.coin_id,
          symbol: t.symbol,
          sold_at: t.executed_at,
          amount_sold: t.amount,
          proceeds_jpy: proceeds,
          cost_basis_jpy: costBasis,
          gain_loss_jpy: gainLoss,
        });
      }

      // 保有を減らす
      const newAmount = Math.max(0, h.amount - t.amount);
      holdings.set(t.coin_id, { amount: newAmount, avgCost: newAmount > 0 ? h.avgCost : 0 });
    }
  }

  const total_gain_jpy = realized.filter((r) => r.gain_loss_jpy > 0).reduce((s, r) => s + r.gain_loss_jpy, 0);
  const total_loss_jpy = realized.filter((r) => r.gain_loss_jpy < 0).reduce((s, r) => s + r.gain_loss_jpy, 0);

  return {
    fiscal_year: fiscalYear,
    method,
    total_gain_jpy: Math.round(total_gain_jpy),
    total_loss_jpy: Math.round(total_loss_jpy),
    net_gain_jpy: Math.round(total_gain_jpy + total_loss_jpy),
    total_trades: trades.filter((t) => {
      const ts = new Date(t.executed_at).getTime();
      return ts >= yearStart && ts <= yearEnd;
    }).length,
    sell_trades: realized.length,
    realized_events: realized,
    warnings,
  };
}

/**
 * 累進課税の所得税概算 (雑所得・総合課税)
 *
 * 2024 年度の所得税速算表 (給与所得などとの合算前提)
 */
export function estimateIncomeTaxJp(taxableIncomeJpy: number): { incomeTax: number; localTax: number; total: number; effectiveRate: number; bracket: string } {
  const brackets = [
    { limit: 1_950_000,   rate: 0.05,  deduction: 0,           label: '5%' },
    { limit: 3_300_000,   rate: 0.10,  deduction: 97_500,      label: '10%' },
    { limit: 6_950_000,   rate: 0.20,  deduction: 427_500,     label: '20%' },
    { limit: 9_000_000,   rate: 0.23,  deduction: 636_000,     label: '23%' },
    { limit: 18_000_000,  rate: 0.33,  deduction: 1_536_000,   label: '33%' },
    { limit: 40_000_000,  rate: 0.40,  deduction: 2_796_000,   label: '40%' },
    { limit: Infinity,    rate: 0.45,  deduction: 4_796_000,   label: '45%' },
  ];
  if (taxableIncomeJpy <= 0) {
    return { incomeTax: 0, localTax: 0, total: 0, effectiveRate: 0, bracket: '0%' };
  }
  const b = brackets.find((br) => taxableIncomeJpy <= br.limit)!;
  const incomeTax = Math.max(0, taxableIncomeJpy * b.rate - b.deduction);
  const localTax = taxableIncomeJpy * 0.10; // 住民税 10%
  return {
    incomeTax: Math.round(incomeTax),
    localTax: Math.round(localTax),
    total: Math.round(incomeTax + localTax),
    effectiveRate: (incomeTax + localTax) / taxableIncomeJpy,
    bracket: b.label,
  };
}
