// ============================================================
// Mistella - Match Service
// ============================================================

import { supabase } from '../lib/supabase';
import type { CastProfile, Match, UserRole } from '../types';
import { sendPushNotification } from './notificationService';

// -----------------------------------------------------------
// いいね送信
// -----------------------------------------------------------

/**
 * いいねを送信する。
 * 相手からすでにいいねがあればマッチングテーブルに行を挿入してマッチ成立とする。
 */
export async function sendLike(
  fromUserId: string,
  toUserId: string,
): Promise<{ matched: boolean }> {
  // 既存のいいね確認（重複防止）
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .maybeSingle();

  if (!existing) {
    const { error: likeError } = await supabase.from('likes').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
    });
    if (likeError) throw likeError;

    // いいね通知
    sendPushNotification({
      recipientUserId: toUserId,
      title: 'いいね！',
      body: 'あなたにいいねが届きました',
      notificationKey: 'notification_likes',
    });
  }

  // 相手からのいいね確認
  const { data: reverseLike } = await supabase
    .from('likes')
    .select('id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .maybeSingle();

  if (!reverseLike) {
    return { matched: false };
  }

  // マッチング済みか確認
  const { data: existingMatch } = await supabase
    .from('matches')
    .select('id')
    .or(
      `and(customer_id.eq.${fromUserId},cast_id.eq.${toUserId}),and(customer_id.eq.${toUserId},cast_id.eq.${fromUserId})`,
    )
    .maybeSingle();

  if (!existingMatch) {
    // ユーザーロールを取得してどちらが cast か決定する
    const { data: users } = await supabase
      .from('users')
      .select('id, role')
      .in('id', [fromUserId, toUserId]);

    const fromUser = users?.find((u) => u.id === fromUserId);
    const toUser = users?.find((u) => u.id === toUserId);

    const castId =
      fromUser?.role === 'cast'
        ? fromUserId
        : toUser?.role === 'cast'
          ? toUserId
          : toUserId;
    const customerId = castId === fromUserId ? toUserId : fromUserId;

    const { error: matchError } = await supabase.from('matches').insert({
      cast_id: castId,
      customer_id: customerId,
      status: 'matched',
    });
    if (matchError) throw matchError;

    // マッチング通知（両者に送信）
    sendPushNotification({
      recipientUserId: toUserId,
      title: 'マッチング成立！',
      body: 'マッチングが成立しました。チャットを始めましょう！',
      notificationKey: 'notification_matches',
    });
    sendPushNotification({
      recipientUserId: fromUserId,
      title: 'マッチング成立！',
      body: 'マッチングが成立しました。チャットを始めましょう！',
      notificationKey: 'notification_matches',
    });
  }

  return { matched: true };
}

// -----------------------------------------------------------
// いいね取り消し
// -----------------------------------------------------------

/** いいねを取り消す。 */
export async function removeLike(
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId);
  if (error) throw error;
}

// -----------------------------------------------------------
// 自分がいいねしたユーザー一覧
// -----------------------------------------------------------

/** 自分がいいねした相手のユーザー ID 一覧を返す。 */
export async function getLikedUsers(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('likes')
    .select('to_user_id')
    .eq('from_user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.to_user_id as string);
}

// -----------------------------------------------------------
// マッチ一覧取得
// -----------------------------------------------------------

/**
 * ユーザーのマッチ一覧を取得する。
 * role に応じて cast 側・customer 側のどちらかでフィルタリングする。
 */
export async function getMatches(
  userId: string,
  role: UserRole,
): Promise<Match[]> {
  const column = role === 'cast' ? 'cast_id' : 'customer_id';

  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      cast:users!matches_cast_id_fkey(*),
      customer:users!matches_customer_id_fkey(*)
    `,
    )
    .eq(column, userId)
    .eq('status', 'matched')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Match[];
}

// -----------------------------------------------------------
// キャスト一覧取得（顧客向け）
// -----------------------------------------------------------

/**
 * キャスト一覧を取得する。
 * is_sponsored が true の行を先頭に表示する。
 * keyword はニックネームおよびショップ名で部分一致検索。
 */
export async function getCasts(filters?: {
  shopName?: string;
  isWorking?: boolean;
  keyword?: string;
  area?: string;
  page?: number;
}): Promise<CastProfile[]> {
  const pageSize = 20;
  const page = filters?.page ?? 0;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .order('is_sponsored', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters?.isWorking !== undefined) {
    query = query.eq('is_working', filters.isWorking);
  }
  if (filters?.shopName) {
    query = query.ilike('shop_name', `%${filters.shopName}%`);
  }
  if (filters?.area) {
    query = query.ilike('shop_address', `%${filters.area}%`);
  }
  if (filters?.keyword) {
    // ニックネームは users テーブル側なので RPC か別クエリが必要な場合は要調整
    query = query.ilike('shop_name', `%${filters.keyword}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CastProfile[];
}

// -----------------------------------------------------------
// 近くのキャスト一覧
// -----------------------------------------------------------

/**
 * 現在位置から半径 radiusKm 以内の出勤中キャストを返す。
 * Supabase RPC `get_nearby_casts` を使用する想定。
 * RPC が存在しない場合は全件取得して JavaScript 側でフィルタリングする。
 */
export async function getNearbyCasts(
  lat: number,
  lng: number,
  radiusKm: number = 5,
): Promise<CastProfile[]> {
  // RPC を優先して呼び出す
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_nearby_casts',
    { lat, lng, radius_km: radiusKm },
  );

  if (!rpcError && rpcData) {
    return rpcData as CastProfile[];
  }

  // RPC が未実装の場合は JS 側で絞り込む（フォールバック）
  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .eq('is_working', true)
    .eq('location_enabled', true)
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null);

  if (error) throw error;

  const radiusDeg = radiusKm / 111; // 1度 ≈ 111km
  return ((data ?? []) as CastProfile[]).filter((cast) => {
    if (cast.location_lat === null || cast.location_lng === null) return false;
    const dLat = cast.location_lat - lat;
    const dLng = cast.location_lng - lng;
    return Math.sqrt(dLat * dLat + dLng * dLng) <= radiusDeg;
  });
}
