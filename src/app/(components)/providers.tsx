'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes'; // ThemeProviderをインポート

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClientのインスタンスを作成 (コンポーネント外で作成するとリクエスト間で共有されるため注意)
  // useStateを使ってインスタンスがコンポーネントのライフサイクル内でのみ作成されるようにする
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // staleTimeを設定すると、指定時間内はキャッシュが新鮮とみなされ、再フェッチが抑制される
            // staleTime: 5 * 60 * 1000, // 例: 5分
            // refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再フェッチを無効化する場合
          },
        },
      })
  );

  return (
    // ThemeProviderでラップし、属性とデフォルトテーマを設定
    <ThemeProvider
      attribute="class"
      defaultTheme="light" // デフォルトテーマをlightに変更
      // enableSystem を削除 (もしくは false に設定)
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {/* 開発環境でのみDevToolsを表示 */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
