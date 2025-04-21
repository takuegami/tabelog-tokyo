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
import { shopFormSchema, ShopForm, Shop } from '@/schemas/shop';
import { useRouter } from 'next/navigation'; // useParams は不要
import { useState, useEffect } from 'react';
// createClient は不要 (認証チェックはサーバーで行う)
import { MultiImageUploader } from '@/app/(components)/multi-image-uploader';
import { Skeleton } from '@/components/ui/skeleton';

// オプションは固定値として定義 (propsで渡しても良い)
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

interface EditShopFormProps {
  shopId: string; // shopId を props で受け取る
  initialShopData: Shop; // 初期データを props で受け取る
  options: OptionsResponse; // オプションデータを props で受け取る
  redirectUrl: string | null; // ★ redirectUrl を props で受け取る
}

export function EditShopForm({ shopId, initialShopData, options, redirectUrl }: EditShopFormProps) { // ★ redirectUrl を受け取る
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // isLoadingOptions は不要 (propsで受け取るため)
  // isLoadingShop は不要 (propsで受け取るため)
  // shopData は不要 (initialShopData を使う)

  const form = useForm<ShopForm>({
    resolver: zodResolver(shopFormSchema),
    // defaultValues を initialShopData から設定
    defaultValues: {
      name: initialShopData.name,
      genre: initialShopData.genre ?? '',
      area: initialShopData.area ?? '',
      url: initialShopData.url ?? '',
      holiday: initialShopData.holiday ?? '',
      area_category: initialShopData.area_category ?? '',
      memo: initialShopData.memo ?? '',
      egami_hirano: (initialShopData.egami_hirano as ShopForm['egami_hirano']) ?? undefined,
      visit: (initialShopData.visit as ShopForm['visit']) ?? undefined,
      images: initialShopData.images ?? [],
      star: initialShopData.star ?? undefined, // star の初期値を追加
    }
  });

  // 認証チェック useEffect は削除 (サーバーで行う)
  // オプション取得 useEffect は削除 (propsで受け取る)
  // 店舗データ取得 useEffect は削除 (propsで受け取る)

  async function onSubmit(values: ShopForm) {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log("Updating shop with values:", values);

    try {
      // API呼び出しはそのまま
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '店舗の更新に失敗しました。');
      }

      // ★ redirectUrl があればそこへ、なければ '/' へリダイレクト
      const destination = redirectUrl ? decodeURIComponent(redirectUrl) : '/';
      router.push(destination, { scroll: false });
      router.refresh(); // ページデータを再取得して更新
      console.log(`店舗が正常に更新されました。リダイレクト先: ${destination}`);

    } catch (error) {
      console.error('店舗更新エラー:', error);
      setSubmitError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ローディング表示は削除 (親コンポーネントで行う)
  // エラー表示も削除 (親コンポーネントで行う)

  return (
    // ★ <Form> ラッパーと FormField を元に戻す
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 店舗名 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>ジャンル</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="ジャンルを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options?.genres && options.genres.length > 0 ? ( // props.options を使用
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
          render={({ field }) => (
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
          render={({ field }) => (
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
          render={({ field }) => (
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>エリアカテゴリ</FormLabel>
               <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="エリアカテゴリを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                   {options?.areaCategories && options.areaCategories.length > 0 ? ( // props.options を使用
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
          render={({ field }) => (
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Egami/Hirano おすすめ</FormLabel>
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>訪問者</FormLabel>
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

        {/* 星評価 */}
        <FormField
          control={form.control}
          name="star"
          render={({ field }) => (
            <FormItem>
              <FormLabel>星評価</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? parseFloat(value) : undefined)} // 文字列を数値に変換
                value={field.value !== undefined ? String(field.value) : ''} // 数値を文字列に変換
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="評価を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* 0 から 5 まで 0.5 刻みのオプションを生成 */}
                  {Array.from({ length: 11 }, (_, i) => i * 0.5).map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value.toFixed(1)} {/* 0.5, 1.0 のように表示 */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                お店の評価を0.5刻みで選択してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 画像アップロード */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '更新中...' : '更新する'}
        </Button>
      </form>
    </Form>
  );
}