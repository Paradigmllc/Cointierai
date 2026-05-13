import { redirect } from 'next/navigation';

/**
 * Root redirect — / → /ja
 *
 * Middleware が /ja に redirect する想定だが、build 結果として
 * root に static page が無いと 404 になるケースがあるため明示的 fallback.
 */
export default function RootPage() {
  redirect('/ja');
}

export const dynamic = 'force-dynamic';
