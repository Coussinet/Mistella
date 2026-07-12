// -----------------------------------------------------------
// Mistella - タイムラインクエリフック
// -----------------------------------------------------------

import { useEffect } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import {
  createTimeline,
  deleteTimeline,
  getTimelineById,
  getTimelines,
  uploadTimelineMedia,
} from '@/services/timelineService';
import { useAuthStore } from '@/store/authStore';
import type { Timeline } from '@/types';
import { showError } from '@/utils/showError';

export const TIMELINE_PAGE_SIZE = 20;

type TimelinesData = InfiniteData<Timeline[], number>;

/** タイムライン一覧（無限スクロール、ページサイズ20） */
export function useTimelines() {
  return useInfiniteQuery({
    queryKey: queryKeys.timelines.list(),
    queryFn: ({ pageParam }) => getTimelines(pageParam, TIMELINE_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === TIMELINE_PAGE_SIZE ? allPages.length : undefined,
  });
}

/**
 * timelines テーブルの INSERT を Realtime 購読し、
 * 新規投稿を先頭ページに prepend する（重複はスキップ）。
 * invalidate ではなく setQueryData を使うことでスクロール位置を保つ。
 */
export function useTimelinesRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('timelines-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'timelines' },
        (payload) => {
          void (async () => {
            try {
              const item = await getTimelineById((payload.new as Timeline).id);
              if (!item) return;
              queryClient.setQueryData<TimelinesData>(
                queryKeys.timelines.list(),
                (old) => {
                  if (!old || old.pages.length === 0) return old;
                  const exists = old.pages.some((page) =>
                    page.some((t) => t.id === item.id),
                  );
                  if (exists) return old;
                  return {
                    ...old,
                    pages: old.pages.map((page, i) =>
                      i === 0 ? [item, ...page] : page,
                    ),
                  };
                },
              );
            } catch {
              // 取得に失敗した場合は次回リフェッチに任せる
            }
          })();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// -----------------------------------------------------------
// 投稿作成
// -----------------------------------------------------------

export interface CreateTimelineInput {
  content: string | null;
  mediaUri?: string | null;
  mediaType?: 'image' | 'video' | null;
}

/** メディアアップロード + 投稿作成。成功時はタイムラインを invalidate する。 */
export function useCreateTimeline() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      mediaUri,
      mediaType,
    }: CreateTimelineInput): Promise<Timeline> => {
      if (!user) throw new Error('ログインが必要です。');

      let mediaUrl: string | null = null;
      let finalMediaType: 'image' | 'video' | null = null;
      if (mediaUri && mediaType) {
        mediaUrl = await uploadTimelineMedia(user.id, mediaUri, mediaType);
        finalMediaType = mediaType;
      }
      return createTimeline(user.id, content, mediaUrl, finalMediaType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timelines.all });
    },
  });
}

// -----------------------------------------------------------
// 投稿削除
// -----------------------------------------------------------

/** 投稿削除。成功時はタイムラインを invalidate する。 */
export function useDeleteTimeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTimeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timelines.all });
    },
    onError: (error) => {
      showError(error, '投稿の削除に失敗しました。');
    },
  });
}
