'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Users, Briefcase, ExternalLink } from 'lucide-react';

interface Props {
  slug: string;
  locale: 'ja' | 'en' | string;
}

interface TeamAuditData {
  contributors: Array<{ name: string; title: string }>;
  organizations: Array<{ name: string }>;
  investors: Array<{ name: string }>;
  auditLinks: string[];
  tagline: string | null;
  category: string | null;
  sector: string | null;
  governanceDetails: string | null;
}

export function TeamAuditPanel({ slug, locale }: Props) {
  const [d, setD] = useState<TeamAuditData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/profile?slug=${slug}`).catch(() => null);
      if (!res || !res.ok) {
        if (!cancelled) setD(null);
        return;
      }
      const data = (await res.json()) as TeamAuditData;
      if (!cancelled) setD(data);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!d) return null;
  const hasAny = d.contributors.length || d.investors.length || d.auditLinks.length;
  if (!hasAny) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{locale === 'ja' ? 'チーム / 投資家 / 監査' : 'Team · Investors · Audits'}</h2>
        <span className="text-[10px] text-muted-foreground">Messari</span>
      </div>

      {d.contributors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><Users className="h-3 w-3 text-primary" />Team</h3>
          <div className="flex flex-wrap gap-1.5">
            {d.contributors.slice(0, 12).map((c, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-border bg-subtle">
                <span className="font-medium">{c.name}</span>
                {c.title && <span className="text-muted-foreground"> · {c.title}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {d.investors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><Briefcase className="h-3 w-3 text-tier-a" />Investors</h3>
          <div className="flex flex-wrap gap-1.5">
            {d.investors.slice(0, 16).map((inv, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-border bg-subtle font-medium">
                {inv.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {d.auditLinks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-gain" />Audits</h3>
          <div className="flex flex-wrap gap-2">
            {d.auditLinks.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                Audit {i + 1} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
