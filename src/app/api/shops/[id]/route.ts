import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Shop } from '@/schemas/shop'; // Shop 型をインポート
import { supabase } from '@/lib/supabase'; // Supabase クライアントをインポート

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'shops.json');

// データ読み込み関数
async function readShops(): Promise<Shop[]> {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const shops = JSON.parse(fileContent);
    // ここで shops 配列の各要素を shopSchema でバリデーションするのがより堅牢
    return shops as Shop[];
  } catch (error) {
    console.error('Error reading shops data:', error);
    // ファイルが存在しない、または読み取りエラーの場合は空の配列を返すか、エラーをスロー
    return [];
  }
}

// データ書き込み関数
async function writeShops(shops: Shop[]): Promise<void> {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(shops, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing shops data:', error);
    throw new Error('Failed to write shop data.'); // 書き込み失敗時はエラーをスロー
  }
}

// GET リクエストハンドラ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shopId = params.id;

  if (!shopId) {
    return NextResponse.json({ message: 'Shop ID is required' }, { status: 400 });
  }

  try {
    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      return NextResponse.json({ message: 'Invalid Shop ID format' }, { status: 400 });
    }

    let shop: Shop | null = null;

    if (numericShopId > 0) {
      // --- Supabase からデータを取得 ---
      const { data, error } = await supabase
        .from('shops')
        .select('*') // 必要なカラムを指定する方が効率的
        .eq('id', numericShopId)
        .single(); // 単一のレコードを取得

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
      shop = data as Shop; // 型アサーション

    } else if (numericShopId < 0) {
      // --- shops.json からデータを取得 ---
      const jsonIndex = -numericShopId - 1;
      const shops = await readShops();

      if (jsonIndex >= 0 && jsonIndex < shops.length) {
        shop = shops[jsonIndex];
        // JSONデータには id が含まれていない場合があるので、ここで付与する
        shop = { ...shop, id: numericShopId };
      } else {
        console.log(`[API GET /api/shops/${shopId}] Shop not found in JSON data (invalid index: ${jsonIndex}).`); // パスを元に戻す
        return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
      }
    } else {
      // ID が 0 の場合
      return NextResponse.json({ message: 'Shop ID cannot be zero' }, { status: 400 });
    }

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
    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      return NextResponse.json({ message: 'Invalid Shop ID format' }, { status: 400 });
    }

    const body = await request.json();

    // TODO: ここで shopFormSchema を使って body をバリデーションする
    // const validationResult = shopFormSchema.safeParse(body);
    // if (!validationResult.success) {
    //   console.error(`[API PUT /api/shops/${shopId}] Validation failed:`, validationResult.error.flatten());
    //   return NextResponse.json({ message: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    // }
    // const validatedData = validationResult.data;

    // バリデーションを一旦スキップして、受け取った body をそのまま使う (後で追加推奨)
    const validatedData = body;


    if (numericShopId > 0) {
      // --- Supabase のデータを更新 ---
      // created_at や id は更新対象から除外することが一般的
      const { id, created_at, ...updateData } = validatedData;

      const { data, error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', numericShopId)
        .select() // 更新後のデータを返す
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
      // 更新成功時は、更新後のデータを返すか、No Content を返すか選択
      // return NextResponse.json(data, { status: 200 });
      return new Response(null, { status: 204 }); // No Content を返す (ボディなし)

    } else if (numericShopId < 0) {
      // --- shops.json のデータを更新 ---
      const jsonIndex = -numericShopId - 1;
      const shops = await readShops();

      if (jsonIndex >= 0 && jsonIndex < shops.length) {
        // JSON データを更新 (id や created_at は通常更新しない)
        const originalShop = shops[jsonIndex];
        shops[jsonIndex] = {
          ...originalShop, // 元のデータを保持しつつ
          ...validatedData, // 更新データで上書き
          id: numericShopId, // ID は変更しない
          created_at: originalShop.created_at // created_at も変更しない
        };
        await writeShops(shops);
        console.log(`[API PUT /api/shops/${shopId}] Shop updated successfully in JSON data at index ${jsonIndex}.`);
        // return NextResponse.json(shops[jsonIndex], { status: 200 });
         return new Response(null, { status: 204 }); // No Content を返す

      } else {
        console.log(`[API PUT /api/shops/${shopId}] Shop not found in JSON data (invalid index: ${jsonIndex}).`);
        return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
      }
    } else {
      // ID が 0 の場合
      return NextResponse.json({ message: 'Shop ID cannot be zero' }, { status: 400 });
    }

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
    // shopId を数値に変換
    const numericShopId = parseInt(shopId, 10);
    if (isNaN(numericShopId)) {
      return NextResponse.json({ message: 'Invalid Shop ID format' }, { status: 400 });
    }

    // ID が正か負かで処理を分岐
    if (numericShopId > 0) {
      // --- Supabase のデータを削除 ---
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', numericShopId); // 数値の ID で Supabase を検索

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

      console.log(`[API DELETE /api/shops/${shopId}] Shop deleted successfully from Supabase.`); // パスを元に戻す
      return NextResponse.json({ message: 'Shop deleted successfully' }, { status: 200 });

    } else if (numericShopId < 0) {
      // --- shops.json のデータを削除 ---
      const jsonIndex = -numericShopId - 1; // 負の ID から元のインデックスを計算

      const shops = await readShops(); // JSON ファイルを読み込む

      if (jsonIndex < 0 || jsonIndex >= shops.length) {
        // 計算されたインデックスが無効な場合
        console.error(`[API DELETE /api/shops/${shopId}] Invalid index calculated for JSON deletion: ${jsonIndex}`); // パスを元に戻す
        return NextResponse.json({ message: 'Shop not found in JSON data (invalid index)' }, { status: 404 });
      }

      // 配列から店舗を削除
      shops.splice(jsonIndex, 1);

      // 更新された店舗リストをファイルに書き込む
      await writeShops(shops);

      console.log(`[API DELETE /api/shops/${shopId}] Shop deleted successfully from JSON data at index ${jsonIndex}.`); // パスを元に戻す
      return NextResponse.json({ message: 'Shop deleted successfully' }, { status: 200 });

    } else {
      // ID が 0 の場合 (通常はありえない)
      return NextResponse.json({ message: 'Shop ID cannot be zero' }, { status: 400 });
    }

  } catch (error) {
    console.error(`[API DELETE /api/shops/${shopId}] Error deleting shop:`, error); // パスを元に戻す
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to delete shop', error: errorMessage }, { status: 500 });
  }
}