import Link from 'next/link';
import { LayoutDashboard, Link2, Users, Coins, FileText, BarChart3, Shield } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';

/**
 * /admin — Cointier 管理画面 (PayloadCMS 風カスタム実装)
 *
 * 主な機能:
 *   - アフィリエイトリンク CRUD
 *   - アフィリエイトパートナー CRUD
 *   - クリック / コンバージョン分析
 *   - Coin overrides (AI summary 手動修正)
 *   - Polymarket markets 管理
 *   - ユーザー管理
 *
 * 認証: ADMIN_EMAILS env のメール allowlist
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  const sections = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/admin/affiliate-links', label: 'Affiliate Links', icon: <Link2 className="h-4 w-4" /> },
    { href: '/admin/affiliate-partners', label: 'Partners', icon: <Shield className="h-4 w-4" /> },
    { href: '/admin/affiliate-analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/admin/coins', label: 'Coins', icon: <Coins className="h-4 w-4" /> },
    { href: '/admin/articles', label: 'Articles', icon: <FileText className="h-4 w-4" /> },
    { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 shrink-0 border-r border-border/60 bg-card/30">
        <div className="px-4 py-4 border-b border-border/60">
          <Link href="/admin" className="font-bold text-lg">Cointier <span className="text-muted-foreground text-xs">Admin</span></Link>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">{session.user.email}</div>
        </div>
        <nav className="p-2 space-y-1">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {s.icon}
              <span>{s.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 mt-auto border-t border-border/60">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
