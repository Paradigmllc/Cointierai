'use client';

/**
 * Watchlist store — Zustand with anon-fallback + sync-on-login.
 *
 * Three layers:
 *   1. **Anon (localStorage)** — anyone can ★ a coin pre-login. Persists in
 *      `cointier:watchlist:anon` and survives reloads. No round-trips.
 *   2. **Authenticated (Supabase)** — once logged in, /api/watchlist becomes
 *      the source of truth. On hydrate we merge local set into the server.
 *   3. **Optimistic toggles** — server failures roll back the local set so
 *      the ★ icon never lies.
 *
 * This eliminates the "sign-in or die" UX that loses 70%+ of first-time
 * visitors trying the watchlist.
 */
import { create } from 'zustand';
import { toast } from 'sonner';

const LS_KEY = 'cointier:watchlist:anon';

function loadAnon(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY) ?? '[]';
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveAnon(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
  } catch { /* quota / private mode */ }
}

interface WatchlistState {
  /** Hydrated from server (logged in) or localStorage (anon). Null = not yet hydrated. */
  ids: Set<string> | null;
  fetching: boolean;
  /** True after a successful /api/watchlist response. Determines write target. */
  authenticated: boolean;
  hydrate: () => Promise<void>;
  toggle: (coinId: string, opts?: { name?: string; symbol?: string }) => Promise<void>;
  has: (coinId: string) => boolean;
}

export const useWatchlist = create<WatchlistState>((set, get) => ({
  ids: null,
  fetching: false,
  authenticated: false,
  async hydrate() {
    if (get().fetching || get().ids) return;
    set({ fetching: true });
    const anon = loadAnon();
    try {
      const res = await fetch('/api/watchlist', { cache: 'no-store' });
      if (res.status === 401) {
        // Not logged in — anon mode
        set({ ids: anon, fetching: false, authenticated: false });
        return;
      }
      if (!res.ok) {
        set({ ids: anon, fetching: false, authenticated: false });
        return;
      }
      const data = (await res.json()) as { items: Array<{ coin_id: string }> };
      const serverSet = new Set(data.items.map((i) => i.coin_id));
      // Merge anon → server on first authenticated hydrate (sync any star
      // the user added before signing in)
      const newAdditions = [...anon].filter((id) => !serverSet.has(id));
      if (newAdditions.length > 0) {
        await Promise.all(
          newAdditions.map((id) =>
            fetch('/api/watchlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coin_id: id }),
            }).catch(() => null),
          ),
        );
        for (const id of newAdditions) serverSet.add(id);
        localStorage.removeItem(LS_KEY); // clear anon — server now owns it
        if (newAdditions.length > 0) {
          toast.success(`Synced ${newAdditions.length} watchlist items to your account`);
        }
      }
      set({ ids: serverSet, fetching: false, authenticated: true });
    } catch {
      set({ ids: anon, fetching: false, authenticated: false });
    }
  },
  has(coinId) {
    return get().ids?.has(coinId) ?? false;
  },
  async toggle(coinId, opts) {
    const { authenticated } = get();
    const current = get().ids ?? new Set<string>();
    const wasIn = current.has(coinId);
    const next = new Set(current);
    if (wasIn) next.delete(coinId);
    else next.add(coinId);
    set({ ids: next }); // optimistic

    const label = opts?.symbol ? `${opts.symbol.toUpperCase()}${opts.name ? ` (${opts.name})` : ''}` : coinId;

    if (!authenticated) {
      // anon mode — persist to localStorage, no network
      saveAnon(next);
      toast.success(wasIn ? `Removed ${label} from watchlist` : `Added ${label} to watchlist`);
      return;
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: wasIn ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin_id: coinId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(wasIn ? `Removed ${label} from watchlist` : `Added ${label} to watchlist`);
    } catch (e) {
      set({ ids: current }); // rollback
      const msg = e instanceof Error ? e.message : 'Watchlist update failed';
      toast.error(msg);
      console.error('[watchlist] toggle failed', e);
    }
  },
}));
