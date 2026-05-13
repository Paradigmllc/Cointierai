'use client';

import { useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useUser } from '@/hooks/useUser';
import { User, LogOut, LayoutDashboard, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function AuthButton() {
  const { user, profile, loading, isPro } = useUser();
  const locale = useLocale();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      if (!res.ok) throw new Error('signout failed');
      toast.success(locale === 'ja' ? 'ログアウトしました' : 'Logged out');
      router.push('/');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) {
    return <div className="h-8 w-20 rounded-md bg-muted/40 animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">{locale === 'ja' ? 'ログイン' : 'Log in'}</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/auth/signup">{locale === 'ja' ? '登録' : 'Sign up'}</Link>
        </Button>
      </div>
    );
  }

  const initial = (profile?.display_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          <span className="h-6 w-6 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center">
            {initial}
          </span>
          {isPro && <Crown className="h-3 w-3 text-tier-s" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="space-y-0.5">
            <div className="text-sm font-medium truncate">{profile?.display_name ?? user.email}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
          </div>
          {isPro && <Badge className="mt-1 text-[9px]">{locale === 'ja' ? 'Pro メンバー' : 'Pro Member'}</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/wallet"><User className="h-4 w-4 mr-2" />{locale === 'ja' ? 'プロフィール' : 'Profile'}</Link>
        </DropdownMenuItem>
        {!isPro && (
          <DropdownMenuItem asChild>
            <Link href="/pricing"><Crown className="h-4 w-4 mr-2 text-tier-s" />{locale === 'ja' ? 'Pro に登録' : 'Upgrade to Pro'}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {locale === 'ja' ? 'ログアウト' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
