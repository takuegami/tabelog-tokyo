import AuthForm from '@/app/(components)/auth-form' // 後で作成する認証フォームコンポーネント

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにログインまたは登録
          </h2>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}