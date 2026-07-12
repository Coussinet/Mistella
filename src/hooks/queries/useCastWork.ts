// -----------------------------------------------------------
// Mistella - キャスト出勤・店舗情報クエリフック
// WorkingStatusScreen / ShopInfoScreen の更新系を useMutation 化する。
// 成功時は authStore の castProfile とキャスト系キャッシュを同期する。
// -----------------------------------------------------------

import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { upsertCastProfile } from '@/services/authService';
import { updateLocation, updateWorkStatus } from '@/services/castService';
import { useAuthStore } from '@/store/authStore';
import type { CastProfile, WorkStatus } from '@/types';
import { showError } from '@/utils/showError';

// -----------------------------------------------------------
// 出勤ステータス更新
// -----------------------------------------------------------

/** 出勤ステータスを更新する。成功時に authStore とキャスト系キャッシュを同期する。 */
export function useUpdateWorkStatus() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: WorkStatus) => {
      if (!user) throw new Error('ログインが必要です。');
      return updateWorkStatus(user.id, status);
    },
    onSuccess: (_data, status) => {
      const { castProfile, setCastProfile } = useAuthStore.getState();
      if (castProfile) {
        setCastProfile({
          ...castProfile,
          work_status: status,
          is_working: status !== 'off',
        });
      }
      // 出勤状態はキャスト一覧・詳細の表示に影響するためまとめて invalidate する
      queryClient.invalidateQueries({ queryKey: queryKeys.casts.all });
    },
    onError: (error) => {
      showError(error, 'ステータスの更新に失敗しました。');
    },
  });
}

// -----------------------------------------------------------
// 位置情報更新
// -----------------------------------------------------------

/**
 * 位置情報共有の ON/OFF を更新する。
 * ON の場合は現在地を取得してから更新する（権限リクエストは画面側で行う）。
 */
export function useUpdateLocationSharing() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error('ログインが必要です。');
      if (enabled) {
        const coords = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await updateLocation(
          user.id,
          coords.coords.latitude,
          coords.coords.longitude,
          true,
        );
      } else {
        await updateLocation(user.id, 0, 0, false);
      }
    },
    onSuccess: (_data, enabled) => {
      const { castProfile, setCastProfile } = useAuthStore.getState();
      if (castProfile) {
        setCastProfile({ ...castProfile, location_enabled: enabled });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.casts.all });
    },
    onError: (error) => {
      showError(error, '位置情報の更新に失敗しました。');
    },
  });
}

// -----------------------------------------------------------
// 店舗情報更新
// -----------------------------------------------------------

/** 店舗情報（店舗名・住所・料金）を UPSERT する。 */
export function useUpdateShopInfo() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fields: Partial<CastProfile>) => {
      if (!user) throw new Error('ログインが必要です。');
      return upsertCastProfile(user.id, fields);
    },
    onSuccess: (updated) => {
      useAuthStore.getState().setCastProfile(updated);
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.casts.detail(user.id) });
      }
    },
    onError: (error) => {
      showError(error, '店舗情報の保存に失敗しました。');
    },
  });
}
