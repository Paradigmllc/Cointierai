'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Mail, Loader2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { getBrowserSupabase } from '@/lib/auth/supabase-browser';
import { toast } from 'sonner';

type Mode = 'login' | 'signup' | 'magic';

interface AuthFormProps {
  mode: Mode;
  redirectTo?: string;
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getBrowserSupabase();
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { preferred_locale: locale },
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(redirectTo ?? '/dashboard')}`,
          },
        });
        if (error) throw error;
        toast.success(locale === 'ja' ? '確認メールを送信しました' : 'Confirmation email sent');
        setMagicSent(true);
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(locale === 'ja' ? 'ログインしました' : 'Logged in');
        router.push(redirectTo ?? '/dashboard');
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Email required');
      return;
    }
    setLoading(true);
    const supabase = getBrowserSupabase();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(redirectTo ?? '/dashboard')}`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
      toast.success(locale === 'ja' ? 'マジックリンクを送信しました' : 'Magic link sent');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const supabase = getBrowserSupabase();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(redirectTo ?? '/dashboard')}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  if (magicSent) {
    return (
      <div className="text-center space-y-3 py-8">
        <Mail className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">{locale === 'ja' ? 'メールをご確認ください' : 'Check your inbox'}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'ja' ? `${email} にリンクを送信しました` : `Link sent to ${email}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleGoogle} variant="outline" disabled={loading} className="w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {locale === 'ja' ? 'Google でログイン' : 'Continue with Google'}
      </Button>

      <div className="relative flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleEmailPassword} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">{locale === 'ja' ? 'メール' : 'Email'}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">{locale === 'ja' ? 'パスワード' : 'Password'}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" minLength={8} required />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>
              {mode === 'signup' ? (locale === 'ja' ? 'アカウント作成' : 'Sign up') : (locale === 'ja' ? 'ログイン' : 'Log in')}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>

      <Button onClick={handleMagicLink} variant="ghost" disabled={loading || !email} className="w-full text-xs">
        <Mail className="h-3.5 w-3.5" />
        {locale === 'ja' ? 'パスワードなしでログイン (マジックリンク)' : 'Sign in without password (Magic link)'}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        {locale === 'ja' ? 'ログインで利用規約とプライバシーポリシーに同意したものとみなします' : 'By continuing you agree to Terms and Privacy Policy'}
      </p>
    </div>
  );
}
