// -----------------------------------------------------------
// Mistella - チャットメッセージクエリフック
// - useMessages: 一覧取得 + リアルタイム受信（setQueryData で直接 append）
// - useMarkMessagesAsRead: 画面フォーカス時の既読処理
// - useSendMessage: optimistic update 付き送信 mutation
// -----------------------------------------------------------

import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getMessages,
  markMessagesAsRead,
  sendImageMessage,
  sendMessage,
  subscribeToMessages,
} from '@/services/messageService';
import { useAuthStore } from '@/store/authStore';
import type { Message } from '@/types';
import { showError } from '@/utils/showError';

/** 送信内容（content か imageUri のどちらか一方を指定する） */
export interface SendMessageInput {
  /** テキスト本文 */
  content?: string;
  /** 端末内の画像 URI（Storage へのアップロードはサービス層で行う） */
  imageUri?: string;
}

// -----------------------------------------------------------
// メッセージ一覧 + リアルタイム受信
// -----------------------------------------------------------

/**
 * 指定マッチのメッセージ一覧。
 * リアルタイム受信分は invalidate せず setQueryData で直接 append する
 * （全件再取得によるチラつきを避けるため）。
 */
export function useMessages(matchId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.messages(matchId),
    enabled: !!user && !!matchId,
    queryFn: () => getMessages(matchId),
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMessages(matchId, (msg) => {
      queryClient.setQueryData<Message[]>(
        queryKeys.messages(matchId),
        (prev) => {
          if (!prev) return [msg];
          // 重複 append 防止（自分の送信分は onSuccess 側で反映済みのことがある）
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        },
      );
      // チャット画面を開いている間に届いた相手のメッセージは即既読にする
      if (msg.sender_id !== user.id) {
        markMessagesAsRead(matchId, user.id).catch(() => {});
      }
    });

    return unsubscribe;
  }, [matchId, user, queryClient]);

  return query;
}

// -----------------------------------------------------------
// 既読処理（画面フォーカス時）
// -----------------------------------------------------------

/** 画面がフォーカスされるたびに自分宛てメッセージを既読にする */
export function useMarkMessagesAsRead(matchId: string) {
  const user = useAuthStore((s) => s.user);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      markMessagesAsRead(matchId, user.id).catch(() => {});
    }, [matchId, user]),
  );
}

// -----------------------------------------------------------
// メッセージ送信（optimistic update）
// -----------------------------------------------------------

/**
 * メッセージ送信 mutation。
 * onMutate で仮メッセージを挿入し、onError でロールバック、
 * onSuccess で仮メッセージを実データに置換する。
 */
export function useSendMessage(matchId: string) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages(matchId);

  return useMutation({
    mutationFn: ({ content, imageUri }: SendMessageInput) => {
      if (imageUri) return sendImageMessage(matchId, user!.id, imageUri);
      return sendMessage(matchId, user!.id, content ?? null);
    },
    onMutate: async ({ content, imageUri }) => {
      await queryClient.cancelQueries({ queryKey });

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMessage: Message = {
        id: tempId,
        match_id: matchId,
        sender_id: user?.id ?? '',
        content: content ?? null,
        image_url: imageUri ?? null,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: profile ?? undefined,
      };

      queryClient.setQueryData<Message[]>(queryKey, (prev) => [
        ...(prev ?? []),
        optimisticMessage,
      ]);

      return { tempId };
    },
    onError: (error, { imageUri }, context) => {
      // ロールバック：仮メッセージを取り除く
      if (context) {
        queryClient.setQueryData<Message[]>(queryKey, (prev) =>
          (prev ?? []).filter((m) => m.id !== context.tempId),
        );
      }
      // onError を定義しているため queryClient 側の一元表示は走らない
      showError(
        error,
        imageUri ? '画像の送信に失敗しました。' : '送信に失敗しました。',
      );
    },
    onSuccess: (sent, _input, context) => {
      queryClient.setQueryData<Message[]>(queryKey, (prev) => {
        // 仮メッセージを実データに置換（realtime で先に届いていれば重複させない）
        const withoutTemp = (prev ?? []).filter((m) => m.id !== context.tempId);
        if (withoutTemp.some((m) => m.id === sent.id)) return withoutTemp;
        return [...withoutTemp, sent];
      });
    },
  });
}
