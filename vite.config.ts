/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // pathモジュールをインポート

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // describe, itなどをグローバルに利用可能にする
    environment: 'jsdom', // テスト環境としてjsdomを使用
    setupFiles: './vitest.setup.ts', // セットアップファイルへのパス
    // include: ['src/**/*.test.{ts,tsx}'], // テストファイルのパターン (デフォルトでsrc以下を探すことが多い)
    css: false, // CSSの処理を無効化 (テスト速度向上のため)
  },
  resolve: {
    alias: {
      // tsconfig.jsonのpathsと合わせる
      '@': path.resolve(__dirname, './src'),
    },
  },
});