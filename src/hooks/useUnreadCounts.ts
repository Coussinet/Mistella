// -----------------------------------------------------------
// Mistella - 未読カウント同期フック
// メインタブのバッジ表示用に、未読メッセージ数と
// 未対応の今夜行ける？リクエスト数を取得し appStore へ同期する。
// messages / tonight_requests の realtime 変更で自動更新する。
// アプリのタブ配下で1回だけマウントする想定。
// -----------------------------------------------------------

import { useEffect } from 'react';
import { getUnreadTonightRequestCount } from '@/services/castService';
import { getUnreadMessageCount } from '@/services/messageService';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

export function useUnreadCounts(): void {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setUnreadMessageCount = useAppStore((s) => s.setUnreadMessageCount);
  const setUnreadTonightRequestCount = useAppStore((s) => s.setUnreadTonightRequestCount);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const isCast = profile?.role === 'cast';
    let cancelled = false;

    const refresh = async () => {
      try {
        const msgCount = await getUnreadMessageCount(userId);
        if (!cancelled) setUnreadMessageCount(msgCount);
      } catch {
        // バッジは補助表示なので失敗は無視
      }
      if (isCast) {
        try {
          const reqCount = await getUnreadTonightRequestCount(userId);
          if (!cancelled) setUnreadTonightRequestCount(reqCount);
        } catch {
          // 同上
        }
      }
    };

    refresh();

    // messages の変更で未読数を再計算
    const msgChannel = supabase
      // 購読ごとに一意な名前（同名再利用は再購読例外の原因）
      .channel(`unread-messages:${userId}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => refresh(),
      )
      .subscribe();

    // tonight_requests の変更で未対応数を再計算（キャストのみ）
    const reqChannel = isCast
      ? supabase
          .channel(`unread-tonight:${userId}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tonight_requests' },
            () => refresh(),
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      supabase.removeChannel(msgChannel);
      if (reqChannel) supabase.removeChannel(reqChannel);
    };
  }, [user, profile, setUnreadMessageCount, setUnreadTonightRequestCount]);
}
