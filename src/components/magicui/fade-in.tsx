'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  /** Delay before the animation kicks in (seconds). */
  delay?: number;
  /** Stagger child index for sequenced reveals. */
  index?: number;
  /** Override direction. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

/**
 * Generic enter animation wrapper.
 *
 * - Wraps a child in a framer-motion div that fades in + translates 12px
 *   on the chosen axis when it scrolls into view.
 * - Honors prefers-reduced-motion → renders immediately without movement.
 * - `index` produces a 60-80ms stagger when grouping children inline.
 *
 * Designed as a one-stop "luxury reveal" without needing variants in every
 * call site. Use sparingly — too many concurrent animations re-introduce
 * the "everything is animating" anti-pattern.
 */
export function FadeIn({ children, delay = 0, index = 0, direction = 'up', className }: FadeInProps) {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : 12;
  const initial =
    direction === 'up'
      ? { opacity: 0, y: offset }
      : direction === 'down'
        ? { opacity: 0, y: -offset }
        : direction === 'left'
          ? { opacity: 0, x: offset }
          : direction === 'right'
            ? { opacity: 0, x: -offset }
            : { opacity: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{
        duration: 0.6,
        delay: reduce ? 0 : delay + index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
