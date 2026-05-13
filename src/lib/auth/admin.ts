/**
 * Admin authorization helpers
 *
 * 管理画面 /admin はメール allowlist で保護.
 * 本番では ADMIN_EMAILS 環境変数 (カンマ区切り) で許可リストを管理.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from './supabase-server';

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}

/**
 * 管理者ガード — server component で使用
 *  - 未ログインなら /auth/login へ
 *  - ログイン済だが許可リスト外なら 404 (admin 存在を隠す)
 */
export async function requireAdmin() {
  const session = await getCurrentUser();
  if (!session) redirect('/auth/login?redirect=/admin');
  if (!isAdminEmail(session.user.email ?? null)) redirect('/');
  return session;
}
