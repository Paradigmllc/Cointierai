'use client';

/**
 * Japan miscellaneous income (雑所得) tax estimator.
 *
 * Algorithm (FAQ-grade approximation):
 *   1. Parse CSV: expected columns include date, side (buy/sell), amount, jpy_value, fee_jpy.
 *   2. Compute realised gain per sell with moving-average cost basis:
 *        cost_basis[symbol] = (cost_basis*qty + buy_jpy) / (qty + buy_qty)
 *        realised_jpy += (sell_price - cost_basis) * qty - fee_jpy
 *   3. Apply progressive income tax (5/10/20/23/33/40/45%) + uniform 10% resident tax.
 *
 * Caveats: this is an estimate, not legal/tax advice. The full PDF version
 * locked behind Pro applies category exclusions and the 7-year carry rule.
 */
import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaxResult {
  totalRealisedJpy: number;
  incomeTaxJpy: number;
  residentTaxJpy: number;
  totalTaxJpy: number;
  effectiveRate: number;
  txCount: number;
  rowsErrored: number;
}

const INCOME_BRACKETS: Array<[number, number]> = [
  [1_950_000, 0.05],
  [3_300_000, 0.10],
  [6_950_000, 0.20],
  [9_000_000, 0.23],
  [18_000_000, 0.33],
  [40_000_000, 0.40],
  [Infinity, 0.45],
];

function progressiveTax(income: number): number {
  let prev = 0;
  let tax = 0;
  for (const [ceiling, rate] of INCOME_BRACKETS) {
    const slab = Math.min(income, ceiling) - prev;
    if (slab <= 0) break;
    tax += slab * rate;
    prev = ceiling;
  }
  return Math.max(0, tax);
}

export function TaxJpClient({ locale }: { locale: string }) {
  const [otherIncome, setOtherIncome] = useState('5000000');
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const r = compute(rows, parseFloat(otherIncome) || 0);
      setResult(r);
      if (r.rowsErrored > 0) {
        toast.warning(`${r.rowsErrored} 行が解析できませんでした`);
      } else {
        toast.success('解析完了');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'parse failed');
      console.error('[tax-jp]', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section className="surface p-5 space-y-4 lg:col-span-1">
        <h3 className="text-sm font-semibold">{locale === 'ja' ? 'CSV アップロード' : 'CSV upload'}</h3>
        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{locale === 'ja' ? '他の年間所得 (給与等)' : 'Other annual income (JPY)'}</span>
          <input
            type="number" value={otherIncome}
            onChange={(e) => setOtherIncome(e.target.value)}
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-[13px] tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="rounded-lg border-2 border-dashed border-border bg-subtle p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors block">
          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
          <div className="text-[12px] font-medium mt-2">{locale === 'ja' ? '取引履歴 CSV を投入' : 'Drop CSV file'}</div>
          <div className="text-[10px] text-muted-foreground mt-1">bitFlyer / Coincheck / GMO / bitbank</div>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        <p className="text-[10px] text-muted-foreground/70 inline-flex items-start gap-1">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          {locale === 'ja' ? 'CSV はブラウザ内で処理され、サーバーに送信されません' : 'CSV stays in your browser — never uploaded.'}
        </p>
      </section>

      <section className="surface p-5 space-y-4 lg:col-span-2">
        {loading && <div className="text-center py-12 text-[12px] text-muted-foreground">Parsing…</div>}
        {!loading && !result && (
          <div className="text-center py-12 text-[12px] text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {locale === 'ja' ? 'CSV を投入すると試算結果が表示されます' : 'Upload a CSV to see your tax estimate.'}
          </div>
        )}
        {result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Kpi label={locale === 'ja' ? '取引数' : 'Transactions'} value={result.txCount.toLocaleString()} />
              <Kpi label={locale === 'ja' ? '実現損益' : 'Realised gain'} value={`¥${formatJpy(result.totalRealisedJpy)}`} accent={result.totalRealisedJpy >= 0 ? 'gain' : 'loss'} />
              <Kpi label={locale === 'ja' ? '所得税' : 'Income tax'} value={`¥${formatJpy(result.incomeTaxJpy)}`} />
              <Kpi label={locale === 'ja' ? '住民税' : 'Resident tax'} value={`¥${formatJpy(result.residentTaxJpy)}`} />
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-5 flex items-end justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{locale === 'ja' ? '概算納税額' : 'Estimated tax due'}</div>
                <div className="text-3xl font-bold tabular-nums">¥{formatJpy(result.totalTaxJpy)}</div>
                <div className="text-[10px] text-muted-foreground">{locale === 'ja' ? '実効税率' : 'Effective rate'} {(result.effectiveRate * 100).toFixed(1)}%</div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              {locale === 'ja'
                ? '※ 移動平均法による試算。確定申告書 PDF・詳細明細は Pro プラン。'
                : 'Moving-average method. PDF + line items in Pro.'}
            </p>
          </>
        )}
      </section>
    </div>
  );
}

