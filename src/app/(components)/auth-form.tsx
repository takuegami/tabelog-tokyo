'use client' // クライアントコンポーネントとしてマーク

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // クライアント用 Supabase クライアント
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient() // Supabase クライアントを初期化

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // サインアップ後に確認メールを送信する場合、リダイレクト先を指定
        // emailRedirectTo: `${location.origin}/auth/callback`, // 必要に応じて設定
      },
    })

    if (error) {
      console.error('Sign up error:', error)
      setError(error.message)
    } else {
      // サインアップ成功（メール確認が必要な場合はその旨を表示）
      // ここではシンプルにログインページにメッセージを表示するか、
      // またはメール確認を促すページにリダイレクトするなど
      alert('サインアップ確認メールを送信しました。メールを確認してください。') // 仮のアラート
      // router.push('/check-email'); // 確認ページへリダイレクトする場合
    }
    setIsSubmitting(false)
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      setError(error.message)
    } else {
      // ログイン成功、ホームページなどにリダイレクト
      router.push('/')
      router.refresh() // サーバーコンポーネントのデータを再取得させる
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      {/* ログインフォーム */}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <Label htmlFor="email-signin">メールアドレス</Label>
          <Input
            id="email-signin"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password-signin">パスワード</Label>
          <Input
            id="password-signin"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="mt-1"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '処理中...' : 'ログイン'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">または</span>
        </div>
      </div>

      {/* サインアップフォーム (内容はログインと同じだが、onSubmitが異なる) */}
      <form onSubmit={handleSignUp} className="space-y-4">
         {/* EmailとPasswordの入力はログインフォームと共有しているため、ここではボタンのみ */}
         {/* 必要であれば、サインアップ専用の入力フィールドを追加することも可能 */}
        <Button type="submit" variant="outline" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '処理中...' : '新規登録 (サインアップ)'}
        </Button>
         <p className="mt-2 text-center text-xs text-gray-500">
            新規登録を行うと、確認メールが送信されます。
          </p>
      </form>
    </div>
  )
}