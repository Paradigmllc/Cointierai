'use client';

/**
 * Watchlist store — Zustand with optimistic updates.
 *
 * Reads the initial set lazily from /api/watchlist on first hydrate; writes
 * fire-and-forget to Supabase. Used by every <WatchlistStar/> button in the app.
 */
import { create } from 'zustand';
import { toast } from 'sonner';

interface WatchlistState {
  /** Hydrated from server on first mount; undefined means "not yet fetched". */
  ids: Set<string> | null;
  fetching: boolean;
  hydrate: () => Promise<void>;
  toggle: (coinId: string, opts?: { name?: string; symbol?: string }) => Promise<void>;
  has: (coinId: string) => boolean;
}

export const useWatchlist = create<WatchlistState>((set, get) => ({
  ids: null,
  fetching: false,
  async hydrate() {
    if (get().fetching || get().ids) return;
    set({ fetching: true });
    try {
      const res = await fetch('/api/watchlist', { cache: 'no-store' });
      if (!res.ok) {
        set({ ids: new Set(), fetching: false });
        return;
      }
      const data = (await res.json()) as { items: Array<{ coin_id: string }> };
      set({ ids: new Set(data.items.map((i) => i.coin_id)), fetching: false });
    } catch {
      set({ ids: new Set(), fetching: false });
    }
  },
  has(coinId) {
    return get().ids?.has(coinId) ?? false;
  },
  async toggle(coinId, opts) {
    const current = get().ids ?? new Set<string>();
    const wasIn = current.has(coinId);
    const next = new Set(current);
    if (wasIn) next.delete(coinId);
    else next.add(coinId);
    set({ ids: next }); // optimistic
    try {
      const res = await fetch('/api/watchlist', {
        method: wasIn ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin_id: coinId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const label = opts?.symbol ? `${opts.symbol.toUpperCase()}${opts.name ? ` (${opts.name})` : ''}` : coinId;
      toast.success(wasIn ? `Removed ${label} from watchlist` : `Added ${label} to watchlist`);
    } catch (e) {
      // rollback
      set({ ids: current });
      const msg = e instanceof Error ? e.message : 'Watchlist update failed';
      if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
        toast.error('Sign in to use your watchlist');
      } else {
        toast.error(msg);
      }
      console.error('[watchlist] toggle failed', e);
    }
  },
}));
