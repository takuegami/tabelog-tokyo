import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // fs/promises を使用

// Shop 型の定義 (必要最低限)
interface Shop {
  genre?: string;
  area_category?: string;
}

// shops.json のパスを取得
// process.cwd() はプロジェクトのルートディレクトリを指す
const dataFilePath = path.join(process.cwd(), 'src', 'data', 'shops.json');

export async function GET() {
  try {
    // JSON ファイルを非同期で読み込み
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const shops: Shop[] = JSON.parse(fileContent);

    // ジャンルとエリアカテゴリのユニークなリストを作成
    const genres = new Set<string>();
    const areaCategories = new Set<string>();

    shops.forEach(shop => {
      if (shop.genre) {
        genres.add(shop.genre);
      }
      if (shop.area_category) {
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
    console.error('Failed to read or parse shops.json:', error);
    return NextResponse.json({ message: 'Failed to fetch options' }, { status: 500 });
  }
}