// ============================================================
// Mistella - Cast Service（キャスト専用機能）
// ============================================================

import { supabase } from '@/lib/supabase';
import type {
  BroadcastReactionType,
  BroadcastTonightRequest,
  CastProfile,
  CastProfileWithUser,
  TonightRequest,
  WorkStatus,
} from '@/types';
import { sendPushNotification } from '@/services/notificationService';

// -----------------------------------------------------------
// 出勤ステータス更新
// -----------------------------------------------------------

/**
 * キャストの出勤ステータスを更新する。
 * is_working は work_status が 'working' または 'break' のときに true にする。
 */
export async function updateWorkStatus(
  userId: string,
  status: WorkStatus,
): Promise<void> {
  const isWorking = status !== 'off';

  const { error } = await supabase
    .from('cast_profiles')
    .update({ work_status: status, is_working: isWorking })
    .eq('user_id', userId);

  if (error) throw error;
}

// -----------------------------------------------------------
// 位置情報更新
// -----------------------------------------------------------

/**
 * キャストの位置情報を更新する。
 * プライバシー保護のため ±0.01 度（約 1km）のランダムオフセットを付加する。
 * enabled が false の場合は位置情報を null にする。
 */
export async function updateLocation(
  userId: string,
  lat: number,
  lng: number,
  enabled: boolean,
): Promise<void> {
  let locationLat: number | null = null;
  let locationLng: number | null = null;

  if (enabled) {
    // ±0.01 度のランダムオフセット（ぼかし処理）
    const offset = () => (Math.random() - 0.5) * 0.02; // -0.01 ～ +0.01
    locationLat = lat + offset();
    locationLng = lng + offset();
  }

  const { error } = await supabase
    .from('cast_profiles')
    .update({
      location_lat: locationLat,
      location_lng: locationLng,
      location_enabled: enabled,
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// -----------------------------------------------------------
// 今夜行ける？リクエスト一覧取得
// -----------------------------------------------------------

/**
 * キャスト宛ての今夜行ける？リクエストを新しい順で取得する。
 * 顧客情報を JOIN して返す。
 */
export async function getTonightRequests(
  castId: string,
): Promise<TonightRequest[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('tonight_requests')
    .select('*, customer:users!tonight_requests_customer_id_fkey(*)')
    .eq('target_cast_id', castId)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TonightRequest[];
}

/**
 * 未対応（未読 = status 'sent'）の今夜行ける？リクエスト数を返す。
 * 期限切れは除外する。
 */
export async function getUnreadTonightRequestCount(castId: string): Promise<number> {
  const now = new Date().toISOString();
  const { count, error } = await supabase
    .from('tonight_requests')
    .select('id', { count: 'exact', head: true })
    .eq('target_cast_id', castId)
    .eq('status', 'sent')
    .gt('expires_at', now);
  if (error) throw error;
  return count ?? 0;
}

// -----------------------------------------------------------
// 今夜行ける？ステータス更新
// -----------------------------------------------------------

/** 今夜行ける？リクエストのステータスを更新する。 */
export async function updateTonightRequestStatus(
  requestId: string,
  status: string,
): Promise<void> {
  const { data: request } = await supabase
    .from('tonight_requests')
    .select('customer_id')
    .eq('id', requestId)
    .maybeSingle();

  const { error } = await supabase
    .from('tonight_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;

  if (request && (status === 'accepted' || status === 'declined')) {
    const statusLabel = status === 'accepted' ? '承諾' : '辞退';
    sendPushNotification({
      recipientUserId: request.customer_id,
      title: '今夜行ける？の返答',
      body: `リクエストが${statusLabel}されました`,
      notificationKey: 'notification_tonight_responses',
    });
  }
}

// -----------------------------------------------------------
// 全体向けブロードキャスト投稿一覧取得（キャスト用）
// -----------------------------------------------------------

/**
 * 全キャスト向けの今夜行ける？投稿を取得する。
 * 自分の反応情報も合わせて返す。
 */
export async function getBroadcastTonightRequests(
  castId: string,
): Promise<BroadcastTonightRequest[]> {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from('tonight_requests')
    .select('*, customer:users!tonight_requests_customer_id_fkey(*)')
    .is('target_cast_id', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const { data: reactions } = await supabase
    .from('tonight_broadcast_reactions')
    .select('*')
    .eq('cast_id', castId)
    .in('request_id', postIds);

  const reactionMap = new Map(
    (reactions ?? []).map((r) => [r.request_id, r]),
  );

  return posts.map((p) => ({
    ...p,
    my_reaction: reactionMap.get(p.id) ?? null,
  })) as BroadcastTonightRequest[];
}

// -----------------------------------------------------------
// ブロードキャスト投稿への反応（キャスト用）
// -----------------------------------------------------------

/** 全体向け投稿に興味あり or メッセージで反応する。 */
export async function reactToBroadcast(
  requestId: string,
  castId: string,
  type: BroadcastReactionType,
  message?: string,
): Promise<void> {
  const { error } = await supabase
    .from('tonight_broadcast_reactions')
    .upsert(
      { request_id: requestId, cast_id: castId, type, message: message ?? null },
      { onConflict: 'request_id,cast_id' },
    );

  if (error) throw error;

  const { data: request } = await supabase
    .from('tonight_requests')
    .select('customer_id')
    .eq('id', requestId)
    .single();

  if (request) {
    const body =
      type === 'interested'
        ? 'キャストがあなたの投稿に興味を示しています'
        : 'キャストからメッセージが届きました';
    sendPushNotification({
      recipientUserId: request.customer_id,
      title: '今夜行ける！に反応がありました',
      body,
      notificationKey: 'notification_tonight_responses',
    });
  }
}

// -----------------------------------------------------------
// キャスト検索（顧客向け）
// -----------------------------------------------------------

export const CAST_SEARCH_PAGE_SIZE = 20;

export type CastSearchFilters = {
  keyword: string;
  workingOnly: boolean;
  area: string | null;
  shopName: string | null;
};

/**
 * キャストを条件検索する（ページング付き）。
 * keyword はニックネーム（users 側を先引き）+ プロフィール各項目の横断検索。
 */
export async function searchCasts(
  filters: CastSearchFilters,
  page: number,
): Promise<CastProfileWithUser[]> {
  const { keyword, workingOnly, area, shopName } = filters;
  const from = page * CAST_SEARCH_PAGE_SIZE;
  const to = from + CAST_SEARCH_PAGE_SIZE - 1;

  let query = supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .range(from, to)
    // 出勤中を優先し、その後は新しい順（Sponsored 優先表示は廃止）
    .order('is_working', { ascending: false })
    .order('user_id', { ascending: false });

  if (workingOnly) {
    query = query.eq('is_working', true);
  }
  if (shopName) {
    query = query.ilike('shop_name', `%${shopName}%`);
  }
  if (area) {
    query = query.ilike('shop_address', `%${area}%`);
  }
  if (keyword) {
    // nicknameはJOINテーブルのため、先にuser_idを取得してOR条件に含める
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('id')
      .ilike('nickname', `%${keyword}%`);
    const matchedIds = (matchedUsers ?? []).map((u) => u.id);

    const orParts = [
      `shop_name.ilike.%${keyword}%`,
      `shop_address.ilike.%${keyword}%`,
      `hobbies.ilike.%${keyword}%`,
      `personality.ilike.%${keyword}%`,
      `charm_point.ilike.%${keyword}%`,
      `customer_message.ilike.%${keyword}%`,
      `favorite_topics.ilike.%${keyword}%`,
      `activities.ilike.%${keyword}%`,
    ];
    if (matchedIds.length > 0) {
      orParts.push(`user_id.in.(${matchedIds.join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CastProfileWithUser[];
}

/** 店舗名の部分一致でキャストを検索する（今夜行ける！送信画面用）。 */
export async function searchCastsByShopName(
  q: string,
  limit = 10,
): Promise<CastProfileWithUser[]> {
  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .ilike('shop_name', `%${q}%`)
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CastProfileWithUser[];
}

// -----------------------------------------------------------
// マップ表示用キャスト取得
// -----------------------------------------------------------

/**
 * マップに表示するキャストを取得する。
 * location_enabled=true かつ位置情報あり。onlyWorking の場合は is_working=true も条件。
 */
export async function getNearbyCastsForMap(
  onlyWorking: boolean,
): Promise<CastProfileWithUser[]> {
  let query = supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .eq('location_enabled', true)
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null);

  if (onlyWorking) {
    query = query.eq('is_working', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CastProfileWithUser[];
}

// -----------------------------------------------------------
// 現在地周辺の出勤中キャスト取得
// -----------------------------------------------------------

/**
 * 現在地から緯度経度 ±radiusDeg 度（矩形）以内の出勤中キャストを取得する。
 * デフォルト 0.05 度 ≈ 約 5km。
 */
export async function getNearbyWorkingCasts(
  lat: number,
  lng: number,
  radiusDeg = 0.05,
): Promise<CastProfileWithUser[]> {
  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .eq('is_working', true)
    .eq('location_enabled', true)
    .gte('location_lat', lat - radiusDeg)
    .lte('location_lat', lat + radiusDeg)
    .gte('location_lng', lng - radiusDeg)
    .lte('location_lng', lng + radiusDeg);

  if (error) throw error;
  return (data ?? []) as CastProfileWithUser[];
}

// -----------------------------------------------------------
// キャストプロフィール一括取得
// -----------------------------------------------------------

/** 複数ユーザー ID のキャストプロフィールをまとめて取得する。 */
export async function getCastProfilesByUserIds(
  userIds: string[],
): Promise<CastProfile[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*')
    .in('user_id', userIds);

  if (error) throw error;
  return (data ?? []) as unknown as CastProfile[];
}

/** 単一ユーザーのキャストプロフィールを取得する（存在しなければ null）。 */
export async function getCastProfileByUserId(
  userId: string,
): Promise<CastProfile | null> {
  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as CastProfile) ?? null;
}

/** 単一ユーザーのキャストプロフィールをユーザー情報付きで取得する（存在しなければ null）。 */
export async function getCastWithUser(
  userId: string,
): Promise<CastProfileWithUser | null> {
  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as CastProfileWithUser) ?? null;
}
