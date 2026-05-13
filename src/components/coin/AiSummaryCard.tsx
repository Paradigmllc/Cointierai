'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AiSummaryCardProps {
  symbol: string;
  initialSummary: string | null;
  generatedAt?: string | null;
  sourceCount?: number;
}

/**
 * AI Summary Card with on-demand regeneration (Pro 機能)
 *
 * - 初期表示は SSR で渡された summary
 * - 「再生成」ボタンで強制的に新しいサマリーを取得
 * - Loading state with skeleton
 * - Error fallback: 直前のキャッシュ表示
 */
export function AiSummaryCard({ symbol, initialSummary, generatedAt, sourceCount }: AiSummaryCardProps) {
  const tT = useTranslations();
  const locale = useLocale();
  const [summary, setSummary] = useState(initialSummary);
  const [generatedAtState, setGeneratedAtState] = useState(generatedAt);
  const [loading, setLoading] = useState(false);

  const regenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/summary/${symbol}?locale=${locale}&force=1`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { summary: string; generated_at: string };
      setSummary(data.summary);
      setGeneratedAtState(data.generated_at);
      toast.success(tT('aiSummary.summaryRegenerated'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  // 生成: from DB? 30 日以内かを判定
  const isStale = generatedAtState && (Date.now() - new Date(generatedAtState).getTime()) / 86_400_000 > 30;

  if (!summary && !loading) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{tT('aiSummary.aiAnalysis')}</span>
        </div>
        <Button onClick={regenerate} size="sm" variant="outline" disabled={loading}>
          {tT('aiSummary.generateAiSummary3s')}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-sm flex items-center gap-2 flex-wrap">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-primary">{tT('aiSummary.aiAnalysisNeutralEducator')}</span>
          <Badge variant="secondary" className="text-[10px]">DeepSeek V4 Pro · {locale}</Badge>
          {sourceCount && (
            <Badge variant="outline" className="text-[10px]">{sourceCount} sources merged</Badge>
          )}
          {isStale && <Badge variant="warning" className="text-[10px]">{tT('aiSummary.updateAvailable')}</Badge>}
        </h2>
        <Button onClick={regenerate} size="xs" variant="ghost" disabled={loading} title={tT('aiSummary.regenerate')}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-muted/40 rounded animate-pulse" />
          <div className="h-3 bg-muted/40 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-muted/40 rounded animate-pulse w-4/5" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{summary}</p>
      )}

      {generatedAtState && (
        <p className="text-[10px] text-muted-foreground">
          {tT('aiSummary.generated')} {new Date(generatedAtState).toLocaleString(tT('aiSummary.enUs'))}
        </p>
      )}
    </div>
  );
}
