import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod'; // Zod をインポート
import { supabase } from '@/lib/supabase'; // Supabase クライアントをインポート
import { dbShopSchema, Shop as DbShop } from '@/schemas/shop'; // DB 用のスキーマと型をインポート

// 不要になった JSON 用の Shop インターフェースと loadShopData 関数を削除

/**
 * Supabase から全店舗データを取得する関数 (修正: Supabase のみ参照)
 */
export async function getAllShopsData(): Promise<DbShop[]> {
  try {
    // Supabase からデータを取得 (コード側の limit を削除)
    const { data: supabaseShops, error: supabaseError } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
      // .limit(4000); // Supabase 側の設定に任せるためコメントアウトまたは削除

    if (supabaseError) {
      console.error('Error fetching shops from Supabase:', supabaseError);
      return []; // エラー時は空配列
    }

    // Supabase から取得したデータをそのままバリデーション
    const validationResult = z.array(dbShopSchema).safeParse(supabaseShops);

    if (!validationResult.success) {
      console.error('[Data Validation Error] Supabase data validation failed. Returning empty array.', validationResult.error.flatten());
      // バリデーション失敗時のデータを確認 (ログ出力を有効化)
      console.error('Invalid Supabase data (first few records):', JSON.stringify(supabaseShops?.slice(0, 5), null, 2)); // 最初の5件を表示
      return []; // バリデーション失敗時は空配列
    }

    console.log('[getAllShopsData] Successfully fetched data from Supabase. Count:', validationResult.data.length);
    return validationResult.data; // バリデーション成功時はデータを返す

  } catch (err) {
    console.error('Unexpected error in getAllShopsData:', err);
    return []; // 予期せぬエラー時も空配列
  }
}
