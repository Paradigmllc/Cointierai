import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('errors');
  return (
    <div className="container py-20 flex flex-col items-center text-center space-y-6">
      <h1 className="text-6xl font-bold tracking-tight text-muted-foreground">404</h1>
      <h2 className="text-2xl font-semibold">{t('notFound')}</h2>
      <p className="text-muted-foreground max-w-md">{t('notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{t('goHome')}</Link>
      </Button>
    </div>
  );
}
