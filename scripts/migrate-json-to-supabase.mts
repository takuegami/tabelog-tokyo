import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv'; // dotenv をインポート
import { fileURLToPath } from 'url'; // path 関連のヘルパー

// --- .env.local を明示的に読み込む ---
// スクリプトの場所に基づいて .env.local のパスを解決
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local'); // ルートディレクトリの .env.local を想定
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env.local file:', result.error);
  // .env.local がなくても処理を続行するか、ここで終了するか選択
  // process.exit(1);
}
console.log(`Attempting to load environment variables from: ${envPath}`);


// --- 環境変数チェック ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key is missing in environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.');
  process.exit(1); // エラーで終了
}

// --- Supabase クライアント初期化 ---
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- JSONデータの型定義 (src/lib/data.ts の JsonShop と同様) ---
const jsonShopSchema = z.object({
  url: z.string().url().nullable(),
  name: z.string(),
  area: z.string().nullable(),
  holiday: z.string().nullable(),
  genre: z.string().nullable(),
  area_category: z.string().nullable(),
  is_takemachelin: z.boolean().optional().default(false), // オプショナルでデフォルトfalse
  memo: z.string().nullable(),
  'egami-hirano': z.string().nullable(), // JSONのキー名
  visit: z.string().nullable(),
  images: z.array(z.string()).nullable(), // ここでは一旦 string の配列として許容 (後でフィルタリング)
});
type JsonShop = z.infer<typeof jsonShopSchema>;

// --- Supabaseテーブルの型定義 (src/schemas/shop.ts の DbShop と類似) ---
// 注意: Supabase の実際のテーブルスキーマに合わせて調整が必要な場合があります
const dbShopSchema = z.object({
  // id: z.number().int().positive(), // DB側で自動生成される想定
  // created_at: z.string().datetime(), // DB側で自動生成される想定
  name: z.string(),
  url: z.string().url().nullable(),
  area: z.string().nullable(),
  holiday: z.string().nullable(),
  genre: z.string().nullable(),
  area_category: z.string().nullable(),
  is_takemachelin: z.boolean().default(false),
  memo: z.string().nullable(),
  egami_hirano: z.string().nullable(), // DBの列名
  visit: z.string().nullable(),
  // images をオプショナルに変更し、null も許容
  images: z.array(z.string().url()).nullable().optional(),
});
type DbShopInsert = z.infer<typeof dbShopSchema>; // 挿入用の型

// --- メイン処理 ---
async function migrateData() {
  console.log('Starting data migration from shops.json to Supabase...');

  // 1. JSON ファイルの読み込みとパース
  let jsonShops: JsonShop[] = [];
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'shops.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    jsonShops = JSON.parse(jsonData);
    console.log(`Successfully loaded ${jsonShops.length} shops from shops.json.`);
  } catch (error) {
    console.error('Error reading or parsing shops.json:', error);
    return; // エラーがあれば終了
  }

  // 2. JSON データを Supabase 用の形式に変換・バリデーション
  const shopsToInsert: DbShopInsert[] = [];
  for (const [index, shop] of jsonShops.entries()) {

    // images 配列内の相対パスを除外し、有効なURLのみをフィルタリング
    let validImages: string[] | null = null;
    if (Array.isArray(shop.images)) {
      const urlSchema = z.string().url();
      const validatedImages = shop.images
        .filter(img => typeof img === 'string' && img.trim() !== '' && !img.startsWith('/')) // 文字列、空でなく、相対パスでない
        .filter(img => urlSchema.safeParse(img).success); // URL形式かチェック

      if (validatedImages.length > 0) {
         validImages = validatedImages;
      } else {
         // 有効なURLがなければ null (相対パスのみの場合もここ)
         if (shop.images.some(img => typeof img === 'string' && img.startsWith('/'))) {
             console.warn(`[Data Conversion] Shop "${shop.name}" (index ${index}) contains only relative image paths. Setting images to null.`);
         }
         validImages = null;
      }
    } else {
      validImages = null; // 配列でなければ null
    }

    // JSON の 'egami-hirano' を DB の 'egami_hirano' にマッピングし、データを準備
    const dbData: Partial<DbShopInsert> = {
      name: shop.name,
      url: shop.url,
      area: shop.area,
      holiday: shop.holiday,
      genre: shop.genre,
      area_category: shop.area_category,
      is_takemachelin: shop.is_takemachelin,
      memo: shop.memo,
      egami_hirano: shop['egami-hirano'], // マッピング
      visit: shop.visit,
      images: validImages, // フィルタリング済みの画像配列
    };

    // Zod でバリデーション (挿入前に型を確認)
    const validationResult = dbShopSchema.safeParse(dbData);
    if (validationResult.success) {
      shopsToInsert.push(validationResult.data);
    } else {
      console.warn(`Skipping shop "${shop.name}" (index ${index}) due to validation errors:`, validationResult.error.flatten());
      // console.warn('Original JSON data:', JSON.stringify(shop, null, 2)); // 必要なら詳細ログ
    }
  }
  console.log(`Prepared ${shopsToInsert.length} shops for insertion after validation.`);

  if (shopsToInsert.length === 0) {
    console.log('No valid shops to insert. Exiting.');
    return;
  }

  // 3. Supabase にデータを挿入 (insert を使用)
  console.log(`Attempting to insert ${shopsToInsert.length} shops into Supabase...`);
  // 一度に挿入する件数が多いとエラーになる可能性があるため、チャンクに分割することも検討
  const chunkSize = 500; // チャンクサイズを設定
  let insertedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < shopsToInsert.length; i += chunkSize) {
    const chunk = shopsToInsert.slice(i, i + chunkSize);
    console.log(`Inserting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(shopsToInsert.length / chunkSize)} (${chunk.length} records)...`);
    const { data, error } = await supabase.from('shops').insert(chunk).select();
    if (error) {
      console.error(`Error inserting chunk ${Math.floor(i / chunkSize) + 1}:`, error);
      failedCount += chunk.length; // エラーがあったチャンクは全件失敗とみなす（個別追跡は複雑になるため）
      // エラーが発生しても次のチャンクに進むか、ここで停止するか選択 (ここでは続行)
    } else {
      insertedCount += data?.length ?? 0;
      console.log(`Chunk ${Math.floor(i / chunkSize) + 1} inserted successfully. ${data?.length ?? 0} records.`);
    }
  }

  console.log('Supabase insert process completed.');
  console.log(`Total inserted records: ${insertedCount}`);
  if (failedCount > 0) {
      console.warn(`Total failed records (estimated): ${failedCount}`);
  }


  console.log('Data migration finished.');
}

// スクリプト実行
migrateData();