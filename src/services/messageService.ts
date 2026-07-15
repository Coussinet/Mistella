// ============================================================
// Mistella - Message Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Message } from '@/types';
import { sendPushNotification } from '@/services/notificationService';
import { uploadImage } from '@/utils/imageUtils';

const DEFAULT_PAGE_SIZE = 30;

// -----------------------------------------------------------
// メッセージ一覧取得
// -----------------------------------------------------------

/**
 * 指定マッチのメッセージ一覧を取得する。
 * ページネーション付き・送信者情報 JOIN 済み。
 */
export async function getMessages(
  matchId: string,
  page: number = 0,
): Promise<Message[]> {
  const from = page * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(*)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  // 取得後に昇順に並び替えて UI に渡す
  return ((data ?? []) as Message[]).reverse();
}

// -----------------------------------------------------------
// メッセージ送信
// -----------------------------------------------------------

/** メッセージを送信する。 */
export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string | null,
  imageUrl?: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
      image_url: imageUrl ?? null,
      is_read: false,
    })
    .select('*, sender:users!messages_sender_id_fkey(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('メッセージの送信に失敗しました。');

  // 相手に通知を送信（失敗してもメッセージ送信は成功扱い）
  Promise.resolve(
    supabase
      .from('matches')
      .select('customer_id, cast_id')
      .eq('id', matchId)
      .maybeSingle(),
  )
    .then(({ data: match }) => {
      if (match) {
        const recipientId = match.customer_id === senderId ? match.cast_id : match.customer_id;
        sendPushNotification({
          recipientUserId: recipientId,
          title: '新しいメッセージ',
          body: content ?? '画像が届きました',
          notificationKey: 'notification_messages',
          data: { matchId },
        });
      }
    })
    .catch(() => {});

  return data as Message;
}

// -----------------------------------------------------------
// 画像メッセージ送信
// -----------------------------------------------------------

/**
 * 端末内の画像を Storage（chat-images バケット）にアップロードし、
 * その URL を持つメッセージを送信する。
 */
export async function sendImageMessage(
  matchId: string,
  senderId: string,
  localUri: string,
): Promise<Message> {
  // 先頭フォルダを送信者IDにして Storage の「自分フォルダのみ書込可」RLS と整合させる
  const imageUrl = await uploadImage(
    localUri,
    'chat-images',
    `${senderId}/${matchId}/${Date.now()}.jpg`,
  );
  return sendMessage(matchId, senderId, null, imageUrl);
}

// -----------------------------------------------------------
// 既読処理
// -----------------------------------------------------------

/**
 * 指定マッチの自分宛てメッセージをすべて既読にする。
 * sender_id が自分以外（= 相手が送ったメッセージ）を対象にする。
 */
export async function markMessagesAsRead(
  matchId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('match_id', matchId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

// -----------------------------------------------------------
// リアルタイム購読
// -----------------------------------------------------------

/**
 * 指定マッチのメッセージをリアルタイム購読する。
 * 戻り値はチャネルを閉じる unsubscribe 関数。
 */
export function subscribeToMessages(
  matchId: string,
  onMessage: (msg: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:match_id=eq.${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      async (payload) => {
        // 新着メッセージのユーザー情報を取得して onMessage に渡す
        const newMessage = payload.new as Message;
        const { data } = await supabase
          .from('messages')
          .select('*, sender:users!messages_sender_id_fkey(*)')
          .eq('id', newMessage.id)
          .single();

        if (data) {
          onMessage(data as Message);
        } else {
          onMessage(newMessage);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
