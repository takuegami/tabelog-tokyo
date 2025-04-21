import { NextResponse } from 'next/server';
// import path from 'path'; // 不要
// import fs from 'fs/promises'; // 不要
import { createClient } from '@/lib/supabase/server'; // ★ Supabase クライアントをインポート

// Shop 型の定義は不要

// dataFilePath は不要

export async function GET() {
  console.log('[API Options] GET request received.');
  try {
    const supabase = createClient(); // ★ Supabase クライアントを作成
    console.log('[API Options] Attempting to fetch data from Supabase...'); // ★ ログ変更

    // Supabase から genre と area_category を取得 (null を除外)
    const { data: shopsData, error } = await supabase
      .from('shops')
      .select('genre, area_category'); // ★ 必要なカラムのみ選択

    if (error) {
      console.error('[API Options] Error fetching data from Supabase:', error); // ★ エラーログ変更
      throw error; // エラーを再スローして catch ブロックで処理
    }

    if (!shopsData) {
        console.log('[API Options] No data received from Supabase.'); // ★ データなしログ
        // データがない場合は空のオプションを返す
         return NextResponse.json({ genres: [], areaCategories: [] });
    }

    console.log(`[API Options] Data fetched successfully from Supabase. Count: ${shopsData.length}`); // ★ ログ変更

    // ジャンルとエリアカテゴリのユニークなリストを作成
    const genres = new Set<string>();
    const areaCategories = new Set<string>();

    shopsData.forEach(shop => { // ★ shopsData を使用
      // null または空文字列でない場合のみ追加
      if (shop.genre && shop.genre.trim() !== '') {
        genres.add(shop.genre);
      }
      if (shop.area_category && shop.area_category.trim() !== '') {
        areaCategories.add(shop.area_category);
      }
    });

    // Set を配列に変換してソート
    const sortedGenres = Array.from(genres).sort();
    const sortedAreaCategories = Array.from(areaCategories).sort();

    return NextResponse.json({
      genres: sortedGenres,
      areaCategories: sortedAreaCategories,
    });

  } catch (error) {
    // ★ Supabase エラーまたはその他の予期せぬエラー
    console.error('[API Options] Error fetching options from Supabase:', error);
    return NextResponse.json({ message: 'Failed to fetch options due to internal server error.' }, { status: 500 });
  }
}