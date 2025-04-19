'use client'; // framer-motionを使用するためクライアントコンポーネントに

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Utensils, CalendarDays, Info, } from 'lucide-react'; // アイコンをインポート

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Shop } from '@/lib/data'; // Shop型をインポート
// import { cn } from '@/lib/utils'; // cnは未使用のため削除

interface ShopCardProps {
  shop: Shop;
  index: number; // アニメーションのstagger用
}

// アニメーション設定
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05, // 50ms stagger
      duration: 0.2,
      ease: 'easeOut',
    },
  }),
};

export function ShopCard({ shop, index }: ShopCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index} // staggerの遅延時間をカスタム値として渡す
      whileHover={{ y: -4, transition: { duration: 0.15 } }} // ホバーアニメーション
    >
      <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-md">
        <Link
          href={shop.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${shop.name}の詳細を見る`}
          className="flex flex-col h-full"
        >
          {/* 画像 (shop.imageが存在する場合のみ表示) */}
          {shop.image ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src={shop.image} // shop.imageがnull/undefinedでないことを保証
                alt={shop.name}
                fill // 親要素いっぱいに表示
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // レスポンシブなサイズ指定
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" // ホバーエフェクト
                priority={index < 3} // 最初の数枚を優先読み込み
              />
            </div>
          ) : null}

          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              {/* ジャンル */}
              <div className="flex items-center gap-1 flex-wrap">
                <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {shop.is_takemachelin ? (
                    <Badge variant="destructive" className="text-xs">
                      タケマシュラン
                    </Badge>
                  ) : (
                    shop.genre || 'ジャンル不明'
                  )}
                </span>
              </div>
              {/* egami-hirano アイコン */}
              {/* egami-hirano アイコン */}
              <div className="flex items-center gap-1">
                {(shop['egami-hirano'] === 'egami' || shop['egami-hirano'] === 'egami-hirano') && (
                  <Image
                    src="/images/egami_icon.svg" // publicディレクトリからの相対パス
                    alt="Egami おすすめ"
                    width={16} // アイコンサイズを指定
                    height={16}
                    className="h-4 w-4" // Tailwind CSSでサイズを再指定
                  />
                )}
                {(shop['egami-hirano'] === 'hirano' || shop['egami-hirano'] === 'egami-hirano') && (
                  <Image
                    src="/images/hirano_icon.svg" // publicディレクトリからの相対パス
                    alt="Hirano おすすめ"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                )}
                {/* visit アイコンをここに追加 */}
                {shop.visit === 'zumi' && (
                  <Image
                    src="/images/zumi_icon.svg"
                    alt="Zumi 訪問済み"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                )}
                {shop.visit === 'motomu' && (
                  <Image
                    src="/images/motomu_icon.svg"
                    alt="Motomu 訪問済み"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                )}
              </div>
              {/* 不要になった visit アイコンの div を削除 */}
            </div>
            {/* 店名 */}
            <CardTitle className="text-lg font-semibold leading-tight pt-1">
              {shop.name}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-grow pb-3 pt-0 text-sm text-muted-foreground">
            {/* エリア */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{shop.area || 'エリア不明'}</span>
            </div>
            {/* 定休日 */}
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{shop.holiday || '不定休/情報なし'}</span>
            </div>
          </CardContent>

          {/* メモ */}
          {shop.memo && shop.memo.trim() !== '' && (
            <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground border-t mt-auto pt-3">
              <div className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{shop.memo}</span>
              </div>
            </CardFooter>
          )}
        </Link>
      </Card>
    </motion.div>
  );
}
