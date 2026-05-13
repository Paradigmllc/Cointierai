import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase 公開 URL / anon key の取得
 * 環境変数未設定時は明示的にエラー (V ルール: 空文字フォールバック禁止)
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[supabase] Required environment variable ${key} is not set`);
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
// All cointier tables live under the `cointier` schema (schema-isolated in shared appexx-studio project)
const COINTIER_SCHEMA = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'cointier') as 'cointier';

/**
 * Browser client — public read のみで使用
 *
 * 注: `<Database>` generic は付けない. cointier schema が `@supabase/ssr` の
 * 型推論を貫通せず table が `never` に narrow されるため. 型は use sites で
 * 個別 cast (`as Coin`, `as Pick<CoinTranslation, ...>` 等) で扱う.
 */
export function createBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    throw new Error('Supabase client misconfigured');
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: COINTIER_SCHEMA },
  });
}

/**
 * Server client — RSC / API Routes で使用 (Cookie-aware)
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components の場合 cookieStore.set は no-op
        }
      },
    },
    db: { schema: COINTIER_SCHEMA },
  });
}

/**
 * Service role client — 管理API・ingestion script からのみ使用 (RLS bypass)
 * 絶対にクライアント側で呼ばないこと
 */
export function createServiceSupabase() {
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: COINTIER_SCHEMA },
  });
}
