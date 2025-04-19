'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { ShopCard } from './shop-card';
import type { Shop } from '@/lib/data';
import { normalizeSearchText } from '@/lib/utils';
import { SkeletonCard } from './skeleton-card'; // スケルトンカードをインポート

interface ShopListProps {
  initialShops: Shop[];
}

const ITEMS_PER_PAGE = 12; // 一度に読み込むアイテム数

// フィルタリングロジック (変更なし)
function filterShops(shops: Shop[], params: URLSearchParams): Shop[] {
  const area = params.get('area') || 'all';
  const genre = params.get('genre') || 'all';
  const keyword = params.get('keyword') || '';
  const showTakemachelin = params.get('showTakemachelin') !== '0';
  const normalizedKeyword = normalizeSearchText(keyword);

  const filtered = shops.filter((shop) => {
    const areaMatch = area === 'all' || shop.area_category === area;
    if (!areaMatch) return false;

    let genreMatch = false;
    if (genre === 'all') {
      genreMatch = !shop.is_takemachelin || showTakemachelin;
    } else if (genre === 'タケマシュラン') {
      genreMatch = shop.is_takemachelin && showTakemachelin;
    } else {
      genreMatch =
        shop.genre === genre && (!shop.is_takemachelin || showTakemachelin);
    }
    if (!genreMatch) return false;

    if (normalizedKeyword) {
      const normalizedShopName = normalizeSearchText(shop.name);
      const normalizedShopArea = normalizeSearchText(shop.area);
      const searchMatch =
        normalizedShopName.includes(normalizedKeyword) ||
        normalizedShopArea.includes(normalizedKeyword);
      if (!searchMatch) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    const hasEgamiHiranoA =
      a['egami-hirano'] && a['egami-hirano'].trim() !== '';
    const hasEgamiHiranoB =
      b['egami-hirano'] && b['egami-hirano'].trim() !== '';
    if (hasEgamiHiranoA && !hasEgamiHiranoB) return -1;
    if (!hasEgamiHiranoA && hasEgamiHiranoB) return 1;
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'ja');
  });
}

export function ShopList({ initialShops }: ShopListProps) {
  const searchParams = useSearchParams();
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = React.useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // フィルタリングされたリスト
  const filteredShops = React.useMemo(() => {
    // フィルターが変わったら表示数をリセット
    setDisplayCount(ITEMS_PER_PAGE);
    return filterShops(initialShops, searchParams);
  }, [initialShops, searchParams]);

  // 表示するリスト
  const shopsToDisplay = React.useMemo(() => {
    return filteredShops.slice(0, displayCount);
  }, [filteredShops, displayCount]);

  // Intersection Observer の設定
  React.useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // entries[0] が監視対象
        if (
          entries[0].isIntersecting &&
          displayCount < filteredShops.length &&
          !isLoadingMore
        ) {
          setIsLoadingMore(true);
          // 少し遅延させてローディング表示を見せる（任意）
          setTimeout(() => {
            setDisplayCount((prevCount) => prevCount + ITEMS_PER_PAGE);
            setIsLoadingMore(false);
          }, 500); // 0.5秒の遅延
        }
      },
      {
        rootMargin: '0px 0px 400px 0px', // 下端から400px手前でトリガー
      }
    );

    const currentRef = loadMoreRef.current; // useEffectのクリーンアップ用に参照を保持
    observer.observe(currentRef);

    // クリーンアップ関数
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [filteredShops.length, displayCount, isLoadingMore]); // filteredShops.length も依存配列に追加

  return (
    <div>
      {/* フィルターステータス表示 */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredShops.length} 件の店舗が見つかりました。
      </div>

      {shopsToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopsToDisplay.map((shop, index) => (
            <ShopCard key={shop.url || shop.name} shop={shop} index={index} />
          ))}
          {/* ローディング中のスケルトン表示 */}
          {isLoadingMore &&
            [...Array(3)].map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          該当する店舗が見つかりませんでした。
        </div>
      )}

      {/* さらに読み込むアイテムがある場合に監視要素を表示 */}
      {displayCount < filteredShops.length && !isLoadingMore && (
        <div ref={loadMoreRef} style={{ height: '10px' }} aria-hidden="true" />
      )}

      {/* 全件表示済みの場合のメッセージ (任意) */}
      {/* {displayCount >= filteredShops.length && filteredShops.length > 0 && (
        <div className="mt-8 text-center text-muted-foreground">全 {filteredShops.length} 件表示しました</div>
      )} */}
    </div>
  );
}
