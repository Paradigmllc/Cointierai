/**
 * SSOT-first derivatives panel. Reads cointier.derivatives_snapshots
 * (populated by ingestDerivatives cron every 15 min).
 */
import { Zap } from 'lucide-react';
import { getDerivativesHistory } from '@/lib/db/ssot-queries';
import { DerivativesHistoryCharts } from './DerivativesHistoryCharts';

interface Props {
  symbol: string;
  locale: 'ja' | 'en' | string;
}

export async function DerivativesHistoryPanel({ symbol, locale }: Props) {
  const history = await getDerivativesHistory(symbol, 168);
  if (history.length === 0) return null;

  return (
    <section className="surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{locale === 'ja' ? 'デリバティブ履歴' : 'Derivatives history'}</h2>
        <span className="text-[10px] text-muted-foreground">Coinglass · {history.length} pts</span>
      </div>
      <DerivativesHistoryCharts history={history} />
    </section>
  );
}
