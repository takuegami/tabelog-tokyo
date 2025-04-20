'use client'; // framer-motionを使用するためクライアントコンポーネントに

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Utensils, CalendarDays, Info, Trash2 } from 'lucide-react'; // Trash2 アイコンをインポート
import { Button } from '@/components/ui/button'; // Button をインポート
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'; // Carouselコンポーネントをインポート

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Shop } from '@/schemas/shop'; // 正しいパスから Shop 型をインポート
// import { cn } from '@/lib/utils'; // cnは未使用のため削除

interface ShopCardProps {
  shop: Shop;
  index: number; // アニメーションのstagger用
  onDelete: (shopId: number) => void; // 削除処理関数を追加
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

export function ShopCard({ shop, index, onDelete }: ShopCardProps) { // onDelete を props から受け取る
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Link の遷移を防ぐ
    e.stopPropagation(); // イベントの伝播を止める
    onDelete(shop.id); // 削除関数を呼び出す
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index} // staggerの遅延時間をカスタム値として渡す
      whileHover={{ y: -4, transition: { duration: 0.15 } }} // ホバーアニメーション
    >
      <Card className="relative h-full flex flex-col overflow-hidden transition-shadow hover:shadow-md group p-0"> {/* relative を追加 */}
        {/* 削除ボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full bg-background/70 text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDeleteClick}
          aria-label={`店舗 ${shop.name} を削除`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* 画像カルーセル (shop.imagesが存在し、空でない場合のみ表示) - Linkの外に移動 */}
        {shop.images && shop.images.length > 0 ? (
          <Carousel
              opts={{
                align: 'start',
                loop: true, // ループ表示を有効化
              }}
              className="w-full"
            >
              <CarouselContent>
                {shop.images.map((imageSrc, imgIndex) => (
                  <CarouselItem key={imgIndex}>
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={imageSrc}
                        alt={`${shop.name} 画像 ${imgIndex + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        priority={index < 3 && imgIndex === 0} // 最初のカードの最初の画像のみ優先読み込み
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* ナビゲーションボタン (画像が2枚以上の場合のみ表示) */}
              {shop.images.length > 1 && (
                <>
                  <CarouselPrevious
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onPointerDown={(e) => e.stopPropagation()} // onPointerDownでイベント伝播を停止
                  />
                  <CarouselNext
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onPointerDown={(e) => e.stopPropagation()} // onPointerDownでイベント伝播を停止
                  />
                </>
              )}
            </Carousel>
          ) : null}

          {/* 既存の単一画像表示ロジックは削除 */}
          {/* {shop.image ? ( ... ) : null} */}

        {/* カードのテキスト部分をLinkで囲む */}
        <Link
          href={shop.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${shop.name}の詳細を見る`}
          className="flex flex-col flex-grow p-0" // paddingを削除し、flex-growを追加
        >
          <CardHeader className="pb-3 pt-4 px-4"> {/* paddingを個別に追加 */}
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
                {/* プロパティ名を egami_hirano に修正 */}
                {(shop.egami_hirano === 'egami' || shop.egami_hirano === 'egami-hirano') && (
                  <Image
                    src="/images/egami_icon.svg" // publicディレクトリからの相対パス
                    alt="Egami おすすめ"
                    width={16} // アイコンサイズを指定
                    height={16}
                    className="h-4 w-4" // Tailwind CSSでサイズを再指定
                  />
                )}
                {/* プロパティ名を egami_hirano に修正 */}
                {(shop.egami_hirano === 'hirano' || shop.egami_hirano === 'egami-hirano') && (
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

          <CardContent className="flex-grow pb-3 pt-0 text-sm text-muted-foreground px-4"> {/* paddingを個別に追加 */}
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
            <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground border-t mt-auto pt-3 px-4"> {/* paddingを個別に追加 */}
              <div className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{shop.memo}</span>
              </div>
            </CardFooter>
          )}
        </Link> {/* Linkの閉じタグを移動 */}
      </Card>
    </motion.div>
  );
}
