// 'use client'; // サーバーコンポーネントにするため削除

// import { zodResolver } from '@hookform/resolvers/zod'; // Form関連は EditShopForm へ移動
// import { useForm, ControllerRenderProps } from 'react-hook-form'; // Form関連は EditShopForm へ移動
import { Button } from '@/components/ui/button'; // Button はエラー表示で使う可能性あり
// Form関連のインポートは EditShopForm へ移動
// import { Input } from '@/components/ui/input'; // Form関連は EditShopForm へ移動
// import { Textarea } from '@/components/ui/textarea'; // Form関連は EditShopForm へ移動
// import { Select, ... } from "@/components/ui/select"; // Form関連は EditShopForm へ移動
import { Shop } from '@/schemas/shop'; // Shop 型は必要
import { useRouter, useParams, notFound, redirect } from 'next/navigation'; // notFound, redirect をインポート
// import { useState, useEffect } from 'react'; // useState, useEffect は EditShopForm へ移動
import { createClient } from '@/lib/supabase/server'; // ★ サーバー用クライアントをインポート
// import { MultiImageUploader } from '@/app/(components)/multi-image-uploader'; // Form関連は EditShopForm へ移動
import { Skeleton } from '@/components/ui/skeleton'; // ローディング表示で使う可能性あり
import { EditShopForm } from '@/app/(components)/edit-shop-form'; // ★ 作成したフォームコンポーネントをインポート

// オプションは EditShopForm へ移動
// 固定オプションも EditShopForm へ移動

interface OptionsResponse {
  genres: string[];
  areaCategories: string[];
}

// ページコンポーネントの Props 型定義 (Next.js App Router の規約)
interface EditShopPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined }; // searchParams を追加
}

export default async function EditShopPage({ params, searchParams }: EditShopPageProps) { // searchParams を受け取る
  // const router = useRouter(); // クライアントフックは削除
  const shopId = params.id; // props から取得
  const redirectUrl = typeof searchParams.redirectUrl === 'string' ? searchParams.redirectUrl : null; // redirectUrl を取得
  // useState は削除

  const supabase = createClient(); // ★ サーバー用クライアントを作成

  // --- 認証チェック ---
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[Edit Page] Auth Error or no user, redirecting to login.');
    redirect('/login'); // 未認証ならリダイレクト
  }
  console.log('[Edit Page] User authenticated:', user.id);

  // --- 店舗データ取得 ---
  let initialShopData: Shop | null = null;
  let shopFetchError: string | null = null;
  try {
    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      throw new Error('Invalid Shop ID format');
    }

    console.log(`[Edit Page] Fetching shop data for ID: ${numericShopId}`);
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', numericShopId)
      // .eq('user_id', user.id) // ★ 必要に応じて自分のデータのみ編集可能にするRLSと組み合わせる
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not Found
        console.log(`[Edit Page] Shop not found in Supabase for ID: ${numericShopId}`);
        notFound(); // 404ページを表示
      } else {
        throw error; // その他のDBエラー
      }
    }
    initialShopData = data;
    console.log(`[Edit Page] Shop data fetched successfully: ${initialShopData?.name}`);
  } catch (error) {
    console.error('[Edit Page] Error fetching shop data:', error);
    shopFetchError = error instanceof Error ? error.message : '店舗データの取得に失敗しました。';
    // エラーが発生しても、オプション取得は試みる（あるいはここでnotFound()も検討）
  }

  // --- オプションデータ取得 ---
  let options: OptionsResponse = { genres: [], areaCategories: [] };
  let optionsFetchError: string | null = null;
  try {
    console.log('[Edit Page] Fetching options data...');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        console.error('[Edit Page] NEXT_PUBLIC_APP_URL is not set.'); // ★ エラーログ変更
        throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables.');
    }
    // ★ URL結合時のスラッシュ重複を避ける (URLオブジェクトを使うのがより安全)
    const optionsApiUrl = new URL('/api/options', appUrl).toString();
    console.log(`[Edit Page] Fetching options from: ${optionsApiUrl}`);
    const response = await fetch(optionsApiUrl, { cache: 'no-store' });
    console.log(`[Edit Page] Options fetch response status: ${response.status}`); // ★ ステータスログ追加
    if (!response.ok) {
      const errorText = await response.text(); // ★ エラー内容を取得
      console.error(`[Edit Page] Failed to fetch options. Status: ${response.status}, Body: ${errorText}`); // ★ 詳細エラーログ
      throw new Error(`Failed to fetch options: ${response.statusText}`);
    }
    const fetchedOptions = await response.json(); // ★ 一旦別変数に格納
    console.log('[Edit Page] Options data fetched successfully:', fetchedOptions); // ★ 取得データログ追加
    // ★ 取得データが期待する形式か確認 (任意だが推奨)
    if (fetchedOptions && Array.isArray(fetchedOptions.genres) && Array.isArray(fetchedOptions.areaCategories)) {
        options = fetchedOptions;
    } else {
        console.warn('[Edit Page] Fetched options data is not in the expected format:', fetchedOptions);
        throw new Error('Fetched options data format is invalid.');
    }
  } catch (error) {
    console.error('[Edit Page] Error fetching options:', error);
    optionsFetchError = error instanceof Error ? error.message : 'オプションデータの取得に失敗しました。';
    // オプション取得失敗時のハンドリング（フォームは表示させるが、選択肢は空になる）
  }


  // --- エラーハンドリング ---
  // 店舗データ取得に失敗した場合（404以外）
  if (shopFetchError && !initialShopData) {
     return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-destructive">データ取得エラー</h1>
        <p className="text-muted-foreground">{shopFetchError}</p>
        {/* <Button onClick={() => router.back()} variant="outline" className="mt-4">戻る</Button> */} {/* router.back() は使えない */}
        <Button asChild variant="outline" className="mt-4"><a href="/">ホームに戻る</a></Button> {/* 代わりにリンク */}
      </div>
    );
  }

  // 店舗データが見つからない場合は notFound() で処理済み

  // --- レンダリング ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">店舗情報編集</h1>
      {/* オプション取得エラーがあればメッセージ表示 */}
      {optionsFetchError && (
         <p className="mb-4 text-sm text-destructive">オプションの取得に失敗しました: {optionsFetchError}</p>
      )}
      {/* initialShopData が null でないことを保証 (notFoundで処理されるはずだが念のため) */}
      {initialShopData && (
         <EditShopForm
           shopId={shopId}
           initialShopData={initialShopData}
           options={options}
           redirectUrl={redirectUrl} // redirectUrl を渡す
         />
      )}
    </div>
  );
}