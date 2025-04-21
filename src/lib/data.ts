import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod'; // Zod をインポート
import { supabase } from '@/lib/supabase'; // Supabase クライアントをインポート
import { dbShopSchema, Shop as DbShop } from '@/schemas/shop'; // DB 用のスキーマと型をインポート

/**
 * JSON ファイル用の店舗データの型定義 (既存)
 */
export interface Shop {
  url: string | null;
  name: string;
  area: string;        // 最寄り駅など
  holiday: string;
  genre: string;
  area_category: string; // 地域カテゴリ (フィルター用)
  is_takemachelin: boolean;
  memo: string;
  'egami-hirano': string; // egamiかhiranoか両方か
  visit: string;       // zumiかmotomuか
  image?: string;      // オプショナルな画像フィールド (単一画像用、将来的に削除検討)
  images?: string[];   // オプショナルな画像配列フィールド (カルーセル用)
}

/**
 * JSONデータを読み込み、型付けして返却する関数 (既存)
 */
export async function loadShopData(): Promise<Shop[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'shops.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const shops: Shop[] = JSON.parse(jsonData);
    return shops;
  } catch (error) {
    console.error('Error loading or processing shop data:', error);
    return [];
  }
}

/**
 * Supabase と JSON から全店舗データを取得し、マージして返す関数 (新規追加)
 */
export async function getAllShopsData(): Promise<DbShop[]> {
  try {
    // 1. Supabase からデータを取得
    const { data: supabaseShops, error: supabaseError } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('Error fetching shops from Supabase:', supabaseError);
      // エラーが発生しても処理を続行し、JSON データのみを返すことも可能だが、
      // ここではエラーとして空配列を返す（またはエラーをスローする）
      // throw new Error(`Failed to fetch shops from Supabase: ${supabaseError.message}`);
      return []; // Supabase エラー時は空を返す
    }

    // 2. shops.json からデータを取得 (既存の loadShopData を利用)
    const jsonShops = await loadShopData(); // JsonShop[] 型

    // 3. jsonShops を DbShop 型に変換・マッピング
    const jsonShopsConverted: DbShop[] = jsonShops.map((shop, index) => {
      let validUrl: string | null = null;
      const originalUrl = shop.url;

      if (typeof originalUrl === 'string' && originalUrl.trim() !== '') {
        const parsedUrl = z.string().url().safeParse(originalUrl);
        if (parsedUrl.success) {
          validUrl = parsedUrl.data;
        } else {
          console.warn(`[Data Conversion] Invalid URL found in shops.json at original index ${index} (value: "${originalUrl}"). Setting URL to null.`);
          validUrl = null;
        }
      } else {
        validUrl = null;
      }

      let validImages: string[] | null = null;
      if (Array.isArray(shop.images)) {
        const urlSchema = z.string().url();
        const validatedImages = shop.images
          .filter(img => typeof img === 'string' && img.trim() !== '')
          .filter(img => urlSchema.safeParse(img).success);
        validImages = validatedImages.length > 0 ? validatedImages : null;
      } else {
        validImages = null;
      }

      // DbShop 型に合わせて変換
      return {
        id: -(index + 1), // 負の ID
        created_at: '1970-01-01T00:00:00+00:00', // 仮の日時
        name: shop.name || '名称不明',
        url: validUrl,
        area: typeof shop.area === 'string' ? shop.area : null,
        holiday: typeof shop.holiday === 'string' ? shop.holiday : null,
        genre: typeof shop.genre === 'string' ? shop.genre : null,
        area_category: typeof shop.area_category === 'string' ? shop.area_category : null,
        is_takemachelin: shop.is_takemachelin === true,
        memo: typeof shop.memo === 'string' ? shop.memo : null,
        // 注意: JSON の 'egami-hirano' を DbShop の egami_hirano にマッピング
        egami_hirano: typeof shop['egami-hirano'] === 'string' ? shop['egami-hirano'] : null,
        visit: typeof shop.visit === 'string' ? shop.visit : null,
        images: validImages,
      };
    });

    // 4. Supabase のデータと変換後の JSON データをマージ
    const allShops = [...(supabaseShops || []), ...jsonShopsConverted];

    // 5. マージしたデータをバリデーション (dbShopSchema を使用)
    const validationResult = z.array(dbShopSchema).safeParse(allShops);

    if (!validationResult.success) {
      console.error('[Data Validation Error] Validation failed after merging data. Returning empty array.', validationResult.error.flatten());
      return []; // バリデーション失敗時は空配列
    }

    console.log('[getAllShopsData] Successfully fetched and merged data. Count:', validationResult.data.length);
    return validationResult.data; // バリデーション成功時はデータを返す

  } catch (err) {
    console.error('Unexpected error in getAllShopsData:', err);
    return []; // 予期せぬエラー時も空配列
  }
}
