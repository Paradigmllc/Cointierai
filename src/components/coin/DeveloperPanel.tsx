/**
 * SSOT-first developer panel. Reads cointier.developer_stats.
 */
import { Github, Star, GitFork, Users, Eye } from 'lucide-react';
import { getDeveloperStats } from '@/lib/db/ssot-queries';
import { DeveloperCommitChart } from './DeveloperCommitChart';
import { formatCompact } from '@/lib/utils';

interface Props {
  coinId: string;
  locale: 'ja' | 'en' | string;
}

export async function DeveloperPanel({ coinId, locale }: Props) {
  const stats = await getDeveloperStats(coinId);
  if (!stats) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Github className="h-4 w-4" />{locale === 'ja' ? '開発者活動' : 'Developer activity'}</h2>
        {stats.pushed_at && (
          <span className="text-[10px] text-muted-foreground tabular-nums">last push {stats.pushed_at.slice(0, 10)}</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <KpiTile icon={<Star className="h-3 w-3 text-tier-s" />} label="Stars" value={stats.stars ? formatCompact(stats.stars) : '—'} />
        <KpiTile icon={<GitFork className="h-3 w-3 text-primary" />} label="Forks" value={stats.forks ? formatCompact(stats.forks) : '—'} />
        <KpiTile icon={<Eye className="h-3 w-3 text-tier-a" />} label="Watchers" value={formatCompact(stats.subscribers ?? stats.watchers ?? 0)} />
        <KpiTile icon={<Users className="h-3 w-3 text-gain" />} label="Contributors" value={stats.contributors ? formatCompact(stats.contributors) : '—'} />
        <KpiTile label="Lang" value={stats.language ?? '—'} />
      </div>
      {stats.weekly_commits && stats.weekly_commits.length > 0 && (
        <DeveloperCommitChart weekly={stats.weekly_commits} />
      )}
      <div className="text-[10px] text-muted-foreground text-center">
        {locale === 'ja' ? '直近 52 週の commit 推移' : '52-week commit activity'}
      </div>
    </section>
  );
}

function KpiTile({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-subtle p-2.5 space-y-0.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-[14px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}
