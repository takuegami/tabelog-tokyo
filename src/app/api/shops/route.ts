import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
// import { supabase } from '@/lib/supabase'; // 不要になるため削除
import { createClient } from '@/lib/supabase/server'; // サーバー用クライアントをインポート
import { shopFormSchema } from '@/schemas/shop';
import { getAllShopsData } from '@/lib/data';

export const dynamic = 'force-dynamic'; // Always fetch the latest data

// GET: 全店舗情報を取得 (簡略化)
export async function GET() {
  try {
    const allShops = await getAllShopsData(); // lib/data.ts の関数を呼び出す
    return NextResponse.json(allShops);
  } catch (err) {
    // getAllShopsData 内でエラーはキャッチされるはずだが、念のため
    console.error('Error in GET /api/shops:', err);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

// POST: 新規店舗情報を登録
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(); // サーバー用クライアントを作成
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('API Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Zod スキーマでバリデーション
    // images はファイルアップロード後にURLが入る想定なので、POST時には必須ではないかもしれない
    // スキーマ側で optional になっているか、API側で調整が必要
    // ここでは shopSchema が images を optional として扱っていると仮定
    // フォームから送られてくるデータ（画像以外）をバリデーション
    // リクエストボディから images を取り出す (存在すれば)
    const images = body.images;

    // images を除いた部分を shopFormSchema でバリデーション
    const validationResult = shopFormSchema.safeParse(body);

    if (!validationResult.success) {
      // エラー詳細をログに出力
      console.error('Validation failed:', validationResult.error.flatten());
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Supabase にデータを挿入
    // validatedData に images が含まれていないことを確認 (含まれているとDBエラーの可能性)
    // ShopForm スキーマには images がないので問題ないはずだが念のため
    // バリデーション済みデータと images を結合して挿入データを作成
    // user_id は RLS ポリシーで処理されるため、ここでは含めない
    // validatedData から必要なフィールドのみを抽出し、dataToInsert を構築
    // これにより、意図しないフィールド (例: id) が含まれるのを防ぐ
    const { name, genre, area, url, holiday, area_category, memo, egami_hirano, visit, star } = validatedData;
    const dataToInsert = {
      name,
      genre: genre ?? null, // optional なので null を許容
      area: area ?? null,
      url: url === '' ? null : (url ?? null), // 空文字列は null に変換、undefined も null に
      holiday: holiday ?? null,
      area_category: area_category ?? null,
      memo: memo ?? null,
      egami_hirano: egami_hirano ?? null,
      visit: visit ?? null,
      star: star ?? null,
      images: images ?? null, // 外部から取得した images を設定
      is_takemachelin: false, // デフォルト値
    };

    // ★ 念のため、dataToInsert から id プロパティを削除 (存在する場合)
    //    エラーメッセージが pkey 違反を示しているため、意図せず id が含まれている可能性を排除
    delete (dataToInsert as any).id;

    console.log('Inserting data to Supabase:', dataToInsert); // 挿入データを確認

    // ★ 挿入直前の name と url の値を具体的にログ出力
    console.log(`Attempting to insert with name: "${dataToInsert.name}", url: "${dataToInsert.url}"`);

    // insert 操作は RLS ポリシーによって保護されている
    const { data: newShop, error } = await supabase
      .from('shops')
      .insert(dataToInsert) // 修正された dataToInsert を使用
      .select()
      .single();

    if (error) {
      // エラーオブジェクト全体をログに出力して詳細を確認
      console.error('Error inserting shop (Full Error Object):', JSON.stringify(error, null, 2));
      // 重複エラーなどの詳細なハンドリングも可能
      if (error.code === '23505') { // PostgreSQL unique violation
         return NextResponse.json({ error: 'Failed to insert shop', details: 'A shop with this name or URL might already exist.', code: error.code }, { status: 409 }); // Conflict
      }
      // エラーメッセージ、コード、ヒント、およびデバッグ用の挿入データを返す
      return NextResponse.json({
        error: 'Failed to insert shop',
        details: error.message,
        code: error.code, // エラーコードを追加
        hint: error.hint, // ヒントがあれば追加
        debug_inserted_data: dataToInsert // ★デバッグ用に挿入しようとしたデータを追加
      }, { status: 500 });
    }

    console.log('Successfully inserted shop:', newShop); // 成功ログ
    return NextResponse.json(newShop, { status: 201 }); // 201 Created ステータスを返す
  } catch (err: unknown) {
     if (err instanceof SyntaxError) {
       return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
     }
    console.error('Unexpected error inserting shop:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}