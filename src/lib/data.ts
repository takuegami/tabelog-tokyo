import fs from 'fs/promises';
import path from 'path';

/**
 * 店舗データの型定義
 */
export interface Shop {
  url: string | null;
  name: string;
  area: string;        // 最寄り駅など
  holiday: string;
  genre: string;
  area_category: string; // 地域カテゴリ (フィルター用)
  is_takemachelin: boolean;
  memo: string;
  'egami-hirano': string; // egamiかhiranoか両方か
  visit: string;       // zumiかmotomuか
  image?: string;      // オプショナルな画像フィールド
}

/**
 * JSONデータを読み込み、型付けして返却する関数
 */
export async function loadShopData(): Promise<Shop[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'shops.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const shops: Shop[] = JSON.parse(jsonData);
    return shops;
  } catch (error) {
    console.error('Error loading or processing shop data:', error);
    return [];
  }
}
