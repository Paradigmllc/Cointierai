'use client';

import { useEffect, useState } from 'react';
import { Github, Star, GitFork, Users, Eye } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, useChartTheme } from '@/components/ui/chart';
import { formatCompact } from '@/lib/utils';

interface Props {
  githubUrl: string | null;
  locale: 'ja' | 'en' | string;
}

interface DevStats {
  stars: number;
  forks: number;
  watchers: number;
  subscribers: number;
  openIssues: number;
  language: string | null;
  pushedAt: string | null;
  weeklyCommits: number[]; // last 52 weeks
  contributors: number | null;
}

export function DeveloperPanel({ githubUrl, locale }: Props) {
  const theme = useChartTheme();
  const [stats, setStats] = useState<DevStats | null>(null);

  useEffect(() => {
    if (!githubUrl) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/dev?url=${encodeURIComponent(githubUrl)}`).catch(() => null);
      if (!res || !res.ok) return;
      const data = (await res.json()) as DevStats;
      if (!cancelled) setStats(data);
    })();
    return () => { cancelled = true; };
  }, [githubUrl]);

  if (!githubUrl) return null;

  return (
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="section-heading flex items-center gap-2"><Github className="h-4 w-4" />{locale === 'ja' ? '開発者活動' : 'Developer activity'}</h2>
        {stats?.pushedAt && (
          <span className="text-[10px] text-muted-foreground tabular-nums">last push {stats.pushedAt.slice(0, 10)}</span>
        )}
      </div>
      {!stats && <div className="text-[11px] text-muted-foreground py-8 text-center">Loading…</div>}
      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <KpiTile icon={<Star className="h-3 w-3 text-tier-s" />} label="Stars" value={formatCompact(stats.stars)} />
            <KpiTile icon={<GitFork className="h-3 w-3 text-primary" />} label="Forks" value={formatCompact(stats.forks)} />
            <KpiTile icon={<Eye className="h-3 w-3 text-tier-a" />} label="Watchers" value={formatCompact(stats.subscribers || stats.watchers)} />
            <KpiTile icon={<Users className="h-3 w-3 text-gain" />} label="Contributors" value={stats.contributors ? formatCompact(stats.contributors) : '—'} />
            <KpiTile label="Lang" value={stats.language ?? '—'} />
          </div>
          {stats.weeklyCommits.length > 0 && (
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyCommits.map((c, i) => ({ week: i, commits: c }))}>
                  <defs>
                    <linearGradient id="dev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette[0]} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={theme.palette[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke={theme.axis} fontSize={9} tickLine={false} axisLine={false} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v} commits`, '']}
                    labelFormatter={(w: number) => `Week ${w - 51}`}
                  />
                  <Area type="monotone" dataKey="commits" stroke={theme.palette[0]} strokeWidth={1.5} fill="url(#dev-grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground text-center">
            {locale === 'ja' ? '直近 52 週の commit 推移' : '52-week commit activity'}
          </div>
        </>
      )}
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
