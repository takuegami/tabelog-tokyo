import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Shop, shopFormSchema } from '@/schemas/shop';
// import { supabase } from '@/lib/supabase'; // 古いクライアントを削除
import { createClient } from '@/lib/supabase/server'; // サーバー用クライアントをインポート

// JSON 関連の関数 (readShops, writeShops) と dataFilePath は不要になったため削除

// GET リクエストハンドラ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shopId = params.id;
  console.log(`[API GET /api/shops/${shopId}] Received request.`); // ★ログ追加

  if (!shopId) {
    return NextResponse.json({ message: 'Shop ID is required' }, { status: 400 });
  }

  try {
    const supabase = createClient(); // ★ 新しいクライアントを作成
    // ★ 認証チェックを追加 (任意だが、RLSで制御するなら不要な場合も)
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   console.error(`[API GET /api/shops/${shopId}] Auth Error:`, authError);
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // console.log(`[API GET /api/shops/${shopId}] User authenticated:`, user?.id); // ★ログ追加

    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      return NextResponse.json({ message: 'Invalid Shop ID format' }, { status: 400 });
    }

    console.log(`[API GET /api/shops/${shopId}] Fetching shop data from Supabase...`); // ★ログ追加
    // --- Supabase からデータを取得 ---
    // RLSのSELECTポリシーに基づいてデータが取得される
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', numericShopId)
      .single();

      if (error) {
        // データが見つからない場合 (PGRST116) は 404 を返す
        if (error.code === 'PGRST116') {
          console.log(`[API GET /api/shops/${shopId}] Shop not found in Supabase.`); // パスを元に戻す
          return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
        }
        // その他のDBエラー
        console.error(`[API GET /api/shops/${shopId}] Error fetching shop from Supabase:`, error); // パスを元に戻す
        return NextResponse.json({ message: 'Failed to fetch shop from Supabase', error: error.message }, { status: 500 });
      }
      // shop = data as Shop; // data を直接 shop として受け取るように変更したため不要

    // JSON 関連の分岐 (else if, else) を削除

    // shop が見つかった場合 (null でない場合)
    if (shop) {
      console.log(`[API GET /api/shops/${shopId}] Shop found:`, shop.name); // パスを元に戻す
      return NextResponse.json(shop, { status: 200 });
    } else {
      // このルートは通常通らないはずだが、念のため 404 を返す
      console.log(`[API GET /api/shops/${shopId}] Shop not found (final check).`); // パスを元に戻す
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

  } catch (error) {
    console.error(`[API GET /api/shops/${shopId}] Error fetching shop:`, error); // パスを元に戻す
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to fetch shop', error: errorMessage }, { status: 500 });
  }
}


// PUT リクエストハンドラ (追加)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shopId = params.id;

  if (!shopId) {
    return NextResponse.json({ message: 'Shop ID is required' }, { status: 400 });
  }

  try {
    const supabase = createClient(); // ★ 新しいクライアントを作成
    const { data: { user }, error: authError } = await supabase.auth.getUser(); // ★ 認証チェック追加

    if (authError || !user) {
      console.error(`[API PUT /api/shops/${shopId}] Auth Error:`, authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      return NextResponse.json({ message: 'Invalid Shop ID format' }, { status: 400 });
    }

    const body = await request.json();

    // バリデーションを有効化
    const validationResult = shopFormSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(`[API PUT /api/shops/${shopId}] Validation failed:`, validationResult.error.flatten());
      return NextResponse.json({ message: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    const validatedData = validationResult.data; // バリデーション済みデータを使用
    console.log(`[API PUT /api/shops/${shopId}] Received validated data:`, JSON.stringify(validatedData, null, 2));


    // JSON 関連の分岐を削除し、Supabase のみ更新
    // --- Supabase のデータを更新 ---
    // validatedData には id, created_at が含まれないため、そのまま updateData として使用
    const updateData = validatedData;
    // Supabase に渡す更新データをログ出力
    console.log(`[API PUT /api/shops/${shopId}] Data to update in Supabase:`, JSON.stringify(updateData, null, 2));


      // RLSのUPDATEポリシーに基づいて更新が行われる
      // 必要であれば .eq('user_id', user.id) を追加
      const { data, error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', numericShopId)
        // .eq('user_id', user.id) // ★ 誰でも更新可能にするためコメントアウト
        .select()
        .single();

      if (error) {
        console.error(`[API PUT /api/shops/${shopId}] Error updating shop in Supabase:`, error);
         // レコードが存在しない場合 (PGRST116) なども考慮
        if (error.code === 'PGRST116') {
           return NextResponse.json({ message: 'Shop not found in Supabase' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Failed to update shop in Supabase', error: error.message }, { status: 500 });
      }
      console.log(`[API PUT /api/shops/${shopId}] Shop updated successfully in Supabase:`, data.name);
      return new Response(null, { status: 204 }); // No Content を返す

    // JSON 関連の分岐 (else if, else) を削除

  } catch (error: unknown) {
     if (error instanceof SyntaxError) {
       // JSON パースエラー
       console.error(`[API PUT /api/shops/${shopId}] Invalid JSON format received.`);
       return NextResponse.json({ message: 'Invalid JSON format' }, { status: 400 });
     }
    console.error(`[API PUT /api/shops/${shopId}] Error updating shop:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to update shop', error: errorMessage }, { status: 500 });
  }
}


// DELETE リクエストハンドラ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } // ドキュメントで一般的な形式に戻す
) {
  const shopId = params.id;

  if (!shopId) {
    return NextResponse.json({ message: 'Shop ID is required' }, { status: 400 });
  }

  try {
    const supabase = createClient(); // ★ 新しいクライアントを作成
    const { data: { user }, error: authError } = await supabase.auth.getUser(); // ★ 認証チェック追加

    if (authError || !user) {
      console.error(`[API DELETE /api/shops/${shopId}] Auth Error:`, authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // shopId を数値に変換
    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      return NextResponse.json({ message: 'Invalid Shop ID format' }, { status: 400 });
    }

    // --- Supabase のデータを削除 ---
    // RLSのDELETEポリシーに基づいて削除が行われる
    // 必要であれば .eq('user_id', user.id) を追加
    const { error } = await supabase
      .from('shops')
      .delete()
      .eq('id', numericShopId);
      // .eq('user_id', user.id); // ★ 誰でも削除可能にするためコメントアウト

      if (error) {
        console.error(`[API DELETE /api/shops/${shopId}] Error deleting shop from Supabase:`, error); // パスを元に戻す
        // エラーレスポンスを返す前に、レコードが存在しない可能性も考慮する (例: error.code === 'PGRST116')
        // ここでは単純に 500 エラーとする
        return NextResponse.json({ message: 'Failed to delete shop from Supabase', error: error.message }, { status: 500 });
      }
       // Supabase からの削除が成功した場合、削除された件数などを確認できるが、ここでは省略
       // const { count } = await supabase... (delete の結果から count を取得)
       // if (count === 0) {
       //   return NextResponse.json({ message: 'Shop not found in Supabase' }, { status: 404 });
       // }

      console.log(`[API DELETE /api/shops/${shopId}] Shop deleted successfully from Supabase.`);
      return NextResponse.json({ message: 'Shop deleted successfully' }, { status: 200 });

    // JSON 関連の分岐 (else if, else) を削除

  } catch (error) {
    console.error(`[API DELETE /api/shops/${shopId}] Error deleting shop:`, error); // パスを元に戻す
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to delete shop', error: errorMessage }, { status: 500 });
  }
}