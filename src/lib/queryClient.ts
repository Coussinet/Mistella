// -----------------------------------------------------------
// Mistella - React Query クライアント設定
// - AppState と focusManager を連携（アプリ復帰時に再フェッチ）
// - mutation のデフォルトエラー表示を一元化
// -----------------------------------------------------------

import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { MutationCache, QueryClient, focusManager } from '@tanstack/react-query';
import { showError } from '@/utils/showError';

// アプリがフォアグラウンドに戻ったら stale なクエリを再フェッチする
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

AppState.addEventListener('change', onAppStateChange);

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // 画面側で onError を持つ mutation は画面側の表示に任せる
      if (mutation.options.onError) return;
      showError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
