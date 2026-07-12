// -----------------------------------------------------------
// Mistella - 今夜行ける？リクエストクエリフック（キャスト用）
// -----------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import {
  getBroadcastTonightRequests,
  getTonightRequests,
  reactToBroadcast,
  updateTonightRequestStatus,
} from '@/services/castService';
import { useAuthStore } from '@/store/authStore';
import type { BroadcastReactionType } from '@/types';
import { showError } from '@/utils/showError';

// -----------------------------------------------------------
// 個別リクエスト一覧
// -----------------------------------------------------------

/** キャスト宛ての個別リクエスト一覧（tonight_requests の変更をリアルタイム反映） */
export function useTonightRequests() {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: queryKeys.tonightRequests.received(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getTonightRequests(user!.id),
  });

  useRealtimeInvalidation({
    channelName: `tonight_requests_cast:${user?.id ?? 'anonymous'}`,
    table: 'tonight_requests',
    filter: `target_cast_id=eq.${user?.id}`,
    invalidateKeys: [queryKeys.tonightRequests.received(user?.id ?? '')],
    enabled: !!user,
  });

  return query;
}

// -----------------------------------------------------------
// 全体投稿一覧
// -----------------------------------------------------------

/** 全キャスト向け投稿一覧（新規投稿の INSERT をリアルタイム反映） */
export function useBroadcastTonightRequests() {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: queryKeys.tonightRequests.broadcast(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getBroadcastTonightRequests(user!.id),
  });

  useRealtimeInvalidation({
    channelName: 'tonight_broadcasts',
    table: 'tonight_requests',
    event: 'INSERT',
    filter: 'target_cast_id=is.null',
    invalidateKeys: [queryKeys.tonightRequests.broadcast(user?.id ?? '')],
    enabled: !!user,
  });

  return query;
}

// -----------------------------------------------------------
// 個別リクエスト: 承諾 / 辞退
// -----------------------------------------------------------

export interface UpdateTonightRequestStatusInput {
  requestId: string;
  status: 'accepted' | 'declined';
}

/** 個別リクエストの承諾・辞退。成功時は一覧を invalidate する。 */
export function useUpdateTonightRequestStatus() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, status }: UpdateTonightRequestStatusInput) =>
      updateTonightRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tonightRequests.received(user?.id ?? ''),
      });
    },
    onError: (error, { status }) => {
      showError(
        error,
        status === 'accepted' ? '承諾処理に失敗しました。' : '辞退処理に失敗しました。',
      );
    },
  });
}

// -----------------------------------------------------------
// 全体投稿: 興味あり / メッセージ反応
// -----------------------------------------------------------

export interface ReactToBroadcastInput {
  requestId: string;
  type: BroadcastReactionType;
  message?: string;
}

/** 全体投稿への反応。成功時は一覧を invalidate する。 */
export function useReactToBroadcast() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, type, message }: ReactToBroadcastInput) =>
      reactToBroadcast(requestId, user!.id, type, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tonightRequests.broadcast(user?.id ?? ''),
      });
    },
    onError: (error) => {
      showError(error, '送信に失敗しました。');
    },
  });
}
