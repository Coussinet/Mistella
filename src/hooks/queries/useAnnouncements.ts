// ============================================================
// Mistella - アプリ内お知らせクエリ
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAnnouncements, markAnnouncementsRead } from '@/services/announcementService';
import { useAuthStore } from '@/store/authStore';
import type { AnnouncementItem } from '@/services/announcementService';

export function useAnnouncements() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.announcements(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getAnnouncements(user!.id),
  });
}

/** 表示済みのお知らせを既読にし、バッジは即時に消す。 */
export function useMarkAnnouncementsRead() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const queryKey = queryKeys.announcements(user?.id ?? '');

  return useMutation({
    mutationFn: (announcementIds: string[]) => {
      if (!user) throw new Error('ログインが必要です。');
      return markAnnouncementsRead(user.id, announcementIds);
    },
    onMutate: async (announcementIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AnnouncementItem[]>(queryKey);

      queryClient.setQueryData<AnnouncementItem[]>(queryKey, (current) =>
        current?.map((announcement) =>
          announcementIds.includes(announcement.id)
            ? { ...announcement, isRead: true }
            : announcement,
        ),
      );

      return { previous };
    },
    onError: (_error, _announcementIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
