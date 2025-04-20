// @ts-check // JSDoc の型チェックを有効にする (任意)
// import type { NextConfig } from 'next'; // .mjs では import type は使えない
import withPWAInit from 'next-pwa'; // PWA設定を使う場合は必要

const isDev = process.env.NODE_ENV !== 'production';

/**
 * PWA設定オブジェクト
 * @type {import('next-pwa').PWAConfig}
 */
const pwaConfig = {
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst', // as const は削除
      options: {
        cacheName: 'network-first',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};

/**
 * Next.js設定オブジェクト
 * @type {import('next').NextConfig}
 */
const nextConfig = { // 型注釈 :NextConfig は削除
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/random/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jwybgokjzcqpmqncibdg.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 他のNext.js設定があればここに追加
};

// PWA設定を有効にする場合は以下のコメントを解除し、最後の行を修正
// const withPWA = withPWAInit(pwaConfig);
// export default withPWA(nextConfig);

// 現在は素のNext.js設定をエクスポート
export default nextConfig;
