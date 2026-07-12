// ============================================================
// Mistella - Timeline Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Timeline } from '@/types';

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
  const { error } = await supabase.from('timelines').delete().eq('id', id);
  if (error) throw error;
}
