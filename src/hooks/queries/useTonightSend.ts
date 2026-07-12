// -----------------------------------------------------------
// Mistella - 今夜行ける！送信画面用クエリフック（顧客用）
// -----------------------------------------------------------

import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getCastWithUser,
  getNearbyWorkingCasts,
  searchCastsByShopName,
} from '@/services/castService';
import {
  sendBroadcastTonightRequest,
  sendTonightRequest,
} from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import type { CastProfileWithUser } from '@/types';
import { showError } from '@/utils/showError';

// -----------------------------------------------------------
// プリセットキャスト取得
// -----------------------------------------------------------

/** 遷移パラメータで指定されたキャストのプロフィールを取得する */
export function usePresetCast(castUserId: string | null) {
  return useQuery({
    queryKey: queryKeys.casts.detail(castUserId ?? ''),
    enabled: !!castUserId,
    queryFn: () => getCastWithUser(castUserId!),
  });
}

// -----------------------------------------------------------
// 店舗名検索
// -----------------------------------------------------------

/** 店舗名の部分一致検索（空文字のときは実行しない） */
export function useCastShopSearch(rawQuery: string) {
  const q = rawQuery.trim();

  return useQuery({
    queryKey: queryKeys.casts.search({ shopName: q }),
    enabled: q.length > 0,
    queryFn: () => searchCastsByShopName(q),
  });
}

// -----------------------------------------------------------
// 現在地周辺の出勤中キャスト
// -----------------------------------------------------------

/**
 * 現在地周辺（約5km）の出勤中キャスト一覧。
 * 位置情報の許可が得られない場合はアラートを表示して空配列を返す。
 * モード切替のたびに再取得するため staleTime は 0。
 */
export function useNearbyTonightCasts(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.casts.nearbyTonight(),
    enabled,
    staleTime: 0,
    queryFn: async (): Promise<CastProfileWithUser[]> => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報', '位置情報の許可が必要です。');
        return [];
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return getNearbyWorkingCasts(loc.coords.latitude, loc.coords.longitude);
    },
  });
}

// -----------------------------------------------------------
// 送信 mutation
// -----------------------------------------------------------

export type TonightSendInput =
  | { mode: 'broadcast'; message?: string }
  | { mode: 'targets'; targetCastIds: string[]; message?: string };

/** 今夜行ける！を送信する（全体投稿 or 指定キャストへ一括送信） */
export function useSendTonight() {
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (input: TonightSendInput): Promise<void> => {
      if (!profile?.id) throw new Error('ログインが必要です。');

      if (input.mode === 'broadcast') {
        await sendBroadcastTonightRequest(profile.id, input.message);
        return;
      }
      await Promise.all(
        input.targetCastIds.map((castId) =>
          sendTonightRequest(profile.id, castId, input.message),
        ),
      );
    },
    onError: (error) => {
      showError(error, '送信に失敗しました。時間をおいて再度お試しください。');
    },
  });
}
