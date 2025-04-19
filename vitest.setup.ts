import '@testing-library/jest-dom';
import { expect } from 'vitest'; // vitestからexpectをインポート
import * as matchers from '@testing-library/jest-dom/matchers'; // jest-domのマッチャーをインポート
import { toHaveNoViolations } from 'jest-axe'; // jest-axeのマッチャーをインポート

// jest-domのマッチャーをvitestのexpectに追加
expect.extend(matchers);
// jest-axeのマッチャーをvitestのexpectに追加
expect.extend(toHaveNoViolations);