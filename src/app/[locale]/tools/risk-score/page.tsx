'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Aha Moment ツール — ウォレットアドレス入力 → リスクスコア 即表示
 * TODO(tier-eval): 実際の AI 算出は src/lib/tier-evaluation/score.ts へ
 *                  現状はモックロジック (UI 完成度確認用)
 */
export default function RiskScorePage() {
  const t = useTranslations('tools.riskScore');
  const [address, setAddress] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [factors, setFactors] = useState<Array<{ name: string; score: number; weight: number }>>([]);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!address.trim()) {
      toast.error('Wallet address is required');
      return;
    }
    setLoading(true);
    try {
      // TODO: 実装は POST /api/risk-score へ
      // 現状はモック (UI 確認用)
      await new Promise((r) => setTimeout(r, 800));
      const mockScore = 30 + Math.floor(Math.random() * 60);
      setScore(mockScore);
      setFactors([
        { name: 'Liquidity Risk', score: 70 + Math.random() * 30, weight: 0.25 },
        { name: 'Unlock Risk', score: 40 + Math.random() * 40, weight: 0.2 },
        { name: 'VC Concentration', score: 50 + Math.random() * 30, weight: 0.15 },
        { name: 'Regulatory Risk', score: 60 + Math.random() * 30, weight: 0.2 },
        { name: 'Volatility', score: 30 + Math.random() * 40, weight: 0.2 },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const share = () => {
    if (score === null) return;
    const text = `My crypto portfolio risk score is ${score}/100. What's yours? → cointier.ai/tools/risk-score`;
    if (navigator.share) {
      navigator.share({ title: 'Cointier Risk Score', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="container py-10 max-w-2xl space-y-8">
      <header className="space-y-2 text-center">
        <div className="inline-flex p-3 rounded-full bg-tier-d/10 text-tier-d">
          <Activity className="h-6 w-6" />
        </div>
        <h1 className="text-xl md:text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="space-y-3 max-w-md mx-auto">
        <label className="text-sm font-medium">{t('inputLabel')}</label>
        <div className="flex gap-2">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('inputPlaceholder')}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
          />
          <Button onClick={analyze} disabled={loading}>
            {loading ? '...' : t('analyze')}
          </Button>
        </div>
      </div>

      {score !== null && (
        <div className="rounded-xl border border-border/60 bg-card/30 p-8 space-y-6 max-w-md mx-auto">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t('yourScore')}</p>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 283} 283`}
                  className={cn(
                    'transition-all duration-1000',
                    score > 70 ? 'text-loss' : score > 40 ? 'text-tier-d' : 'text-gain',
                  )}
                />
              </svg>
              <div className="absolute text-4xl font-bold num">{score}</div>
            </div>
            <p className="text-xs text-muted-foreground">/ 100 (higher = riskier)</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">{t('factors')}</h3>
            <ul className="space-y-2">
              {factors.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-28 text-muted-foreground shrink-0">{f.name}</span>
                  <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className={cn('h-full', f.score > 70 ? 'bg-loss' : f.score > 40 ? 'bg-tier-d' : 'bg-gain')} style={{ width: `${f.score}%` }} />
                  </div>
                  <span className="num w-8 text-right tabular-nums">{f.score.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={share} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              {t('share')}
            </Button>
            <Badge variant="secondary" className="self-center">Mock data · M1 で AI 実装</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
