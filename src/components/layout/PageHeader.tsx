/**
 * PageHeader — CryptoRank.io 全ページ共通ヘッダーパターン
 *
 * 本家観測値: text-xl semibold + 13px subtitle + py-4
 * Cointier 全ページで使う統一パターン (寸分違わぬクローン用)
 */
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** 右側に表示するメタ情報 (件数バッジ等) */
  meta?: React.ReactNode;
  /** 追加の右側 actions (ボタン等) */
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between flex-wrap gap-3 pb-2">
      <div className="space-y-0.5 min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {meta}
        {actions}
      </div>
    </header>
  );
}

export function PageBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary" className="text-[10px] py-0.5">{children}</Badge>;
}
