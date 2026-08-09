// ============================================================
// Mistella - Timeline Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Timeline } from '@/types';
import { compressImage } from '@/utils/imageUtils';

const DEFAULT_PAGE_SIZE = 20;

// -----------------------------------------------------------
// タイムライン一覧取得
// -----------------------------------------------------------

/**
 * 期限切れを除いたタイムライン一覧を取得する。
 * users テーブルを JOIN してユーザー情報も返す。
 */
export async function getTimelines(
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<Timeline[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('timelines')
    .select('*, user:users(*)')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return (data ?? []) as Timeline[];
}

// -----------------------------------------------------------
// 自分のタイムライン取得
// -----------------------------------------------------------

/** 特定ユーザーのタイムライン（期限切れ含む）を取得する。 */
export async function getMyTimelines(userId: string): Promise<Timeline[]> {
  const { data, error } = await supabase
    .from('timelines')
    .select('*, user:users(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Timeline[];
}

// -----------------------------------------------------------
// 単一取得
// -----------------------------------------------------------

/** 指定 ID のタイムラインを（ユーザー情報 JOIN 付きで）取得する。見つからなければ null。 */
export async function getTimelineById(id: string): Promise<Timeline | null> {
  const { data, error } = await supabase
    .from('timelines')
    .select('*, user:users(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Timeline | null) ?? null;
}

// -----------------------------------------------------------
// メディアアップロード
// -----------------------------------------------------------

/**
 * タイムライン用のメディアを Supabase Storage にアップロードし、
 * パブリック URL を返す。画像は圧縮してから JPEG でアップロードする。
 */
export async function uploadTimelineMedia(
  userId: string,
  localUri: string,
  mediaType: 'image' | 'video',
): Promise<string> {
  const isImage = mediaType === 'image';
  const sourceUri = isImage ? await compressImage(localUri) : localUri;

  const response = await fetch(sourceUri);
  const arrayBuffer = await response.arrayBuffer();

  const ext = isImage ? 'jpg' : 'mp4';
  const contentType = isImage ? 'image/jpeg' : 'video/mp4';
  // Storage RLS は先頭フォルダと auth.uid() の一致を検証するため、
  // 必ずユーザーIDをパスの先頭に置く。
  const path = `${userId}/timelines/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, arrayBuffer, { contentType, upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

// -----------------------------------------------------------
// 投稿作成
// -----------------------------------------------------------

/**
 * タイムラインに投稿する。
 * expires_at は投稿から 24 時間後に自動設定される。
 */
export async function createTimeline(
  userId: string,
  content: string | null,
  mediaUrl: string | null,
  mediaType: 'image' | 'video' | null,
): Promise<Timeline> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('timelines')
    .insert({
      user_id: userId,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      expires_at: expiresAt,
    })
    .select('*, user:users(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('タイムライン投稿の作成に失敗しました。');
  return data as Timeline;
}

// -----------------------------------------------------------
// 投稿削除
// -----------------------------------------------------------

/** 指定 ID のタイムライン投稿を削除する。 */
export async function deleteTimeline(id: string): Promise<void> {
  const { data: post, error: findError } = await supabase
    .from('timelines')
    .select('media_url')
    .eq('id', id)
    .maybeSingle();
  if (findError) throw findError;

  const { data: deleted, error } = await supabase
    .from('timelines')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!deleted) throw new Error('投稿を削除する権限がありません。');

  const storagePath = getMediaStoragePath(post?.media_url ?? null);
  if (storagePath) {
    // DB削除は完了しているため、Storage清掃の失敗で削除済み投稿を復活扱いにしない。
    const { error: storageError } = await supabase.storage.from('media').remove([storagePath]);
    if (storageError) console.warn('投稿メディアの削除に失敗しました。', storageError.message);
  }
}

function getMediaStoragePath(publicUrl: string | null) {
  if (!publicUrl) return null;
  const marker = '/storage/v1/object/public/media/';
  try {
    const pathname = new URL(publicUrl).pathname;
    const index = pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------
// 投稿編集（本文のみ）
// -----------------------------------------------------------

/** 投稿の本文を更新する。 */
export async function updateTimeline(
  id: string,
  content: string | null,
): Promise<Timeline> {
  const { data, error } = await supabase
    .from('timelines')
    .update({ content })
    .eq('id', id)
    .select('*, user:users(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('投稿の更新に失敗しました。');
  return data as Timeline;
}
