'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/auth/supabase-browser';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  preferred_locale: string;
  preferred_currency: string;
  privy_user_id: string | null;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isPro: boolean;
}

/**
 * useUser — Auth state hook for client components
 *
 * - 起動時に session 取得
 * - onAuthStateChange でリアルタイム更新
 * - profile + subscription も同期取得
 */
export function useUser(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true, isPro: false });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let mounted = true;

    async function load(user: User | null) {
      if (!user) {
        if (mounted) setState({ user: null, profile: null, loading: false, isPro: false });
        return;
      }
      try {
        const [{ data: profile }, { data: sub }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        ]);
        const subTyped = sub as { plan: string; status: string } | null;
        const isPro = subTyped?.plan === 'pro' || subTyped?.plan === 'business';
        if (mounted) setState({ user, profile: (profile as UserProfile | null) ?? null, loading: false, isPro });
      } catch (e) {
        console.error('[useUser] load failed', e);
        if (mounted) setState({ user, profile: null, loading: false, isPro: false });
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => load(user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return state;
}
