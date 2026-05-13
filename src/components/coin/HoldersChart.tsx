'use client';

import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, useChartTheme } from '@/components/ui/chart';
import { formatPercent } from '@/lib/utils';

interface Holder { rank: number; address: string; pct: number; amount: number; label?: string }

export function HoldersChart({ holders }: { holders: Holder[] }) {
  const theme = useChartTheme();
  const data = holders.map((h) => ({ rank: `#${h.rank}`, pct: h.pct }));
  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="rank" stroke={theme.axis} fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
            formatter={(v: number) => [`${v.toFixed(2)}%`, '']}
          />
          <Bar dataKey="pct" fill={theme.palette[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
