// src/components/Header.tsx
import Link from 'next/link';
import Image from 'next/image'; // Image コンポーネントをインポート

export default function Header() {
  return (
    <header className="bg-white text-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-200"> {/* 白背景、テキスト色変更、下線追加 */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center"> {/* パディング調整 */}
        <Link href="/" className="flex items-center"> {/* ロゴを中央揃え */}
          <Image
            src="/images/logo.svg" // public ディレクトリからのパス
            alt="店舗リストアプリ ロゴ"
            width={140} // ロゴのサイズに合わせて調整
            height={35} // ロゴのサイズに合わせて調整
            priority // ロゴ画像を優先読み込み
          />
        </Link>
        <div className="space-x-6"> {/* リンク間のスペース調整 */}
          <Link href="/shops/new" className="text-base text-gray-600 hover:text-gray-900 transition-colors font-medium"> {/* スタイル調整 */}
            新規登録
          </Link>
        </div>
      </nav>
    </header>
  );
}