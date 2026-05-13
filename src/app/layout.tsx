// Cointier — Root layout (HTML/HEAD レベル)
// [locale] segment にラップされるため、ここでは html/body のみ
import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cointier.ai'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
