import * as React from 'react';
import { Shop, shopsResponseSchema } from '@/schemas/shop'; // Shop 型と shopsResponseSchema をインポート
import { FilterControls } from '@/app/(components)/filter-controls'; // src/app/(components)/filter-controls.tsx を指すはず
import { ShopList } from '@/app/(components)/shop-list'; // src/app/(components)/shop-list.tsx を指すはず
import { SkeletonCard } from '@/app/(components)/skeleton-card'; // src/app/(components)/skeleton-card.tsx を指すはず

// サーバーサイドでジャンルリストを生成する関数 (data.tsから移動)
// データ取得関数 (サーバーサイドで実行) - shops/page.tsx と同様
async function getShops(): Promise<Shop[]> {
  const apiUrl = '/api/shops'; // 相対パスに変更
  console.log(`Fetching shops for homepage from: ${apiUrl}`);
  try {
    // fetch に渡す URL も相対パスにする
    // Next.js の fetch はサーバーサイドで実行される場合、自動的にホストを解決する
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Failed to fetch shops: ${res.status} ${res.statusText}`, errorBody);
      return [];
    }
    const data = await res.json();
    // Zod スキーマで API レスポンスをバリデーション (デバッグログ削除)
    const validationResult = shopsResponseSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('[Frontend getShops] Zod validation failed:', validationResult.error.flatten()); // エラーログは残す
      return []; // バリデーション失敗時は空配列を返す
    }
    return validationResult.data; // バリデーション済みデータを返す (型安全)
  } catch (error) {
    console.error('Error during fetch or parsing shops data:', error);
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
