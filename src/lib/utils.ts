import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * テキストを正規化（小文字化、中黒削除、カタカナ→ひらがな）
 * @param {string | null | undefined} text - 正規化するテキスト
 * @returns {string} 正規化されたテキスト
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  try {
    return text
      .toLowerCase()
      .replace(/・/g, '') // 中黒を削除
      .replace(
        /[\u30a1-\u30f6]/g,
        (
          match // カタカナをひらがなに変換
        ) => String.fromCharCode(match.charCodeAt(0) - 0x60)
      )
      .normalize('NFKC'); // 全角英数字などを半角に、半角カナを全角に統一
  } catch (error) {
    console.error('テキスト正規化中にエラー:', error, text);
    return text || ''; // エラー時は元のテキストを返す
  }
}
