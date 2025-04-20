import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs/promises'; // fs/promises をインポート
import path from 'path'; // path をインポート
import { supabase } from '@/lib/supabase'; // Supabase クライアントをインポート (パスエイリアスを使用)
import { shopFormSchema, dbShopSchema, Shop as DbShop } from '@/schemas/shop'; // dbShopSchema とその型 DbShop もインポート
import type { Shop as JsonShop } from '@/lib/data'; // shops.json 用の型を JsonShop としてインポート

export const dynamic = 'force-dynamic'; // Always fetch the latest data

// GET: 全店舗情報を取得
// shops.json を読み込む関数 (lib/data.ts の loadShopData とほぼ同じ)
async function loadJsonShopData(): Promise<JsonShop[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'shops.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const shops: JsonShop[] = JSON.parse(jsonData);
    return shops;
  } catch (error) {
    console.error('Error loading or processing shop data from JSON:', error);
    return [];
  }
}


export async function GET() {
  try {
    // 1. Supabase からデータを取得
    const { data: supabaseShops, error: supabaseError } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('Error fetching shops from Supabase:', supabaseError);
      // Supabase からの取得に失敗しても JSON データは返せるように処理を続けることも検討可能
      // return NextResponse.json({ error: 'Failed to fetch shops from Supabase', details: supabaseError.message }, { status: 500 });
    }

    // 2. shops.json からデータを取得
    const jsonShops = await loadJsonShopData();

    // 3. jsonShops を DbShop 型に変換・マッピング (ログ出力強化)
    const jsonShopsConverted: DbShop[] = jsonShops.map((shop, index) => {
      let validUrl: string | null = null;
      const originalUrl = shop.url; // 元のURLを保持

      // shop.url が文字列であり、空文字列でない場合のみ URL としてパースを試みる
      if (typeof originalUrl === 'string' && originalUrl.trim() !== '') {
        // Zod で URL 形式かチェック
        const parsedUrl = z.string().url().safeParse(originalUrl);
        if (parsedUrl.success) {
          validUrl = parsedUrl.data;
        } else {
          // バリデーション失敗時に警告ログ出力
          console.warn(`[API Data Conversion] Invalid URL found in shops.json at original index ${index} (value: "${originalUrl}"). Setting URL to null.`);
          validUrl = null;
        }
      } else {
        // 文字列でない、または空文字列なら null (必要であればログ出力)
        // if (originalUrl !== null && originalUrl !== undefined && originalUrl !== '') {
        //   console.warn(`[API Data Conversion] Non-string or empty URL found in shops.json at original index ${index} (value: ${JSON.stringify(originalUrl)}). Setting URL to null.`);
        // }
        validUrl = null;
      }

      // images 配列の各要素が有効な URL かチェック
      let validImages: string[] | null = null;
      if (Array.isArray(shop.images)) {
        const urlSchema = z.string().url();
        const validatedImages = shop.images
          .filter(img => typeof img === 'string' && img.trim() !== '') // 文字列かつ空でない
          .filter(img => urlSchema.safeParse(img).success); // URL形式かチェック

        if (validatedImages.length > 0) {
          validImages = validatedImages;
        } else {
          // 有効な URL が一つもなければ null に設定
          // console.warn(`[API Data Conversion] No valid URLs found in images for shop at index ${index}. Setting images to null.`);
          validImages = null;
        }
      } else {
        validImages = null; // 配列でなければ null
      }

      return {
        id: -(index + 1), // Supabase の ID と衝突しないように負の値を割り当て
        created_at: '1970-01-01T00:00:00+00:00', // 仮の作成日時
        name: shop.name || '名称不明', // name も空の場合を考慮
        url: validUrl, // 厳密にチェックした URL を使用
        area: typeof shop.area === 'string' ? shop.area : null,
        holiday: typeof shop.holiday === 'string' ? shop.holiday : null,
        genre: typeof shop.genre === 'string' ? shop.genre : null,
        area_category: typeof shop.area_category === 'string' ? shop.area_category : null,
        is_takemachelin: shop.is_takemachelin === true, // boolean は厳密に比較
        memo: typeof shop.memo === 'string' ? shop.memo : null,
        egami_hirano: typeof shop['egami-hirano'] === 'string' ? shop['egami-hirano'] : null, // プロパティ名を合わせる
        visit: typeof shop.visit === 'string' ? shop.visit : null,
        images: validImages, // 厳密にチェックした images を使用
      };
    });

    // 4. Supabase のデータと変換後の JSON データをマージ
    // supabaseShops が null や undefined の場合も考慮
    const allShops = [...(supabaseShops || []), ...jsonShopsConverted];

    // 5. マージしたデータを返す前にバリデーション
    const validationResult = z.array(dbShopSchema).safeParse(allShops);
    let responseData: DbShop[] = []; // デフォルトは空配列

    if (!validationResult.success) {
        console.error('[API Validation Error] Validation failed after merging data. Returning empty array to frontend.', validationResult.error.flatten());
        // バリデーション失敗時は空配列を返すことで、フロントエンドのエラーを防ぐ
        // 原因究明のため、問題のあるデータログは残しても良い
        // if (allShops.length > 3478) {
        //      console.error('[API Validation Error] Data at error index (approx. 3478) BEFORE sending:', JSON.stringify(allShops[3478], null, 2));
        // }
    } else {
        responseData = validationResult.data; // バリデーション成功時はバリデーション済みデータを使用
        // console.log('[API Validation Success] Data validation successful.'); // デバッグログ削除
        // バリデーション成功時のデータを確認ログ削除
        // if (responseData.length > 3478) {
        //     console.log('[API Validation Success] Data at index 3478 AFTER validation:', JSON.stringify(responseData[3478], null, 2));
        // }
    }

    // 6. マージしたデータを返す
    return NextResponse.json(responseData); // バリデーション失敗時は空配列が返る

  } catch (err) {
    console.error('Unexpected error in GET /api/shops:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
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
  } catch (err: any) {
     if (err instanceof SyntaxError) {
       return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
     }
    console.error('Unexpected error inserting shop:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}