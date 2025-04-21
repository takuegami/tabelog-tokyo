import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs/promises'; // fs/promises をインポート
import path from 'path'; // path をインポート
import { supabase } from '@/lib/supabase'; // Supabase クライアントをインポート (パスエイリアスを使用)
import { shopFormSchema } from '@/schemas/shop'; // dbShopSchema と DbShop は不要に
import { getAllShopsData } from '@/lib/data'; // 新しい関数をインポート

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
    const dataToInsert = {
      ...validatedData,
      images: images ?? null, // images がなければ null を設定
    };

    console.log('Inserting data to Supabase:', dataToInsert); // 挿入データを確認 (images が含まれているか)

    const { data: newShop, error } = await supabase
      .from('shops')
      .insert(dataToInsert) // images を含まないデータを挿入
      .select() // 挿入されたレコードを返すように指定
      .single(); // 単一のレコードを期待

    if (error) {
      console.error('Error inserting shop:', error);
      // 重複エラーなどの詳細なハンドリングも可能
      if (error.code === '23505') { // PostgreSQL unique violation
         return NextResponse.json({ error: 'Failed to insert shop', details: 'A shop with this name or URL might already exist.' }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: 'Failed to insert shop', details: error.message }, { status: 500 });
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