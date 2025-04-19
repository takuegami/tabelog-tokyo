import fs from 'fs/promises';
import path from 'path';

// 店舗データの型定義 (仮。後でZodスキーマに移行する可能性あり)
export interface Shop {
  url: string | null;
  name: string;
  area: string; // 最寄り駅など
  holiday: string;
  genre: string;
  area_category: string; // 地域カテゴリ (フィルター用)
  is_takemachelin: boolean;
  memo: string;
  'egami-hirano': string; // egamiかhiranoか両方か
  visit: string; // zumiかmotomuか
  image?: string; // オプショナルな画像フィールド
}

// 画像プレースホルダーURL生成関数
  // via.placeholder.com を使用 (幅x高さ/背景色/文字色?text=表示文字)
  // 16:9のアスペクト比 (例: 480x270)
  const width = 480;
  const height = 270;
  const bgColor = 'e0e0e0'; // Light gray background
  const textColor = 'a0a0a0'; // Gray text
  const text = encodeURIComponent(seed.substring(0, 15)); // Use first 15 chars of seed as text
  // return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${text}`;
  // placehold.co を使用 (例: https://placehold.co/480x270/e0e0e0/a0a0a0/png?text=Example)
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}/png?text=${text}`;
}

// JSONデータを読み込み、型付けし、画像URLを処理する関数
export async function loadShopData(): Promise<Shop[]> {
  try {
    // process.cwd() はプロジェクトルートを指す
    const filePath = path.join(process.cwd(), 'src', 'data', 'shops.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const shops: Shop[] = JSON.parse(jsonData);

    // imageフィールドが存在しない場合はそのままにする (プレースホルダーを割り当てない)
    return shops.map((shop) => ({
      ...shop,
      // image: shop.image, // imageフィールドはそのまま維持 (なければundefined)
    }));
  } catch (error) {
    console.error('Error loading or processing shop data:', error);
    // エラー発生時は空配列を返すか、エラーを再スローするか検討
    return [];
  }
}

// 地域カテゴリリストは FilterControls コンポーネントに移動

// getGenres 関数はサーバーコンポーネント (page.tsx) に移動
