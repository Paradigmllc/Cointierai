'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLocale } from 'next-intl';
import { Wallet, Activity, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { toast } from 'sonner';

/**
 * Pro ポートフォリオ AI 分析 (Notion L1660-1669)
 *
 * 「あなたの保有銘柄のトークンアンロックが 3 日後にあります。
 *  過去の同条件では平均 -12% の価格影響がありました」
 *
 * 機能:
 *   - ウォレットアドレスから保有銘柄取得 (etherscan / arbiscan)
 *   - 各銘柄のアンロック予定スキャン
 *   - VC 集中リスク
 *   - AI による「3 日後にこのアンロックがある」アラート生成
 */
export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const locale = useLocale();
  const [manualAddress, setManualAddress] = useState('');
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeAddress = async (addr: string) => {
    if (!addr) {
      toast.error('Address required');
      return;
    }
    setLoading(true);
    try {
      // TODO(M4): /api/portfolio/analyze で wallet → holdings → AI 分析
      const res = await fetch('/api/portfolio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, locale }),
      });
      if (res.ok) {
        const data = (await res.json()) as PortfolioAnalysis;
        setAnalysis(data);
      } else {
        // Mock data fallback (M4 で実装予定)
        setAnalysis({
          totalValueUsd: 12_345,
          coinCount: 8,
          riskScore: 67,
          alerts: [
            { type: 'unlock', severity: 'high', message: 'XYZ token unlock in 3 days · 5% of supply · historical avg -12%' },
            { type: 'concentration', severity: 'medium', message: '40% allocated to single VC-backed project' },
          ],
          topHoldings: [
            { symbol: 'BTC', value: 5000, allocation: 0.40 },
            { symbol: 'ETH', value: 3000, allocation: 0.24 },
            { symbol: 'SOL', value: 2000, allocation: 0.16 },
          ],
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const targetAddress = isConnected && address ? address : manualAddress;

  return (
    <div className="container py-4 max-w-4xl space-y-8">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {locale === 'ja' ? 'ポートフォリオ AI 分析' : 'Portfolio AI Analysis'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {locale === 'ja'
              ? '保有銘柄の AI リスクスコアとアンロック影響予測'
              : 'AI risk scoring and unlock impact prediction'}
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          {locale === 'ja' ? 'ウォレット指定' : 'Specify wallet'}
        </h2>

        <div className="space-y-3">
          {!isConnected && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {locale === 'ja' ? 'ウォレットを接続するか手動でアドレスを入力' : 'Connect wallet or paste address manually'}
              </p>
              <div className="flex gap-2">
                <ConnectWalletButton autoOpenBuilderFee={true} />
                <span className="self-center text-xs text-muted-foreground">{locale === 'ja' ? 'または' : 'or'}</span>
                <Input value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} placeholder="0x..." className="flex-1" />
              </div>
            </div>
          )}

          {isConnected && address && (
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-gain" />
              <span className="text-muted-foreground">{locale === 'ja' ? '接続中:' : 'Connected:'}</span>
              <span className="num font-mono text-xs">{address.slice(0, 8)}…{address.slice(-6)}</span>
            </div>
          )}

          <Button onClick={() => analyzeAddress(targetAddress)} disabled={!targetAddress || loading} className="w-full">
            {loading ? (locale === 'ja' ? '分析中…' : 'Analyzing…') : (locale === 'ja' ? '分析開始' : 'Analyze')}
          </Button>
        </div>
      </div>

      {analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label={locale === 'ja' ? '総評価額' : 'Total value'} value={`$${analysis.totalValueUsd.toLocaleString()}`} icon={<TrendingUp className="h-4 w-4 text-gain" />} />
            <StatCard label={locale === 'ja' ? '保有銘柄数' : 'Coin count'} value={analysis.coinCount.toString()} icon={<Activity className="h-4 w-4 text-primary" />} />
            <StatCard label={locale === 'ja' ? 'リスクスコア' : 'Risk score'} value={`${analysis.riskScore}/100`} icon={<AlertTriangle className="h-4 w-4 text-tier-d" />} />
          </div>

          {/* Alerts */}
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-tier-d" />
              {locale === 'ja' ? '注目すべきイベント' : 'Notable events'}
            </h2>
            {analysis.alerts.map((a, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${
                  a.severity === 'high'
                    ? 'border-loss/30 bg-loss/5'
                    : a.severity === 'medium'
                    ? 'border-tier-d/30 bg-tier-d/5'
                    : 'border-border/40 bg-card/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={a.severity === 'high' ? 'destructive' : 'warning'} className="text-[10px]">
                    {a.severity}
                  </Badge>
                  <span className="text-sm">{a.message}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top holdings */}
          <div className="space-y-2">
            <h2 className="font-semibold">{locale === 'ja' ? '主要保有銘柄' : 'Top holdings'}</h2>
            <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
              <table className="data-table">
                <thead>
                  <tr><th>Symbol</th><th>USD</th><th>%</th></tr>
                </thead>
                <tbody>
                  {analysis.topHoldings.map((h) => (
                    <tr key={h.symbol}>
                      <td className="font-medium">{h.symbol}</td>
                      <td className="num">${h.value.toLocaleString()}</td>
                      <td className="num">{(h.allocation * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Badge variant="secondary" className="text-[10px]">Mock data (M4 で AI 実装予定)</Badge>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        {icon}
      </div>
      <div className="num text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

interface PortfolioAnalysis {
  totalValueUsd: number;
  coinCount: number;
  riskScore: number;
  alerts: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }>;
  topHoldings: Array<{ symbol: string; value: number; allocation: number }>;
}
