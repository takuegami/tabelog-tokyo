import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 環境変数から Supabase の URL と Anon Key を取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // ブラウザ環境用の Supabase クライアントを作成
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}