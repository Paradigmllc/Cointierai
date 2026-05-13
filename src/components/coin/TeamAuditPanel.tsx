/**
 * SSOT-first team / investors / audits. Reads cointier.team_profiles (Messari ingest).
 */
import { ShieldCheck, Users, Briefcase, ExternalLink } from 'lucide-react';
import { getTeamProfile } from '@/lib/db/ssot-queries';

interface Props {
  coinId: string;
  locale: 'ja' | 'en' | string;
}

export async function TeamAuditPanel({ coinId, locale }: Props) {
  const d = await getTeamProfile(coinId);
  if (!d) return null;
  const contributors = d.contributors_jsonb ?? [];
  const investors = d.investors_jsonb ?? [];
  const auditLinks = d.audit_links ?? [];
  if (contributors.length === 0 && investors.length === 0 && auditLinks.length === 0) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading">{locale === 'ja' ? 'チーム / 投資家 / 監査' : 'Team · Investors · Audits'}</h2>
        <span className="text-[10px] text-muted-foreground">Messari</span>
      </div>

      {contributors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><Users className="h-3 w-3 text-primary" />Team</h3>
          <div className="flex flex-wrap gap-1.5">
            {contributors.slice(0, 12).map((c, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-border bg-subtle">
                <span className="font-medium">{c.name}</span>
                {c.title && <span className="text-muted-foreground"> · {c.title}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {investors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><Briefcase className="h-3 w-3 text-tier-a" />Investors</h3>
          <div className="flex flex-wrap gap-1.5">
            {investors.slice(0, 16).map((inv, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-border bg-subtle font-medium">
                {inv.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {auditLinks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-gain" />Audits</h3>
          <div className="flex flex-wrap gap-2">
            {auditLinks.map((link, i) => (
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
