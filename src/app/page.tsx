import * as React from 'react';
import { Shop, shopsResponseSchema } from '@/schemas/shop'; // Shop 型と shopsResponseSchema をインポート
import { FilterControls } from '@/app/(components)/filter-controls'; // src/app/(components)/filter-controls.tsx を指すはず
import { ShopList } from '@/app/(components)/shop-list'; // src/app/(components)/shop-list.tsx を指すはず
import { SkeletonCard } from '@/app/(components)/skeleton-card'; // src/app/(components)/skeleton-card.tsx を指すはず

// サーバーサイドでジャンルリストを生成する関数 (data.tsから移動)
// データ取得関数 (サーバーサイドで実行) - shops/page.tsx と同様
async function getShops(): Promise<Shop[]> {
  // 絶対URLを構築 (ローカル/Vercel環境変数から取得)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'; // ポートを3001に修正 (ローカル環境に合わせて)
  const apiUrl = `${baseUrl}/api/shops`;
  console.log(`[getShops] Fetching shops from: ${apiUrl}`); // ログ識別子追加
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    console.log(`[getShops] Fetch response status: ${res.status}`); // ステータスコード確認

    // 生のレスポンスボディを確認
    const rawBody = await res.text();
    console.log('[getShops] Raw response body (first 500 chars):', rawBody.substring(0, 500)); // 長い場合は一部表示

    if (!res.ok) {
      console.error(`[getShops] Failed to fetch shops: ${res.status} ${res.statusText}`, rawBody);
      return [];
    }

    // JSON パースを試みる
    let data;
    try {
      data = JSON.parse(rawBody); // 生ボディからパース
      // パース後のデータ確認 (最初の数件と件数)
      console.log(`[getShops] Parsed data type: ${typeof data}, isArray: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
      if (Array.isArray(data)) {
          console.log('[getShops] Parsed data (first 2 items):', JSON.stringify(data.slice(0, 2), null, 2));
      } else {
          console.log('[getShops] Parsed data (non-array):', JSON.stringify(data, null, 2));
      }
    } catch (parseError) {
      console.error('[getShops] Failed to parse JSON:', parseError, 'Raw body:', rawBody.substring(0, 500));
      return [];
    }

    // Zod スキーマで API レスポンスをバリデーション
    console.log('[getShops] Starting Zod validation...');
    const validationResult = shopsResponseSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('[getShops] Zod validation failed:', validationResult.error.flatten());
      // バリデーション失敗時のデータもログ出力
      console.error(`[getShops] Data that failed validation (type: ${typeof data}, isArray: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}):`, JSON.stringify(Array.isArray(data) ? data.slice(0, 2) : data, null, 2));
      return [];
    }
    console.log('[getShops] Zod validation successful. Returning data count:', validationResult.data.length); // 成功時の件数
    return validationResult.data;
  } catch (error) {
    console.error('[getShops] Error during fetch or processing:', error);
    return [];
  }
}

// サーバーサイドでジャンルリストを生成する関数
async function getGenres(shops: Shop[]): Promise<string[]> {
  // タケマシュランを除外し、重複を除去してソート
  const genres = [
    ...new Set(
      shops
        .filter((s) => !s.is_takemachelin) // is_takemachelin が boolean であることを想定
        .map((shop) => shop.genre || 'ジャンル不明')
    ),
  ].sort((a, b) => a.localeCompare(b, 'ja'));
  return genres;
}


// このページはサーバーサイドでレンダリングされます (SSR or SSG)
export default async function HomePage() {
  // サーバーサイドで店舗データとジャンルリストを取得
  const allShops = await getShops(); // APIから取得するように変更
  const availableGenres = await getGenres(allShops); // APIから取得したデータを使用

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="filter-heading">
        <h2 id="filter-heading" className="sr-only">
          店舗フィルター
        </h2>
        {/* FilterControlsをSuspenseでラップ */}
        <React.Suspense fallback={<FilterControlsSkeleton />}>
          <FilterControls genres={availableGenres} />
        </React.Suspense>
      </section>

      <section aria-labelledby="shop-list-heading">
        <h2 id="shop-list-heading" className="sr-only">
          店舗一覧
        </h2>
        {/* ShopListコンポーネントをSuspenseでラップ */}
        <React.Suspense fallback={<ShopListSkeleton />}>
          {' '}
          {/* fallbackに関数を指定 */}
          <ShopList initialShops={allShops} />
        </React.Suspense>
      </section>
    </div>
  );
}

// FilterControlsのローディング中に表示するスケルトン (仮)
function FilterControlsSkeleton() {
  // Shadcn UI の Skeleton を使うか、単純な div で表現
  return <div className="h-[68px] rounded-lg border bg-card shadow-sm animate-pulse"></div>;
}

// ShopListのローディング中に表示するスケルトンコンポーネント (仮)
function ShopListSkeleton() {
  // SkeletonCardを使用してローディング状態を表示
  return (
    <div>
      <div className="mb-4 h-6 w-1/4 bg-muted rounded animate-pulse"></div>{' '}
      {/* フィルターステータス */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <SkeletonCard key={i} /> // SkeletonCardを使用
        ))}
      </div>
    </div>
  );
}
