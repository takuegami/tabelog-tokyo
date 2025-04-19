import * as React from 'react';
import { loadShopData } from '@/lib/data';
import { FilterControls } from '@/app/(components)/filter-controls';
import { ShopList } from '@/app/(components)/shop-list';
import { SkeletonCard } from '@/app/(components)/skeleton-card';

// サーバーサイドでジャンルリストを生成する関数 (data.tsから移動)
async function getGenres(shops: Awaited<ReturnType<typeof loadShopData>>): Promise<string[]> {
  // タケマシュランを除外し、重複を除去してソート
  const genres = [
    ...new Set(
      shops
        .filter((s) => !s.is_takemachelin)
        .map((shop) => shop.genre || 'ジャンル不明')
    ),
  ].sort((a, b) => a.localeCompare(b, 'ja'));
  return genres;
}


// このページはサーバーサイドでレンダリングされます (SSR or SSG)
export default async function HomePage() {
  // サーバーサイドで店舗データとジャンルリストを読み込む
  const allShops = await loadShopData();
  const availableGenres = await getGenres(allShops); // ジャンルリストを取得

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
