import type { Tier } from '@/types/database';
import { cn, tierColor } from '@/lib/utils';

interface TierBadgeProps {
  tier: Tier | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function TierBadge({ tier, size = 'sm', showLabel = false, className }: TierBadgeProps) {
  if (!tier) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded border font-mono font-semibold',
          'text-muted-foreground border-border bg-muted/30',
          size === 'sm' && 'h-5 w-5 text-[10px]',
          size === 'md' && 'h-6 w-6 text-xs',
          size === 'lg' && 'h-8 w-8 text-sm',
          className,
        )}
        aria-label="No tier"
      >
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded border font-mono font-bold',
        tierColor(tier),
        size === 'sm' && 'h-5 w-5 text-[10px]',
        size === 'md' && 'h-6 w-6 text-xs',
        size === 'lg' && 'h-8 w-8 text-sm',
        showLabel && 'w-auto px-2',
        className,
      )}
      aria-label={`Tier ${tier}`}
      title={`Cointier Tier ${tier}`}
    >
      {tier}
    </span>
  );
}
