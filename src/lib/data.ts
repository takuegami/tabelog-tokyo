import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
// import { supabase } from '@/lib/supabase'; // 古いクライアントは削除
import { createClient } from '@/lib/supabase/server'; // サーバー用クライアントをインポート
import { dbShopSchema, Shop as DbShop } from '@/schemas/shop';

// 不要になった JSON 用の Shop インターフェースと loadShopData 関数を削除

/**
 * Supabase から全店舗データを取得する関数 (修正: Supabase のみ参照)
 */
export async function getAllShopsData(): Promise<DbShop[]> {
  try {
    console.log('[getAllShopsData] Attempting to create Supabase client...'); // ★追加
    const supabase = createClient(); // サーバー用クライアントを作成
    console.log('[getAllShopsData] Supabase client created. Fetching data...'); // ★追加

    // Supabase からデータを取得 (コード側の limit を削除)
    // RLSポリシーによっては、ここで認証状態に応じたデータのみが返る
    const { data: supabaseShops, error: supabaseError } = await supabase
      .from('shops')
      .select('*'); // select('*') は1回でOK
      // .limit(4000); // Supabase 側の設定に任せるためコメントアウトまたは削除

    if (supabaseError) {
      console.error('[getAllShopsData] Error fetching shops from Supabase:', supabaseError); // ★変更: 識別子追加
      return []; // エラー時は空配列
    }

    console.log('[getAllShopsData] Data fetched from Supabase (raw):', supabaseShops); // ★追加: 生データをログ出力

    // Supabase から取得したデータをそのままバリデーション
    const validationResult = z.array(dbShopSchema).safeParse(supabaseShops);

    if (!validationResult.success) {
      console.error('[getAllShopsData] Data validation failed.', validationResult.error.flatten()); // ★変更: 識別子追加
      // バリデーション失敗時のデータを確認 (ログ出力を有効化)
      console.error('[getAllShopsData] Invalid Supabase data (first few records):', JSON.stringify(supabaseShops?.slice(0, 5), null, 2)); // 最初の5件を表示
      return []; // バリデーション失敗時は空配列
    }

    console.log('[getAllShopsData] Successfully fetched data from Supabase. Count:', validationResult.data.length);
    // egami_hirano フラグを優先し、その上で更新日時(updated_at)降順にソート
    return validationResult.data
      .slice()
      .sort((a, b) => {
        const aPri = ['egami', 'hirano', 'egami-hirano'].includes(a.egami_hirano ?? '');
        const bPri = ['egami', 'hirano', 'egami-hirano'].includes(b.egami_hirano ?? '');
        if (aPri && !bPri) return -1;
        if (!aPri && bPri) return 1;
        const tA = Date.parse(a.updated_at ?? a.created_at) || 0;
        const tB = Date.parse(b.updated_at ?? b.created_at) || 0;
        return tB - tA;
      });

  } catch (err) {
    console.error('Unexpected error in getAllShopsData:', err);
    return []; // 予期せぬエラー時も空配列
  }
}
