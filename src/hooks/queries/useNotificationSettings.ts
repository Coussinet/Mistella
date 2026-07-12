// -----------------------------------------------------------
// Mistella - 通知設定クエリフック
// トグルは optimistic update（即時反映 → 失敗時ロールバック）で行う。
// -----------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import type { NotificationSettingsKeys } from '@/types';
import { showError } from '@/utils/showError';

/** 通知設定（push_tokens 行が無ければ null） */
export function useNotificationSettings() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.notificationSettings(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getNotificationSettings(user!.id),
  });
}

/** 通知設定の更新（optimistic update、失敗時はロールバック） */
export function useUpdateNotificationSettings() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notificationSettings(user?.id ?? '');

  return useMutation({
    mutationFn: (patch: Partial<NotificationSettingsKeys>) => {
      if (!user) throw new Error('ログインが必要です。');
      return updateNotificationSettings(user.id, patch);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<NotificationSettingsKeys | null>(queryKey);
      // 即時反映
      queryClient.setQueryData<NotificationSettingsKeys | null>(queryKey, (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { previous };
    },
    onError: (error, _patch, context) => {
      // ロールバック
      if (context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showError(error, '設定の更新に失敗しました。');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
