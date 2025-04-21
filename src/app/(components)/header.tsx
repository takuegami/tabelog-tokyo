// 'use client'; // サーバーコンポーネントに変更するため削除

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server'; // サーバー用クライアント
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
            <form action={signOut}>
              <Button variant="outline" size="sm">ログアウト</Button>
            </form>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
