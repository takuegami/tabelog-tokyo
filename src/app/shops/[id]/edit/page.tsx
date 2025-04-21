'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shopFormSchema, ShopForm, Shop } from '@/schemas/shop'; // Shop 型をインポート
import { useRouter, useParams } from 'next/navigation'; // useParams をインポート
import { useState, useEffect } from 'react';
import { MultiImageUploader } from '@/app/(components)/multi-image-uploader';
import { Skeleton } from '@/components/ui/skeleton';

// Egami/Hirano と Visit のオプションは固定
const egamiHiranoOptions = [
  { value: "egami", label: "Egami" },
  { value: "hirano", label: "Hirano" },
  { value: "egami-hirano", label: "Egami & Hirano" },
];
const visitOptions = [
  { value: "zumi", label: "Zumi" },
  { value: "motomu", label: "Motomu" },
];

interface OptionsResponse {
  genres: string[];
  areaCategories: string[];
}

export default function EditShopPage() { // コンポーネント名を変更
  const router = useRouter();
  const params = useParams(); // useParams を使用
  const shopId = params.id as string; // URLから店舗IDを取得
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingShop, setIsLoadingShop] = useState(true); // 店舗データのローディング状態
  const [shopData, setShopData] = useState<Shop | null>(null); // 店舗データ

  // コンポーネントマウント時にAPIからオプションを取得
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const response = await fetch('/api/options');
        if (!response.ok) {
          throw new Error('Failed to fetch options');
        }
        const data: OptionsResponse = await response.json();
        setOptions(data);
      } catch (error) {
        console.error('Error fetching options:', error);
        // エラーハンドリング (例: エラーメッセージ表示)
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // form の宣言を useEffect の前に移動
  const form = useForm<ShopForm>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: { // defaultValues は useEffect 内で reset するため、空でも良いが、型安全のため初期値を設定
      name: '',
      genre: '',
      area: '',
      url: '',
      holiday: '',
      area_category: '',
      memo: '',
      egami_hirano: undefined,
      visit: undefined,
      images: [] // 末尾のカンマを削除, 重複キーを削除
    }
  });

  // 店舗データを取得する useEffect
  useEffect(() => {
    // form.reset が useEffect の依存配列に含まれているため、
    // レンダリングごとに form.reset の参照が変わり、無限ループする可能性がある。
    // useCallback でメモ化するか、依存配列から削除し、手動で呼び出すなどの対策が必要。
    // ここでは依存配列から form.reset を削除し、shopId の変更時のみ実行するようにする。
    if (!shopId) return;

    const fetchShopData = async () => {
      setIsLoadingShop(true);
      try {
        const response = await fetch(`/api/shops/${shopId}`); // パスを /api/shops/ に戻す
        if (!response.ok) {
          // 404 Not Found の場合のエラーハンドリングを追加
          if (response.status === 404) {
             setSubmitError('指定された店舗が見つかりませんでした。');
             setShopData(null); // shopData を null に設定
             return; // これ以上処理を進めない
          }
          throw new Error('Failed to fetch shop data');
        }
        const data: Shop = await response.json();
        setShopData(data);
        // 取得したデータでフォームを初期化 (null を空文字列に変換、型アサーション追加)
        form.reset({
          name: data.name,
          genre: data.genre ?? '',
          area: data.area ?? '',
          url: data.url ?? '',
          holiday: data.holiday ?? '',
          area_category: data.area_category ?? '',
          memo: data.memo ?? '',
          // APIからの値が ShopForm のリテラル型に合致することを保証するため型アサーションを使用
          egami_hirano: (data.egami_hirano as ShopForm['egami_hirano']) ?? undefined,
          visit: (data.visit as ShopForm['visit']) ?? undefined,
          images: data.images ?? [],
        });
      } catch (error) {
        console.error('Error fetching shop data:', error);
        // fetchShopData 内で発生した一般的なエラー
        setSubmitError('店舗データの取得中にエラーが発生しました。');
      } finally {
        setIsLoadingShop(false);
      }
    };

    fetchShopData();
  }, [shopId]); // 依存配列を shopId のみに変更

  // onSubmit 関数を useEffect の後に定義
  async function onSubmit(values: ShopForm) { // 更新処理
    setIsSubmitting(true);
    setSubmitError(null);
    console.log("Updating shop with values:", values);

    try {
      const response = await fetch(`/api/shops/${shopId}`, { // パスを /api/shops/ に戻す
        method: 'PUT', // または PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '店舗の更新に失敗しました。'); // メッセージ変更
      }

      router.push('/'); // 更新後トップページへ遷移（必要に応じて変更）
      console.log('店舗が正常に更新されました。'); // メッセージ変更

    } catch (error) {
      console.error('店舗更新エラー:', error); // メッセージ変更
      setSubmitError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  // データ読み込み中のローディング表示
  if (isLoadingOptions || isLoadingShop) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  // 店舗データが見つからない場合のエラー表示
  if (!shopData && !isLoadingShop) {
     return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-destructive">エラー</h1>
        <p className="text-muted-foreground">指定された店舗が見つかりませんでした。</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">戻る</Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">店舗情報編集</h1> {/* タイトル変更 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* 店舗名 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'name'> }) => (
              <FormItem>
                <FormLabel>店舗名 *</FormLabel>
                <FormControl>
                  <Input placeholder="例: 美味しいレストラン" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ジャンル */}
          <FormField
            control={form.control}
            name="genre"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'genre'> }) => (
              <FormItem>
                <FormLabel>ジャンル</FormLabel>
                {/* Selectコンポーネントの value を正しく設定 */}
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="ジャンルを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingOptions ? (
                      <div className="p-2">
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : options?.genres && options.genres.length > 0 ? (
                      options.genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">オプションが見つかりません</div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 最寄駅 */}
          <FormField
            control={form.control}
            name="area"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'area'> }) => (
              <FormItem>
                <FormLabel>最寄駅</FormLabel>
                <FormControl>
                  <Input placeholder="例: 渋谷駅" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* URL */}
          <FormField
            control={form.control}
            name="url"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'url'> }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 定休日 */}
          <FormField
            control={form.control}
            name="holiday"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'holiday'> }) => (
              <FormItem>
                <FormLabel>定休日</FormLabel>
                <FormControl>
                  <Input placeholder="例: 日曜日、祝日" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* エリアカテゴリ */}
          <FormField
            control={form.control}
            name="area_category"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'area_category'> }) => (
              <FormItem>
                <FormLabel>エリアカテゴリ</FormLabel>
                 {/* Selectコンポーネントの value を正しく設定 */}
                 <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="エリアカテゴリを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     {isLoadingOptions ? (
                      <div className="p-2">
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : options?.areaCategories && options.areaCategories.length > 0 ? (
                      options.areaCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">オプションが見つかりません</div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

           {/* メモ */}
           <FormField
            control={form.control}
            name="memo"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'memo'> }) => (
              <FormItem>
                <FormLabel>メモ</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="お店に関するメモ..."
                    className="resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Egami/Hirano */}
          <FormField
            control={form.control}
            name="egami_hirano"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'egami_hirano'> }) => (
              <FormItem>
                <FormLabel>Egami/Hirano おすすめ</FormLabel>
                {/* Selectコンポーネントの value を正しく設定 */}
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {egamiHiranoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Visit */}
          <FormField
            control={form.control}
            name="visit"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'visit'> }) => (
              <FormItem>
                <FormLabel>訪問者</FormLabel>
                {/* Selectコンポーネントの value を正しく設定 */}
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {visitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 画像アップロード */}
          <FormField
            control={form.control}
            name="images"
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'images'> }) => (
              <FormItem>
                <FormLabel>画像</FormLabel>
                <FormControl>
                  <MultiImageUploader
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
                 <FormDescription>
                  複数の画像ファイルをアップロードできます。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />


          {submitError && (
            <p className="text-sm font-medium text-destructive">{submitError}</p>
          )}

          {/* disabled 条件に isLoadingShop を追加、ボタンテキスト変更 */}
          <Button type="submit" disabled={isSubmitting || isLoadingOptions || isLoadingShop}>
            {isSubmitting ? '更新中...' : '更新する'}
          </Button>
        </form>
      </Form>
    </div>
  );
}