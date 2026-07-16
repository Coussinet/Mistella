// -----------------------------------------------------------
// Mistella - Realtime → React Query invalidate 連携フック
// postgres_changes を購読し、変更があれば対応するクエリを invalidate する。
// チャンネルの登録・解除はこのフックに閉じ込める。
// -----------------------------------------------------------

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeInvalidationOptions {
  /** チャンネル名（画面内で一意にする） */
  channelName: string;
  /** 購読対象テーブル */
  table: string;
  /** 購読イベント（デフォルト: すべて） */
  event?: PostgresEvent;
  /** 行フィルタ（例: `target_cast_id=eq.${userId}`） */
  filter?: string;
  /** 変更時に invalidate するクエリキー */
  invalidateKeys: QueryKey[];
  /** 購読を有効にするか（ユーザー未取得時などに false） */
  enabled?: boolean;
}

export function useRealtimeInvalidation({
  channelName,
  table,
  event = '*',
  filter,
  invalidateKeys,
  enabled = true,
}: RealtimeInvalidationOptions): void {
  const queryClient = useQueryClient();
  // invalidateKeys は毎レンダー新しい配列になるため、内容で比較する
  const keysSignature = JSON.stringify(invalidateKeys);

  useEffect(() => {
    if (!enabled) return;

    const keys = JSON.parse(keysSignature) as QueryKey[];
    // チャンネル名はマウントごとに一意にする。
    // supabase-js は同名チャンネルの既存インスタンスを返すため、
    // 高速な画面往復で「購読解除前の再購読」となり
    // "cannot add postgres_changes callbacks after subscribe()" 例外
    // （本番ではクラッシュ）が発生する。
    const uniqueName = `${channelName}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(uniqueName)
      .on(
        'postgres_changes',
        { event: event as '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => {
          for (const key of keys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, table, event, filter, keysSignature, enabled, queryClient]);
}
