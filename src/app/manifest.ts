import type { MetadataRoute } from 'next';

/**
 * PWA manifest — enables "Add to Home Screen" + standalone mode on
 * iOS/Android. Icons rendered as SVG-data-URLs to avoid asset pipeline.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cointier — Asia\'s AI-Powered Crypto Intelligence',
    short_name: 'Cointier',
    description: '37,000+ coins analysed by AI. VC funding, IDOs, token unlocks, tax reports — 7 Asian languages.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050914',
    theme_color: '#00B8E6',
    orientation: 'portrait',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Coins', short_name: 'Coins', url: '/coins', icons: [{ src: '/icon.svg', sizes: 'any' }] },
      { name: 'Tools', short_name: 'Tools', url: '/tools', icons: [{ src: '/icon.svg', sizes: 'any' }] },
      { name: 'News', short_name: 'News', url: '/news', icons: [{ src: '/icon.svg', sizes: 'any' }] },
    ],
  };
}
