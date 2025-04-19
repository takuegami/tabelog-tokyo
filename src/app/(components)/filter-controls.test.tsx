import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterControls } from './filter-controls';

// next/navigation のモック
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

// lib/data のモック (getGenresは削除されたので不要)
// vi.mock('@/lib/data', async (importOriginal) => {
//   const original = await importOriginal<typeof import('@/lib/data')>();
//   return {
//     ...original,
//     // getGenres: vi.fn().mockResolvedValue(['ラーメン', 'イタリアン', 'カフェ']), // ダミーデータを返す
//   };
// });

const dummyGenres = ['ラーメン', 'イタリアン', 'カフェ']; // テスト用のダミージャンル

describe('FilterControls', () => {
  it('renders without crashing', async () => {
    render(<FilterControls genres={dummyGenres} />); // genres propsを渡す
    // 地域選択が存在することを確認 (aria-labelを使用)
    expect(await screen.findByLabelText('地域で絞り込む')).toBeInTheDocument();
    // ジャンル選択が存在することを確認
    expect(await screen.findByLabelText('ジャンルで絞り込む')).toBeInTheDocument();
    // 検索入力が存在することを確認
    expect(screen.getByPlaceholderText('店舗名、最寄り駅名...')).toBeInTheDocument();
  });

  it('should have default area value selected', async () => {
    render(<FilterControls genres={dummyGenres} />); // genres propsを渡す
    // デフォルトで "すべての地域" が選択されていることを確認
    // Selectコンポーネントのテストは少し複雑になる場合があるため、トリガー要素のテキストで確認
    expect(
      await screen.findByRole('combobox', { name: '地域で絞り込む' })
    ).toHaveTextContent('すべての地域');
  });

  // TODO: Add more tests for genre, checkbox, search, reset button interactions
});