import * as React from 'react';
// Shop 型は getAllShopsData が返す型 (DbShop) を使うため、直接インポートは不要になるかも
// import { Shop, shopsResponseSchema } from '@/schemas/shop';
import { Shop } from '@/schemas/shop'; // Shop 型は getGenres で必要
import { FilterControls } from '@/app/(components)/filter-controls';
import { ShopList } from '@/app/(components)/shop-list';
import { SkeletonCard } from '@/app/(components)/skeleton-card';
import { getAllShopsData } from '@/lib/data'; // データ取得関数をインポート

// データ取得関数 getShops は不要になったため削除

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
  const allShops = await getAllShopsData(); // 直接関数を呼び出す
  const availableGenres = await getGenres(allShops); // 取得したデータを使用

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
