// -----------------------------------------------------------
// Mistella - 他ユーザープロフィールクエリフック
// UserProfileScreen のサーバー状態（プロフィール・タイムライン・
// いいね/お気に入り状態）と各種アクションをまとめる。
// -----------------------------------------------------------

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getProfile } from '@/services/authService';
import { blockUser, reportUser } from '@/services/blockService';
import { getCastProfileByUserId } from '@/services/castService';
import {
  addFavorite,
  addFootprint,
  isFavorite,
  removeFavorite,
  sendTonightRequest,
} from '@/services/customerService';
import { getLikedUsers, sendLike } from '@/services/matchService';
import { useUserTimelines } from '@/hooks/queries/useTimelines';
import { useAuthStore } from '@/store/authStore';
import type { ReportReason } from '@/types';
import { showError } from '@/utils/showError';

// -----------------------------------------------------------
// 一括取得
// -----------------------------------------------------------

/** プロフィール・タイムライン・キャスト情報・いいね/お気に入り状態をまとめて取得する */
export function useUserProfile(userId: string) {
  const currentUser = useAuthStore((s) => s.user);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(userId),
    enabled: !!currentUser,
    queryFn: () => getProfile(userId),
  });

  const timelinesQuery = useUserTimelines(currentUser ? userId : undefined);

  const castProfileQuery = useQuery({
    queryKey: queryKeys.casts.detail(userId),
    enabled: profileQuery.data?.role === 'cast',
    queryFn: () => getCastProfileByUserId(userId),
  });

  const favoriteQuery = useQuery({
    queryKey: queryKeys.favoriteStatus(currentUser?.id ?? '', userId),
    enabled: !!currentUser,
    queryFn: () => isFavorite(currentUser!.id, userId),
  });

  const likedQuery = useQuery({
    queryKey: queryKeys.likedUsers(currentUser?.id ?? ''),
    enabled: !!currentUser,
    queryFn: () => getLikedUsers(currentUser!.id),
  });

  const isPending =
    profileQuery.isPending ||
    timelinesQuery.isPending ||
    (profileQuery.data?.role === 'cast' && castProfileQuery.isPending) ||
    favoriteQuery.isPending ||
    likedQuery.isPending;

  const isError = profileQuery.isError || timelinesQuery.isError;

  const refetch = () => {
    profileQuery.refetch();
    timelinesQuery.refetch();
    if (castProfileQuery.isError) castProfileQuery.refetch();
    if (favoriteQuery.isError) favoriteQuery.refetch();
    if (likedQuery.isError) likedQuery.refetch();
  };

  return {
    targetUser: profileQuery.data ?? null,
    castProfile: castProfileQuery.data ?? null,
    timelines: timelinesQuery.data ?? [],
    liked: (likedQuery.data ?? []).includes(userId),
    favorited: favoriteQuery.data ?? false,
    isPending,
    isError,
    error: profileQuery.error ?? timelinesQuery.error,
    refetch,
  };
}

// -----------------------------------------------------------
// いいね送信
// -----------------------------------------------------------

/** いいね送信。成功時にいいね済み一覧を即時更新し、マッチ成立時はマッチ一覧を invalidate する。 */
export function useSendLike(targetUserId: string) {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!currentUser) throw new Error('ログインが必要です。');
      return sendLike(currentUser.id, targetUserId);
    },
    onSuccess: ({ matched }) => {
      if (!currentUser) return;
      queryClient.setQueryData<string[]>(
        queryKeys.likedUsers(currentUser.id),
        (old) =>
          old && !old.includes(targetUserId) ? [...old, targetUserId] : old,
      );
      if (matched) {
        queryClient.invalidateQueries({ queryKey: queryKeys.matches(currentUser.id) });
      }
    },
    onError: (error) => {
      showError(error, 'いいねに失敗しました。');
    },
  });
}

// -----------------------------------------------------------
// お気に入り追加/削除
// -----------------------------------------------------------

/** お気に入りの追加・削除。成功時に状態キャッシュを即時更新し、一覧を invalidate する。 */
export function useToggleFavorite(targetUserId: string) {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (next: boolean) => {
      if (!currentUser) throw new Error('ログインが必要です。');
      if (next) {
        await addFavorite(currentUser.id, targetUserId);
      } else {
        await removeFavorite(currentUser.id, targetUserId);
      }
    },
    onSuccess: (_data, next) => {
      if (!currentUser) return;
      queryClient.setQueryData(
        queryKeys.favoriteStatus(currentUser.id, targetUserId),
        next,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites(currentUser.id) });
    },
    onError: (error) => {
      showError(error, '操作に失敗しました。');
    },
  });
}

// -----------------------------------------------------------
// 足跡記録
// -----------------------------------------------------------

/** プロフィール閲覧時に足跡を一度だけ記録する（自分自身は除く）。 */
export function useRecordFootprint(targetUserId: string) {
  const currentUser = useAuthStore((s) => s.user);
  const recordedRef = useRef(false);

  const { mutate } = useMutation({
    mutationFn: () => addFootprint(currentUser!.id, targetUserId),
    onError: () => {
      // 足跡はバックグラウンド記録のため失敗してもユーザーには通知しない
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.id === targetUserId || recordedRef.current) {
      return;
    }
    recordedRef.current = true;
    mutate();
  }, [currentUser, targetUserId, mutate]);
}

// -----------------------------------------------------------
// ブロック
// -----------------------------------------------------------

/** 対象ユーザーをブロックする。 */
export function useBlockUser() {
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (targetUserId: string) => {
      if (!currentUser) throw new Error('ログインが必要です。');
      return blockUser(currentUser.id, targetUserId);
    },
    onError: () => {
      showError(undefined, 'ブロックに失敗しました。');
    },
  });
}

// -----------------------------------------------------------
// 通報
// -----------------------------------------------------------

/** 対象ユーザーを通報する。 */
export function useReportUser() {
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (params: {
      targetUserId: string;
      reason: ReportReason;
      detail?: string;
    }) => {
      if (!currentUser) throw new Error('ログインが必要です。');
      return reportUser({
        reporterId: currentUser.id,
        reportedUserId: params.targetUserId,
        reason: params.reason,
        detail: params.detail,
      });
    },
    onError: () => {
      showError(undefined, '通報に失敗しました。');
    },
  });
}

// -----------------------------------------------------------
// 今夜行ける？リクエスト送信
// -----------------------------------------------------------

/** キャストへ今夜行ける？リクエストを送信する。 */
export function useSendTonightRequest() {
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (params: { castId: string; message?: string }) => {
      if (!currentUser) throw new Error('ログインが必要です。');
      return sendTonightRequest(currentUser.id, params.castId, params.message);
    },
    onError: (error) => {
      showError(error, '送信に失敗しました。');
    },
  });
}
