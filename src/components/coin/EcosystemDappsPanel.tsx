'use client';

import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { formatCompact } from '@/lib/utils';

interface Props {
  chain: string | null;
  locale: 'ja' | 'en' | string;
}

interface ChainTvl {
  name: string;
  tvl: number;
  protocols: Array<{ name: string; tvl: number; category: string | null }>;
}

export function EcosystemDappsPanel({ chain, locale }: Props) {
  const [data, setData] = useState<ChainTvl | null>(null);

  useEffect(() => {
    if (!chain) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/ecosystem?chain=${encodeURIComponent(chain)}`).catch(() => null);
      if (!res || !res.ok) return;
      const json = (await res.json()) as ChainTvl;
      if (!cancelled) setData(json);
    })();
    return () => { cancelled = true; };
  }, [chain]);

  if (!chain || !data || data.protocols.length === 0) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />{locale === 'ja' ? 'エコシステム dApps' : 'Ecosystem dApps'}</h2>
        <span className="text-[10px] text-muted-foreground">{data.name} · ${formatCompact(data.tvl)} TVL</span>
      </div>
      <div className="rounded-lg border border-border bg-subtle divide-y divide-border/60">
        {data.protocols.slice(0, 10).map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 px-3 py-2 text-[12px]">
            <span className="text-muted-foreground text-[10px] w-5">#{i + 1}</span>
            <span className="font-medium flex-1 truncate">{p.name}</span>
            {p.category && <span className="text-[10px] text-muted-foreground">{p.category}</span>}
            <span className="num tabular-nums w-24 text-right shrink-0">${formatCompact(p.tvl)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
