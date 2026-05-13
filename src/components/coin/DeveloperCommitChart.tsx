'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, useChartTheme } from '@/components/ui/chart';

export function DeveloperCommitChart({ weekly }: { weekly: number[] }) {
  const theme = useChartTheme();
  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weekly.map((c, i) => ({ week: i, commits: c }))}>
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
  );
}
