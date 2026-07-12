// -----------------------------------------------------------
// Mistella - 自分のプロフィールクエリフック
// プロフィール表示・編集画面のサーバー状態を React Query で管理する。
// 取得・保存の成功時には authStore（zustand）側も更新して整合を保つ。
// -----------------------------------------------------------

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getCustomerProfile,
  getProfile,
  updateProfile,
  upsertCastProfile,
  upsertCustomerProfile,
} from '@/services/authService';
import { getCastProfileByUserId } from '@/services/castService';
import { useAuthStore } from '@/store/authStore';
import type { CastProfile, CustomerProfile, User } from '@/types';
import { uploadImage } from '@/utils/imageUtils';
import { showError } from '@/utils/showError';

// -----------------------------------------------------------
// クエリ
// -----------------------------------------------------------

/** 自分のプロフィール。取得成功時に authStore の profile も最新化する。 */
export function useMyProfile() {
  const user = useAuthStore((s) => s.user);
  const setProfile = useAuthStore((s) => s.setProfile);

  const query = useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getProfile(user!.id),
  });

  // authStore と同期（既存挙動: 画面表示のたびに最新プロフィールを反映）
  useEffect(() => {
    if (query.data) setProfile(query.data);
  }, [query.data, setProfile]);

  return query;
}

/** 自分のキャストプロフィール（キャストロールのときのみフェッチ）。 */
export function useMyCastProfile() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: queryKeys.casts.detail(user?.id ?? ''),
    enabled: !!user && profile?.role === 'cast',
    queryFn: () => getCastProfileByUserId(user!.id),
  });
}

/** 自分の顧客プロフィール（顧客ロールのときのみフェッチ）。 */
export function useMyCustomerProfile() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: queryKeys.customerProfile(user?.id ?? ''),
    enabled: !!user && !!profile && profile.role !== 'cast',
    queryFn: () => getCustomerProfile(user!.id),
  });
}

// -----------------------------------------------------------
// プロフィール保存（EditProfileScreen）
// -----------------------------------------------------------

export interface SaveProfileInput {
  nickname: string;
  bio: string | null;
  /** 新しく選択されたアバター画像の URI（変更が無ければ null） */
  newAvatarUri: string | null;
  /** キャストの場合のみ指定 */
  castFields?: Partial<CastProfile>;
  /** 顧客の場合のみ指定 */
  customerFields?: Partial<CustomerProfile>;
}

/**
 * プロフィール保存。
 * アバターアップロード → users 更新 → cast/customer プロフィール UPSERT を行い、
 * 成功時に authStore と各クエリキャッシュを最新化する。
 */
export function useSaveMyProfile() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nickname,
      bio,
      newAvatarUri,
      castFields,
      customerFields,
    }: SaveProfileInput): Promise<{
      updatedProfile: User;
      updatedCast: CastProfile | null;
    }> => {
      if (!user) throw new Error('ログインが必要です。');

      let avatarUrl = useAuthStore.getState().profile?.avatar_url ?? null;
      if (newAvatarUri) {
        avatarUrl = await uploadImage(newAvatarUri, 'avatars', `${user.id}/avatar.jpg`);
      }

      const updatedProfile = await updateProfile(user.id, {
        nickname,
        bio,
        avatar_url: avatarUrl,
      });

      let updatedCast: CastProfile | null = null;
      if (castFields) {
        updatedCast = await upsertCastProfile(user.id, castFields);
      }
      if (customerFields) {
        await upsertCustomerProfile(user.id, customerFields);
      }

      return { updatedProfile, updatedCast };
    },
    onSuccess: ({ updatedProfile, updatedCast }) => {
      // authStore と整合を保つ（既存挙動の維持）
      const { setProfile, setCastProfile } = useAuthStore.getState();
      setProfile(updatedProfile);
      if (updatedCast) setCastProfile(updatedCast);

      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.casts.detail(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerProfile(user.id) });
      }
    },
    onError: (error) => {
      showError(error, '保存に失敗しました。');
    },
  });
}
