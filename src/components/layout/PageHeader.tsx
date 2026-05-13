/**
 * PageHeader — Cointier shared page heading.
 * Stripe-inspired: 28px semibold title + 13px subtitle, restrained spacing.
 */
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned meta info (count badges, etc.) */
  meta?: React.ReactNode;
  /** Right-aligned action buttons */
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between flex-wrap gap-3 pb-1">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {meta}
        {actions}
      </div>
    </header>
  );
}

export function PageBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary" className="text-[10px] py-0.5">{children}</Badge>;
}
