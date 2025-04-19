import type { Metadata, Viewport } from 'next'; // Viewportを追加
import { Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { Header } from '@/app/(components)/header'; // Headerをインポート
import { Providers } from '@/app/(components)/providers'; // Providersをインポート
import { Toaster } from '@/components/ui/sonner'; // Toasterをインポート
import { cn } from '@/lib/utils'; // cnユーティリティをインポート

// フォント設定
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS変数名を指定
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'], // 日本語サブセットは自動で読み込まれることが多いが明示
  weight: ['400', '500', '700'], // 必要なウェイトを指定
  variable: '--font-noto-sans-jp', // CSS変数名を指定
});

// メタデータ更新
export const metadata: Metadata = {
  title: 'Table Rec - モダンな飲食店検索',
  description: 'Next.jsとTailwind CSSで構築された飲食店検索アプリケーション',
  // themeColor: '#14b8a6', // metadataから削除
  // manifest.jsonへのリンクはnext-pwaが自動で挿入することを期待
  // manifest: '/manifest.json', // Metadataオブジェクトでのmanifest指定は標準的ではない
};

// viewportオブジェクトをエクスポートしてthemeColorを設定
export const viewport: Viewport = {
  themeColor: '#14b8a6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 標準的な構造に戻す
  return (
    <html lang="ja" suppressHydrationWarning>{/* langとsuppressHydrationWarningを復元 */}
      <head />{/* headタグを復元 */}
      <body
        // フォント変数と基本スタイルを適用
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable, // フォント変数を復元
          notoSansJP.variable // フォント変数を復元
        )}
      >
        {/* アプリケーション全体をProvidersでラップ */}
        <Providers>
          {/* Headerコンポーネントを配置 */}
          <Header />
          {/* childrenをmainタグでラップし、基本的なレイアウトを適用 */}
          <main className="container mx-auto max-w-[1280px] px-4 py-8"> {/* max-w-[1280px] と padding を追加 */}
            {children}
          </main>
          {/* TODO: Add Footer */}
          {/* Toasterコンポーネントを配置 */}
          <Toaster richColors position="top-right" /> {/* スタイルと位置を指定 */}
        </Providers>
      </body>
    </html>
  );
}
