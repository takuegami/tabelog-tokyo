'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react'; // Loader2 をインポート
// import { useDebouncedCallback } from 'use-debounce'; // 不要なインポートを削除

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// import { AREAS } from '@/lib/data'; // data.tsからのインポートを削除

// 地域カテゴリリストをコンポーネント内に定義
const AREAS = [
  '銀座・新橋・有楽町',
  '東京・日本橋',
  '渋谷・恵比寿・代官山',
  '新宿・代々木・大久保',
  '池袋～高田馬場・早稲田',
  '原宿・表参道・青山',
  '六本木・麻布・広尾',
  '赤坂・永田町・溜池',
  '四ツ谷・市ヶ谷・飯田橋',
  '秋葉原・神田・水道橋',
  '上野・浅草・日暮里',
  '両国・錦糸町・小岩',
  '築地・湾岸・お台場',
  '浜松町・田町・品川',
  '大井・蒲田',
  '目黒・白金・五反田',
  '京王・小田急沿線',
  '中野～西荻窪',
  '吉祥寺・三鷹・武蔵境',
  '西武沿線',
  '板橋・東武沿線',
  '大塚・巣鴨・駒込・赤羽',
  '千住・綾瀬・葛飾',
  '小金井・国分寺・国立',
  '調布・府中・狛江',
  '町田・稲城・多摩',
  '西東京市周辺',
  '立川市・八王子市周辺',
  '福生・青梅周辺',
  '伊豆諸島・小笠原',
  'その他',
];

interface FilterControlsProps {
  genres: string[]; // ジャンルリストをpropsで受け取る
}

export function FilterControls({ genres: availableGenres }: FilterControlsProps) { // propsを受け取り、変数名を変更
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // const [genres, setGenres] = React.useState<string[]>([]); // propsで受け取るため不要
  const [isPending, startTransition] = React.useTransition(); // URL更新時のトランジション用
  const initialKeyword = searchParams.get('keyword') || ''; // 先に定義
  const [keyword, setKeyword] = React.useState(initialKeyword); // 検索キーワード用のstate

  // URLから初期値を取得
  const initialArea = searchParams.get('area') || 'all';
  const initialGenre = searchParams.get('genre') || 'all';
  // const initialKeyword = searchParams.get('keyword') || ''; // 上に移動
  const initialShowTakemachelin = searchParams.get('showTakemachelin') !== '0'; // '0'以外はtrue

  // URL更新関数
  const updateSearchParams = React.useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (
          value === null ||
          value === '' ||
          (key !== 'keyword' && value === 'all')
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // ページネーションもリセットする場合 (例: pageパラメータを削除)
      params.delete('page');

      // startTransitionを使用してURLを更新 (UIブロックを防ぐ)
      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, replace]
  );

  // デバウンスされた検索処理は不要なので削除
  // const handleSearch = useDebouncedCallback((term: string) => {
  //   updateSearchParams({ keyword: term });
  // }, 500);

  // Enterキー押下時の処理
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // 日本語入力中のEnterキー操作を無視する
      if (event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault(); // デフォルトのフォーム送信などを防ぐ
      updateSearchParams({ keyword: keyword });
    }
  };


  // リセット処理
  const handleReset = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('area');
    params.delete('genre');
    params.delete('keyword');
    params.delete('showTakemachelin');
    params.delete('page'); // ページネーションもリセット
    setKeyword(''); // 検索キーワードのstateもリセット
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  // タケマシュラン表示トグルハンドラ
  const handleTakemachelinChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      updateSearchParams({ showTakemachelin: checked ? null : '0' }); // trueならパラメータ削除、falseなら'0'
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
      {/* 地域フィルター */}
      <div className="flex-grow sm:flex-grow-0">
        <Label htmlFor="area-select" className="sr-only">
          地域
        </Label>
        <Select
          value={initialArea}
          onValueChange={(value) => updateSearchParams({ area: value })}
          disabled={isPending} // トランジション中は無効化
        >
          <SelectTrigger
            id="area-select"
            className="w-full sm:w-[180px]"
            aria-label="地域で絞り込む"
          >
            <SelectValue placeholder="すべての地域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての地域</SelectItem>
            {AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ジャンルフィルター */}
      <div className="flex-grow sm:flex-grow-0">
        <Label htmlFor="genre-select" className="sr-only">
          ジャンル
        </Label>
        <Select
          value={initialGenre}
          onValueChange={(value) => updateSearchParams({ genre: value })}
          disabled={isPending}
        >
          <SelectTrigger
            id="genre-select"
            className="w-full sm:w-[180px]"
            aria-label="ジャンルで絞り込む"
          >
            <SelectValue placeholder="すべてのジャンル" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのジャンル</SelectItem>
            {/* TODO: タケマシュランの選択肢を追加 */}
            {availableGenres.map((genre) => ( // propsで受け取ったリストを使用
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* タケマシュラン表示トグル */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Checkbox
          id="show-takemachelin"
          checked={initialShowTakemachelin}
          onCheckedChange={handleTakemachelinChange}
          disabled={isPending}
        />
        <Label
          htmlFor="show-takemachelin"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap"
        >
          タケマシュランを表示
        </Label>
      </div>

      {/* 検索入力 */}
      <div className="relative flex-grow">
        <Label htmlFor="search-input" className="sr-only">
          検索
        </Label>
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search-input"
          type="search"
          placeholder="店舗名、最寄り駅名..."
          className="w-full pl-8"
          value={keyword} // valueをstateにバインド
          onChange={(e) => setKeyword(e.target.value)} // stateを更新
          onKeyDown={handleKeyDown} // Enterキーのハンドラを追加
          disabled={isPending}
        />
      </div>

      {/* リセットボタン */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReset}
        aria-label="フィルターをリセット"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" /> // isPending中はスピナー表示
        ) : (
          <X className="h-4 w-4" /> // 通常時はXアイコン
        )}
      </Button>
    </div>
  );
}
