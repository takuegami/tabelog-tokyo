// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 環境変数から URL と Anon Key を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が設定されているかチェック
if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// 正しい変数を使用して Supabase クライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
