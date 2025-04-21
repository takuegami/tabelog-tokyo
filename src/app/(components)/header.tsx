// 'use client'; // サーバーコンポーネントに変更するため削除

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button, buttonVariants } from '@/components/ui/button'; // ★ buttonVariants をインポート
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils'; // ★ cn をインポート

export async function Header() {
  console.log('[Header] Rendering Header component...'); // ★ログ追加
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser(); // ★ error も取得
  console.log('[Header] getUser result - User:', user); // ★ログ追加
  console.log('[Header] getUser result - Error:', error); // ★ログ追加
  if (error) {
    console.error('[Header] Error fetching user:', error.message);
  }

  const signOut = async () => {
    'use server'; // サーバーアクションとしてマーク

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect('/'); // ログアウト後にホームページへリダイレクト
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4"> {/* justify-between に変更 */}
        <div className="flex items-center"> {/* items-center を追加 */}
          <Link href="/" className="flex items-center space-x-2"> {/* mr-6 を削除 */}
            <Image
              src="/images/logo.svg"
              alt="Table Rec Logo"
              width={150}
              height={36}
              priority
            />
          </Link>
        </div>

        {/* 認証状態に応じて表示を切り替え */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* 新規登録ボタン (asChild を使わない実装) */}
              <Link
                href="/shops/new"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))} // ★ buttonVariants を適用
              >
                新規登録
              </Link>
              {/* ログアウトボタン */}
              <form action={signOut}>
                <Button variant="outline" size="sm">ログアウト</Button>
              </form>
            </>
          ) : (
            /* ログインボタン */
            <Button asChild variant="outline" size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
