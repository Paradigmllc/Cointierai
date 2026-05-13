import { redirect } from 'next/navigation';

/**
 * Global not-found — redirect to /ja default locale
 */
export default function NotFound() {
  redirect('/ja');
}
