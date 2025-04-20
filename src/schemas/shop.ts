import { z } from 'zod';

// フォーム用のスキーマを修正
export const shopFormSchema = z.object({
  name: z.string().min(1, { message: '店舗名は必須です' }),
  genre: z.string().optional(), // プルダウンになるが、型は string のまま
  area: z.string().optional(), // ラベルは「最寄駅」になるが、型は string のまま
  url: z.string().url({ message: '有効なURL形式で入力してください' }).optional().or(z.literal('')),
  holiday: z.string().optional(),
  area_category: z.string().optional(), // プルダウンになるが、型は string のまま
  memo: z.string().optional(),
  egami_hirano: z.enum(["egami", "hirano", "egami-hirano"], { errorMap: () => ({ message: '選択してください' }) }).optional(),
  visit: z.enum(["zumi", "motomu"], { errorMap: () => ({ message: '選択してください' }) }).optional(), // visit を追加し、enum で "zumi", "motomu" に限定
  images: z.array(z.string().url({ message: '有効な画像URL形式である必要があります' })).optional(), // 複数画像URL用のフィールドを追加
});

export type ShopForm = z.infer<typeof shopFormSchema>;

// --- データベーススキーマ (変更なし) ---
// DB側の egami_hirano の型も enum に合わせるか、
// API送信時に string に変換するなどの考慮が必要になる場合があります。
// ここでは一旦 DB スキーマは変更しません。
export const dbShopSchema = z.object({
  id: z.number().int(),
  created_at: z.string(),
  url: z.string().url().nullable().optional(),
  name: z.string(),
  area: z.string().nullable().optional(),
  holiday: z.string().nullable().optional(),
  genre: z.string().nullable().optional(),
  area_category: z.string().nullable().optional(),
  is_takemachelin: z.boolean().nullable().optional(),
  memo: z.string().nullable().optional(),
  egami_hirano: z.string().nullable().optional(), // DB側は string のまま
  visit: z.string().nullable().optional(),
  images: z.array(z.string().url()).nullable().optional(),
});

export type Shop = z.infer<typeof dbShopSchema>;

export const shopsResponseSchema = z.array(dbShopSchema);
