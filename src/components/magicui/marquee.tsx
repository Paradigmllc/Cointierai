'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  /** Pause animation on mouse hover. */
  pauseOnHover?: boolean;
  /** Animate vertically instead of horizontally. */
  vertical?: boolean;
  /** Number of times to duplicate children (for seamless loop). */
  repeat?: number;
  /** Reverse direction. */
  reverse?: boolean;
  children: ReactNode;
}

/**
 * Continuous horizontal/vertical scrolling strip.
 * Implementation:
 *   - Duplicates children N times in CSS so the animation loops without a visible seam.
 *   - Drives motion via Tailwind keyframes (defined in tailwind.config.ts).
 *   - Honors prefers-reduced-motion automatically (CSS-level).
 */
export function Marquee({
  className,
  pauseOnHover,
  vertical = false,
  repeat = 4,
  reverse = false,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
            'animate-marquee flex-row': !vertical && !reverse,
            'animate-marquee-reverse flex-row': !vertical && reverse,
            'animate-marquee-vertical flex-col': vertical && !reverse,
            'animate-marquee-vertical-reverse flex-col': vertical && reverse,
            'group-hover:[animation-play-state:paused]': pauseOnHover,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
