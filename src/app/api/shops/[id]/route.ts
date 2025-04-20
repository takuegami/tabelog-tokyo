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
        console.error(`[API DELETE /api/shops/${shopId}] Error deleting shop from Supabase:`, error);
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

    } else if (numericShopId < 0) {
      // --- shops.json のデータを削除 ---
      const jsonIndex = -numericShopId - 1; // 負の ID から元のインデックスを計算

      const shops = await readShops(); // JSON ファイルを読み込む

      if (jsonIndex < 0 || jsonIndex >= shops.length) {
        // 計算されたインデックスが無効な場合
        console.error(`[API DELETE /api/shops/${shopId}] Invalid index calculated for JSON deletion: ${jsonIndex}`);
        return NextResponse.json({ message: 'Shop not found in JSON data (invalid index)' }, { status: 404 });
      }

      // 配列から店舗を削除
      shops.splice(jsonIndex, 1);

      // 更新された店舗リストをファイルに書き込む
      await writeShops(shops);

      console.log(`[API DELETE /api/shops/${shopId}] Shop deleted successfully from JSON data at index ${jsonIndex}.`);
      return NextResponse.json({ message: 'Shop deleted successfully' }, { status: 200 });

    } else {
      // ID が 0 の場合 (通常はありえない)
      return NextResponse.json({ message: 'Shop ID cannot be zero' }, { status: 400 });
    }

  } catch (error) {
    console.error(`[API DELETE /api/shops/${shopId}] Error deleting shop:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to delete shop', error: errorMessage }, { status: 500 });
  }
}