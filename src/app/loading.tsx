// src/app/loading.tsx
import { SkeletonCard } from '@/app/(components)/skeleton-card';

// ShopListのローディング中に表示するスケルトンコンポーネントを流用
function ShopListSkeleton() {
  return (
    <div>
      <div className="mb-4 h-6 w-1/4 bg-muted rounded animate-pulse"></div> {/* フィルターステータス */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <SkeletonCard key={i} /> // SkeletonCardを使用
        ))}
      </div>
    </div>
  );
}

// FilterControlsのスケルトンも追加（任意）
function FilterControlsSkeleton() {
  return <div className="h-[68px] rounded-lg border bg-card shadow-sm animate-pulse mb-8"></div>;
}


export default function Loading() {
  // page.tsx のレイアウトに合わせてスケルトンを表示
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="filter-heading">
        <h2 id="filter-heading" className="sr-only">
          店舗フィルター
        </h2>
        <FilterControlsSkeleton />
      </section>

      <section aria-labelledby="shop-list-heading">
        <h2 id="shop-list-heading" className="sr-only">
          店舗一覧
        </h2>
        <ShopListSkeleton />
      </section>
    </div>
  )
}