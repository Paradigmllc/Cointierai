/**
 * SSOT-first ecosystem dApps. Reads cointier.dex_rankings & coins tables
 * (chain-scoped). dApps per chain come from a future ingest of DefiLlama protocols.
 */
import { Layers } from 'lucide-react';
import { createServiceSupabase } from '@/lib/db/supabase';
import { formatCompact } from '@/lib/utils';

interface Props {
  chain: string | null;
  locale: 'ja' | 'en' | string;
}

export async function EcosystemDappsPanel({ chain, locale }: Props) {
  if (!chain) return null;
  const supabase = createServiceSupabase();
  // Reuse dex_rankings as a proxy for ecosystem volume per chain (until a
  // dedicated ecosystem_protocols ingest is added).
  const { data: dexs } = await supabase
    .from('dex_rankings')
    .select('name, total_24h_usd, category, chains')
    .contains('chains', [chain])
    .order('total_24h_usd', { ascending: false })
    .limit(10);
  const protocols = (dexs ?? []) as Array<{ name: string; total_24h_usd: number | null; category: string | null }>;
  if (protocols.length === 0) return null;

  const tvl = protocols.reduce((s, p) => s + (p.total_24h_usd ?? 0), 0);

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />{locale === 'ja' ? 'エコシステム dApps' : 'Ecosystem dApps'}</h2>
        <span className="text-[10px] text-muted-foreground">{chain} · ${formatCompact(tvl)} 24h DEX vol</span>
      </div>
      <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
        {protocols.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 px-3 py-2 text-[12px]">
            <span className="text-muted-foreground text-[10px] w-5">#{i + 1}</span>
            <span className="font-medium flex-1 truncate">{p.name}</span>
            {p.category && <span className="text-[10px] text-muted-foreground">{p.category}</span>}
            <span className="num tabular-nums w-24 text-right shrink-0">${formatCompact(p.total_24h_usd ?? 0)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
