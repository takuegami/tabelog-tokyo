import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const isDev = process.env.NODE_ENV !== 'production';

// PWA設定オブジェクト
const pwaConfig = {
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst' as const, // 型を明示
      options: {
        cacheName: 'network-first',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};

// Next.js設定オブジェクト
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com', // Unsplashも念のため残す
        port: '',
        pathname: '/random/**',
      },
      { // placehold.co を追加
        protocol: 'https',
        hostname: 'placehold.co', // via.placeholder.com から変更
        port: '',
        pathname: '/**', // すべてのパスを許可
      },
    ],
  },
  // 他のNext.js設定があればここに追加
};

// withPWAInitを呼び出して設定をマージ
// nextConfigをanyにキャストして型エラーを回避
const configWithPWA = withPWAInit(pwaConfig)(nextConfig as any);

// 型エラーを回避するため、anyとしてエクスポート (一時的な対処)
// 本来はnext-pwa側の型定義が更新されるのを待つか、バージョンを調整するのが望ましい
export default configWithPWA; // as any は不要になるはず
