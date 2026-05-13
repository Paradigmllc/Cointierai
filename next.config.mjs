import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dockerfile デプロイ時の slim runtime image (.next/standalone) を生成
  output: 'standalone',
  // CoinGecko / CryptoRank の coin image を Next/Image で扱うための remote pattern
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'images.cryptorank.io' },
      { protocol: 'https', hostname: 'icons.llamao.fi' },
      { protocol: 'https', hostname: 'dd.dexscreener.com' },
      { protocol: 'https', hostname: 'public.rootdata.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // 285,000 ページ pSEO のため静的化を許可
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-table', 'recharts'],
  },
  // 帰属表示・規約遵守: 各データソースのライセンスを HTTP header に明記
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Powered-By-Data', value: 'CoinGecko,CryptoRank,DeFiLlama,DEXScreener' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