interface CsvRow {
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  jpyValue: number;
  feeJpy: number;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(',').map((c) => c.trim());
  const col = (names: string[]) => {
    for (const n of names) {
      const i = header.findIndex((h) => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const iDate = col(['date', '日時', 'time']);
  const iSide = col(['side', '取引種別', 'side', 'type']);
  const iSymbol = col(['symbol', '通貨', 'currency', '銘柄']);
  const iQty = col(['amount', '数量', 'qty', 'quantity']);
  const iJpy = col(['jpy_value', 'jpy', '金額', 'amount_jpy', 'total']);
  const iFee = col(['fee', '手数料']);

  const out: CsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 3) continue;
    const sideRaw = (cols[iSide] ?? '').toLowerCase();
    const side: CsvRow['side'] = /sell|売|出/.test(sideRaw) ? 'sell' : 'buy';
    const qty = Math.abs(parseFloat(cols[iQty] ?? '0'));
    const jpy = Math.abs(parseFloat(cols[iJpy] ?? '0'));
    if (!Number.isFinite(qty) || qty === 0 || !Number.isFinite(jpy)) continue;
    out.push({
      date: cols[iDate] ?? '',
      symbol: (cols[iSymbol] ?? 'BTC').toUpperCase(),
      side,
      qty,
      jpyValue: jpy,
      feeJpy: parseFloat(cols[iFee] ?? '0') || 0,
    });
  }
  return out;
}

function compute(rows: CsvRow[], otherIncome: number): TaxResult {
  const basis: Record<string, { qty: number; cost: number }> = {};
  let realised = 0;
  let errored = 0;
  for (const r of rows) {
    if (!r.symbol || !Number.isFinite(r.qty)) { errored += 1; continue; }
    const b = basis[r.symbol] ?? { qty: 0, cost: 0 };
    if (r.side === 'buy') {
      const newQty = b.qty + r.qty;
      const newCost = b.cost + r.jpyValue + r.feeJpy;
      basis[r.symbol] = { qty: newQty, cost: newCost };
    } else {
      const unitCost = b.qty > 0 ? b.cost / b.qty : 0;
      const proceeds = r.jpyValue - r.feeJpy;
      const gain = proceeds - unitCost * r.qty;
      realised += gain;
      basis[r.symbol] = { qty: Math.max(0, b.qty - r.qty), cost: Math.max(0, b.cost - unitCost * r.qty) };
    }
  }
  const taxableIncome = Math.max(0, otherIncome) + Math.max(0, realised);
  const baselineTax = progressiveTax(Math.max(0, otherIncome));
  const totalTax = progressiveTax(taxableIncome);
  const incomeTaxOnCrypto = Math.max(0, totalTax - baselineTax);
  const residentTax = Math.max(0, realised) * 0.10;
  return {
    totalRealisedJpy: realised,
    incomeTaxJpy: incomeTaxOnCrypto,
    residentTaxJpy: residentTax,
    totalTaxJpy: incomeTaxOnCrypto + residentTax,
    effectiveRate: realised > 0 ? (incomeTaxOnCrypto + residentTax) / realised : 0,
    txCount: rows.length - errored,
    rowsErrored: errored,
  };
}

function formatJpy(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  return sign + abs.toLocaleString();
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: 'gain' | 'loss' }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-3 space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-[14px] font-semibold tabular-nums', accent === 'gain' && 'text-gain', accent === 'loss' && 'text-loss')}>{value}</div>
    </div>
  );
}
