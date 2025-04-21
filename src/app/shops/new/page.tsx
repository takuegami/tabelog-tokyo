'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
// import { z } from 'zod'; // shopFormSchema で zod は使われているが、このファイルでは直接使っていないためコメントアウト or 削除
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
import { shopFormSchema, ShopForm } from '@/schemas/shop';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // useEffect をインポート
import { createClient } from '@/lib/supabase/client'; // Supabase クライアントをインポート
import { MultiImageUploader } from '@/app/(components)/multi-image-uploader';
import { Skeleton } from '@/components/ui/skeleton'; // Skeleton をインポート

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

export default function NewShopPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const supabase = createClient(); // Supabase クライアントを初期化

  // コンポーネントマウント時に認証チェックとオプション取得
  useEffect(() => {
    const checkAuthAndFetchOptions = async () => {
      console.log('[Auth Check] Running checkAuth in useEffect (new page)...'); // ★ログ追加
      const { data: { user }, error } = await supabase.auth.getUser(); // ★ error も取得
      console.log('[Auth Check] getUser result (new page) - User:', user); // ★ログ追加
      console.log('[Auth Check] getUser result (new page) - Error:', error); // ★ログ追加

      if (error) {
        console.error('[Auth Check] Error fetching user (new page):', error.message); // ★エラーログ追加
      }

      if (!user) {
        console.log('[Auth Check] No user found, attempting redirect to /login (new page)...'); // ★ログ追加
        // 未認証の場合はログインページへリダイレクト
        router.push('/login');
        return; // 認証されていない場合は以降の処理を中断
      } else {
         console.log('[Auth Check] User found, proceeding (new page).'); // ★ログ追加
      }

      // 認証済みの場合のみオプションを取得
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

    checkAuthAndFetchOptions();
  }, [router, supabase]); // router と supabase を依存配列に追加

  const form = useForm<ShopForm>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: '',
      genre: '',
      area: '',
      url: '',
      holiday: '',
      area_category: '',
      memo: '',
      egami_hirano: undefined,
      visit: undefined,
      images: [],
      star: undefined, // star のデフォルト値を追加
    },
  });

  async function onSubmit(values: ShopForm) {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log("Form Values:", values);

    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '店舗の登録に失敗しました。');
      }

      router.push('/');
      console.log('店舗が正常に登録されました。');

    } catch (error) {
      console.error('店舗登録エラー:', error);
      setSubmitError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">新規店舗登録</h1>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            render={({ field }: { field: ControllerRenderProps<ShopForm, 'star'> }) => ( // 型アサーションを追加
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

          <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
            {isSubmitting ? '登録中...' : '登録する'}
          </Button>
        </form>
      </Form>
    </div>
  );
}