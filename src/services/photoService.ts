// ============================================================
// Mistella - Photo Service（プロフィール複数写真）
// profile_photos テーブルと profile-photos バケットを扱う。
// 表示は全員可、追加・削除は本人のみ（RLS）。
// ============================================================

import { supabase } from '@/lib/supabase';
import type { ProfilePhoto } from '@/types';
import { uploadImage } from '@/utils/imageUtils';

/** 指定ユーザーのプロフィール写真を並び順で取得する。 */
export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProfilePhoto[];
}

/** 端末内の画像をアップロードし、profile_photos に1件追加する。 */
export async function addProfilePhoto(
  userId: string,
  localUri: string,
  sortOrder: number,
): Promise<ProfilePhoto> {
  const path = `${userId}/${Date.now()}.jpg`;
  const photoUrl = await uploadImage(localUri, 'profile-photos', path);

  const { data, error } = await supabase
    .from('profile_photos')
    .insert({ user_id: userId, photo_url: photoUrl, sort_order: sortOrder })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('写真の追加に失敗しました。');
  return data as ProfilePhoto;
}

/** プロフィール写真を1件削除する。 */
export async function deleteProfilePhoto(photoId: string): Promise<void> {
  const { error } = await supabase.from('profile_photos').delete().eq('id', photoId);
  if (error) throw error;
}
