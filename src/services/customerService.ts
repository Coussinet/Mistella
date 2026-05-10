// ============================================================
// YoruConnect - Customer Service（顧客専用機能）
// ============================================================

import { supabase } from '../lib/supabase';
import type { Favorite, Footprint } from '../types';

// -----------------------------------------------------------
// 今夜行ける？送信
// -----------------------------------------------------------

/**
 * 今夜行ける？リクエストを送信する。
 * expires_at は送信から 24 時間後に設定する。
 */
export async function sendTonightRequest(
  customerId: string,
  castId: string,
  message?: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('tonight_requests').insert({
    customer_id: customerId,
    target_cast_id: castId,
    message: message ?? null,
    status: 'sent',
    expires_at: expiresAt,
  });

  if (error) throw error;
}

// -----------------------------------------------------------
// お気に入り追加
// -----------------------------------------------------------

/** お気に入りに追加する。既に存在する場合はエラーを無視する。 */
export async function addFavorite(
  userId: string,
  targetUserId: string,
): Promise<void> {
  const { error } = await supabase.from('favorites').upsert(
    { user_id: userId, target_user_id: targetUserId },
    { onConflict: 'user_id,target_user_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

// -----------------------------------------------------------
// お気に入り削除
// -----------------------------------------------------------

/** お気に入りから削除する。 */
export async function removeFavorite(
  userId: string,
  targetUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('target_user_id', targetUserId);

  if (error) throw error;
}

// -----------------------------------------------------------
// お気に入り一覧取得
// -----------------------------------------------------------

/**
 * お気に入り一覧を取得する。
 * ターゲットユーザー情報を JOIN して返す。
 */
export async function getFavorites(userId: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, target_user:users!favorites_target_user_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Favorite[];
}

// -----------------------------------------------------------
// お気に入り確認
// -----------------------------------------------------------

/** 指定ユーザーをお気に入りに登録しているかどうかを確認する。 */
export async function isFavorite(
  userId: string,
  targetUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('target_user_id', targetUserId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

// -----------------------------------------------------------
// 足跡を残す
// -----------------------------------------------------------

/**
 * 足跡を記録する。
 * 同日の重複は upsert で上書き（訪問日時を更新）する。
 * テーブルに visitor_id + visited_user_id のユニーク制約を想定。
 */
export async function addFootprint(
  visitorId: string,
  visitedUserId: string,
): Promise<void> {
  const { error } = await supabase.from('footprints').upsert(
    { visitor_id: visitorId, visited_user_id: visitedUserId },
    { onConflict: 'visitor_id,visited_user_id', ignoreDuplicates: false },
  );
  if (error) throw error;
}

// -----------------------------------------------------------
// 足跡一覧取得
// -----------------------------------------------------------

/**
 * 自分のプロフィールを訪問したユーザー（足跡）の一覧を取得する。
 * 訪問者情報を JOIN して返す。
 */
export async function getFootprints(userId: string): Promise<Footprint[]> {
  const { data, error } = await supabase
    .from('footprints')
    .select('*, visitor:users!footprints_visitor_id_fkey(*)')
    .eq('visited_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Footprint[];
}
