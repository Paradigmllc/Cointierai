import { getProtocolDetail } from '@/lib/api/defillama';
import { DefiLlamaPanelView } from './DefiLlamaPanelView';

interface DefiLlamaPanelProps {
  slug: string;
  currentTvlUsd?: number | null;
  change1d?: number | null;
  change7d?: number | null;
  category?: string | null;
  locale: string;
}

/**
 * Server-side data fetcher for the DeFiLlama panel.
 *
 * Recharts internally uses class-based components that fail Next.js'
 * "collect page data" phase when rendered from an async server component.
 * Splitting the fetch (server, here) from the render (client, in
 * DefiLlamaPanelView) sidesteps that without losing the SSR-first paint —
 * the protocol JSON is fully prefetched server-side, then handed to the
 * 'use client' view for hydration.
 */
export async function DefiLlamaPanel(props: DefiLlamaPanelProps) {
  try {
    const detail = await getProtocolDetail(props.slug);
    if (!detail) return null;
    return <DefiLlamaPanelView detail={detail} {...props} />;
  } catch {
    return null;
  }
}
