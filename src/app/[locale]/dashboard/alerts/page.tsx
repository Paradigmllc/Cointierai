'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * Alerts — Free 1 件・Pro 無制限 (Notion L1693-1697)
 */
interface Alert {
  id: string;
  type: 'price_above' | 'price_below' | 'unlock' | 'ido_listing';
  coin_id: string;
  threshold?: number;
  enabled: boolean;
}

export default function AlertsPage() {
  const locale = useLocale();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [draft, setDraft] = useState<Omit<Alert, 'id'>>({ type: 'price_above', coin_id: '', threshold: 0, enabled: true });
  const isPro = false; // TODO(M3): Stripe subscription check
  const maxAlerts = isPro ? Infinity : 1;

  function addAlert() {
    if (alerts.length >= maxAlerts) {
      toast.error(locale === 'ja' ? `Free プランは ${maxAlerts} 件まで・Pro で無制限` : `Free is limited to ${maxAlerts}. Upgrade Pro for unlimited.`);
      return;
    }
    if (!draft.coin_id) {
      toast.error('Coin required');
      return;
    }
    const newAlert = { ...draft, id: `${Date.now()}` };
    setAlerts([...alerts, newAlert]);
    setDraft({ type: 'price_above', coin_id: '', threshold: 0, enabled: true });
    toast.success(locale === 'ja' ? 'アラート追加' : 'Alert added');
  }

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ja' ? 'アラート設定' : 'Alerts'}</h1>
          <p className="text-xs text-muted-foreground">
            {locale === 'ja' ? `${alerts.length} / ${isPro ? '∞' : maxAlerts} 件` : `${alerts.length} / ${isPro ? '∞' : maxAlerts} alerts`}
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
        <h2 className="font-semibold text-sm">{locale === 'ja' ? '新規アラート' : 'New alert'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as Alert['type'] })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="price_above">{locale === 'ja' ? '価格上昇' : 'Price above'}</option>
            <option value="price_below">{locale === 'ja' ? '価格下落' : 'Price below'}</option>
            <option value="unlock">{locale === 'ja' ? 'アンロック' : 'Unlock'}</option>
            <option value="ido_listing">{locale === 'ja' ? '新規 IDO' : 'New IDO'}</option>
          </select>
          <Input
            value={draft.coin_id}
            onChange={(e) => setDraft({ ...draft, coin_id: e.target.value })}
            placeholder={locale === 'ja' ? '銘柄 ID' : 'coin id (e.g. bitcoin)'}
          />
          {(draft.type === 'price_above' || draft.type === 'price_below') && (
            <Input
              type="number"
              value={draft.threshold ?? 0}
              onChange={(e) => setDraft({ ...draft, threshold: parseFloat(e.target.value) || 0 })}
              placeholder="USD"
            />
          )}
        </div>
        <Button onClick={addAlert} className="w-full" disabled={alerts.length >= maxAlerts}>
          <Plus className="h-4 w-4 mr-2" />
          {locale === 'ja' ? 'アラート追加' : 'Add alert'}
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-border/60 bg-card/30 p-3">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                <span className="font-medium">{a.coin_id}</span>
                {a.threshold !== undefined && a.threshold > 0 && <span className="text-muted-foreground">${a.threshold}</span>}
              </div>
              <button onClick={() => setAlerts(alerts.filter((x) => x.id !== a.id))} className="text-muted-foreground hover:text-loss">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isPro && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-center">
          {locale === 'ja' ? 'Pro でアラート無制限・プッシュ通知連携' : 'Upgrade Pro for unlimited alerts + push notifications'}
        </div>
      )}
    </div>
  );
}
