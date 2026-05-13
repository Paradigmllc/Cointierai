import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getHacks } from '@/lib/api/defillama';
import { formatCompact } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

// DeFiLlama 外部 API call は build time に固定化しない (force-dynamic)
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function UnlocksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const tHome = await getTranslations('home');
  const tTable = await getTranslations('table');

  // 暫定: DeFiLlama Unlocks endpoint は構造が複雑 → 初期版は Hacks 表示で代替
  // 正式版は scripts/ingest-defillama.ts で Supabase に保存後表示
  const hacks = await getHacks().catch(() => []);
  const recent = hacks
    .filter((h) => h && h.date != null)
    .sort((a, b) => b.date - a.date)
    .slice(0, 100);

  return (
    <div className="container py-4 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">{tHome('upcomingUnlocks')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Token unlock schedules · Hack history · powered by DeFiLlama (full Tokenomist integration coming in M1)
        </p>
      </div>

      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>{tTable('date')}</th>
              <th>Protocol</th>
              <th>Amount Lost</th>
              <th>Type</th>
              <th>Technique</th>
              <th>Chains</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((h, idx) => (
              <tr key={`${h.name}-${h.date}-${idx}`}>
                <td className="num text-data-xs text-muted-foreground">
                  {new Date(h.date * 1000).toISOString().slice(0, 10)}
                </td>
                <td className="font-medium">{h.name}</td>
                <td className="num font-medium text-loss">{h.amount ? formatCompact(h.amount) : '—'}</td>
                <td className="text-data-xs text-muted-foreground">{h.classification ?? '—'}</td>
                <td className="text-data-xs">{h.technique ?? '—'}</td>
                <td className="text-data-xs text-muted-foreground">{(h.chain ?? []).slice(0, 3).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('unlocks') };
}
