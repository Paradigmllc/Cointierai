/**
 * Browser-side Supabase Auth helpers (production-grade)
 *
 * Client Components で使用。Cookie 自動同期 (SSR 対応)。
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const COINTIER_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'cointier';

let browserSingleton: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env not configured');
  }
  if (!browserSingleton) {
    browserSingleton = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: COINTIER_SCHEMA },
    });
  }
  return browserSingleton;
}
