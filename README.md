# Table Rec (Next.js Version)

これは、飲食店検索アプリケーション Table Rec の Next.js + TypeScript + Tailwind CSS + shadcn/ui によるリニューアル版です。

## 概要

JSON データを読み込み、飲食店をフィルタリング・検索して表示する SPA (Single Page Application) です。
モダンな UI/UX と高いパフォーマンス、アクセシビリティを目指しています。

## 主な機能

- 地域、ジャンル、キーワードによる店舗フィルタリング
- タケマシュラン表示切り替え
- 店舗カード表示
- 無限スクロールによる段階的読み込み
- ダークモード対応
- PWA によるオフライン対応 (基本的なキャッシュ)

## 技術スタック

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **State Management:** React Context / URL State (TanStack Query 導入検討中)
- **Data Fetching:** Server Components (fs/promises)
- **Animation:** framer-motion
- **Testing:** Vitest, React Testing Library, axe-core
- **Linting/Formatting:** ESLint, Prettier
- **PWA:** next-pwa

## ローカルでの起動手順

1.  **依存関係のインストール:**
    ```bash
    npm install
    ```

2.  **開発サーバーの起動:**
    ```bash
    npm run dev
    ```
    開発サーバーは [http://localhost:3000](http://localhost:3000) で起動します。

3.  **本番ビルド:**
    ```bash
    npm run build
    ```

4.  **本番サーバーの起動:**
    ```bash
    npm run start
    ```

## 環境変数

現在、必須の環境変数はありません。将来的に API キーなどを利用する場合は、`.env.local` ファイルを作成して以下のように設定します。

```
# 例: Cloudinary API Key (将来的に使用する場合)
# CLOUDINARY_API_KEY=your_api_key
```

## Learn More (Next.js Default)

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel (Next.js Default)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
