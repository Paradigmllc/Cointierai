import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Bento Grid — asymmetric tile layout for KPI / feature surfaces.
 * Children pass `colSpan` / `rowSpan` Tailwind classes to vary tile sizes.
 */
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[10rem] gap-3', className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Optional Tailwind span overrides, e.g. `lg:col-span-2 lg:row-span-2`. */
  span?: string;
  /** Top-right corner pill (e.g. source label). */
  meta?: ReactNode;
  /** Centerpiece — large value, chart, gauge. */
  centerpiece?: ReactNode;
  /** Footer slot under the centerpiece (e.g. trend indicator). */
  footer?: ReactNode;
  /** Accent color override (defaults to neutral border). */
  accent?: 'primary' | 'gain' | 'loss' | 'tier-s' | 'tier-a' | 'tier-d' | 'none';
  className?: string;
}

const ACCENT: Record<NonNullable<BentoCardProps['accent']>, string> = {
  primary: 'border-primary/40 bg-primary/[0.03]',
  gain: 'border-gain/40 bg-gain/[0.04]',
  loss: 'border-loss/40 bg-loss/[0.04]',
  'tier-s': 'border-tier-s/40 bg-tier-s/[0.05]',
  'tier-a': 'border-tier-a/40 bg-tier-a/[0.04]',
  'tier-d': 'border-tier-d/40 bg-tier-d/[0.04]',
  none: 'border-border bg-card',
};

export function BentoCard({
  title,
  description,
  icon,
  span,
  meta,
  centerpiece,
  footer,
  accent = 'none',
  className,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border p-4 shadow-soft transition-colors hover:shadow-card overflow-hidden',
        ACCENT[accent],
        span,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          {icon}
          <span className="uppercase tracking-wide">{title}</span>
        </div>
        {meta && <div className="shrink-0">{meta}</div>}
      </div>
      {centerpiece && <div className="mt-2 flex-1 flex flex-col justify-center min-h-0">{centerpiece}</div>}
      {description && <div className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{description}</div>}
      {footer && <div className="mt-3 text-[11px]">{footer}</div>}
    </div>
  );
}
