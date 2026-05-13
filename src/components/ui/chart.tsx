'use client';

/**
 * Chart wrapper — exports recharts primitives with shadcn-themed defaults.
 *
 * Use `useChartTheme()` to get a stable colour ramp that follows the active
 * light/dark theme. For complex dashboards prefer composing recharts directly;
 * for quick sparklines use the existing <Sparkline> svg component.
 */
import { useTheme } from 'next-themes';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
} from 'recharts';

/** Returns a 10-step colour ramp tuned to the active theme. */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    axis: isDark ? '#97A0B5' : '#6B7280',
    tooltipBg: isDark ? '#161B2C' : '#FFFFFF',
    tooltipBorder: isDark ? '#232A3E' : '#E5E9F0',
    palette: [
      '#635BFF', // primary indigo
      '#16C784', // gain
      '#EA3943', // loss
      '#FFD700', // tier S
      '#FB923C', // tier D
      '#06B6D4', // cyan
      '#A855F7', // purple
      '#EC4899', // pink
      '#84CC16', // lime
      '#94A3B8', // slate
    ],
  };
}

export {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
};
