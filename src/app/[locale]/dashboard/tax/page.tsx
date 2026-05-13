'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FileText, Download, Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { computeTaxJp, estimateIncomeTaxJp, type Trade } from '@/lib/tax-jp/calculate';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * 日本雑所得・確定申告サマリー (Notion L1641-1644 — 最強ロックイン)
 *
 * 機能:
 *   - 取引履歴 CSV インポート
 *   - 移動平均法で年内損益計算
 *   - 累進課税 (5-45%) + 住民税 10% 試算
 *   - PDF 出力 (将来実装)
 *
 * Pattern B 中立教育者風 — 「確定申告書作成サポート」表現
 */
export default function TaxReportPage() {
  const tT = useTranslations();
  const locale = useLocale();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear() - 1);
  const [otherIncomeJpy, setOtherIncomeJpy] = useState<number>(0);

  const result = useMemo(() => trades.length > 0 ? computeTaxJp(trades, fiscalYear, 'moving_average') : null, [trades, fiscalYear]);
  const taxEstimate = useMemo(() => {
  const tT = useTranslations();
    if (!result) return null;
    return estimateIncomeTaxJp(otherIncomeJpy + result.net_gain_jpy);
  }, [result, otherIncomeJpy]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? '');
      try {
        const parsed = parseCsv(text);
        setTrades(parsed);
        toast.success(`${parsed.length} 件の取引を読み込みました`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'CSV パースに失敗しました');
        console.error('csv parse error', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container py-4 max-w-4xl space-y-8">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-gain/10">
          <FileText className="h-6 w-6 text-gain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {tT('dashTax.taxReport')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {tT('dashTax.jpMiscellaneousIncomeMethodProvided')}
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
        <h2 className="font-semibold text-sm">{tT('dashTax.1UploadTrades')}</h2>
        <p className="text-xs text-muted-foreground">
          {tT('dashTax.supportedGmoCoinBitflyerCoincheck')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="csv" className="cursor-pointer">
            <Button asChild>
              <span>{tT('dashTax.selectCsv')}</span>
            </Button>
          </label>
          <input id="csv" type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          <span className="text-xs text-muted-foreground">
            {trades.length > 0 ? `${trades.length} ${tT('dashTax.tradesLoaded')}` : (tT('dashTax.noFile'))}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
        <h2 className="font-semibold text-sm">{tT('dashTax.2Settings')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">{tT('dashTax.fiscalYear')}</label>
            <Input
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
              min={2020}
              max={new Date().getFullYear()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">{tT('dashTax.otherIncomeJpy')}</label>
            <Input
              type="number"
              value={otherIncomeJpy}
              onChange={(e) => setOtherIncomeJpy(parseInt(e.target.value, 10) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            {locale === 'ja' ? `${fiscalYear} 年 集計結果` : `${fiscalYear} Summary`}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label={tT('dashTax.trades')} value={result.total_trades.toString()} />
            <StatBox label={tT('dashTax.sells')} value={result.sell_trades.toString()} />
            <StatBox label={tT('dashTax.totalGain')} value={`¥${result.total_gain_jpy.toLocaleString()}`} color="gain" />
            <StatBox label={tT('dashTax.totalLoss')} value={`¥${result.total_loss_jpy.toLocaleString()}`} color="loss" />
          </div>

          <div className="border-t border-border/40 pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{tT('dashTax.netGainMiscellaneousIncome')}</div>
              <div className={cn('text-xl md:text-2xl font-semibold num', result.net_gain_jpy >= 0 ? 'text-gain' : 'text-loss')}>
                ¥{result.net_gain_jpy.toLocaleString()}
              </div>
            </div>
            {taxEstimate && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{tT('dashTax.estimatedTax')}</div>
                <div className="text-2xl font-bold num">¥{taxEstimate.total.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">{locale === 'ja' ? `税率ブラケット ${taxEstimate.bracket}` : `Bracket ${taxEstimate.bracket}`}</div>
              </div>
            )}
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-md border border-tier-d/40 bg-tier-d/5 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-tier-d">
                <AlertTriangle className="h-3.5 w-3.5" />
                {tT('dashTax.warnings')}
              </div>
              <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                {result.warnings.slice(0, 5).map((w, i) => (<li key={i}>· {w}</li>))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button disabled className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {tT('dashTax.pdfDownloadPro')}
            </Button>
            <Badge variant="secondary" className="self-center text-[10px]">Pro 限定機能</Badge>
          </div>

          <p className="text-[10px] text-muted-foreground/80 pt-2">
            {tT('dashTax.referenceOnlyConsultATax')}
          </p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: 'gain' | 'loss' }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/50 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn('num font-semibold mt-1', color === 'gain' && 'text-gain', color === 'loss' && 'text-loss')}>{value}</div>
    </div>
  );
}

/** Simplistic CSV parser — 国内取引所の標準フォーマット想定 */
function parseCsv(text: string): Trade[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(',').map((c) => c.trim());
  const idx = (key: string) => header.findIndex((h) => h.includes(key));
  const iSym = idx('symbol') !== -1 ? idx('symbol') : idx('銘柄');
  const iSide = idx('side') !== -1 ? idx('side') : idx('種別');
  const iAmt = idx('amount') !== -1 ? idx('amount') : idx('数量');
  const iPrice = idx('price') !== -1 ? idx('price') : idx('価格');
  const iFee = idx('fee') !== -1 ? idx('fee') : idx('手数料');
  const iDate = idx('date') !== -1 ? idx('date') : idx('日時');

  const rows: Trade[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const symbol = (cols[iSym] ?? '').toUpperCase();
    const sideStr = (cols[iSide] ?? '').toLowerCase();
    const side: Trade['trade_type'] =
      sideStr.includes('buy') || sideStr.includes('買') ? 'buy' :
      sideStr.includes('sell') || sideStr.includes('売') ? 'sell' :
      sideStr.includes('in') || sideStr.includes('入') ? 'transfer_in' : 'transfer_out';
    if (!symbol) continue;
    rows.push({
      id: `csv-${i}`,
      coin_id: symbol.toLowerCase(),
      symbol,
      trade_type: side,
      amount: parseFloat(cols[iAmt] ?? '0') || 0,
      price_jpy: parseFloat(cols[iPrice] ?? '0') || 0,
      fee_jpy: parseFloat(cols[iFee] ?? '0') || 0,
      executed_at: new Date(cols[iDate] ?? Date.now()).toISOString(),
    });
  }
  return rows;
}
