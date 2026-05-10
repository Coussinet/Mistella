// ============================================================
// Mistella - Cast Service（キャスト専用機能）
// ============================================================

import { supabase } from '../lib/supabase';
import type { CustomerNote, TonightRequest, WorkStatus } from '../types';

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

// -----------------------------------------------------------
// 今夜行ける？ステータス更新
// -----------------------------------------------------------

/** 今夜行ける？リクエストのステータスを更新する。 */
export async function updateTonightRequestStatus(
  requestId: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from('tonight_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;
}

// -----------------------------------------------------------
// 顧客ノート一覧取得
// -----------------------------------------------------------

/**
 * キャストが管理する顧客ノートの一覧を取得する。
 * 顧客情報を JOIN して返す。
 */
export async function getCustomerNotes(
  castId: string,
): Promise<CustomerNote[]> {
  const { data, error } = await supabase
    .from('customer_notes')
    .select('*, customer:users!customer_notes_customer_id_fkey(*)')
    .eq('cast_id', castId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomerNote[];
}

// -----------------------------------------------------------
// 顧客ノート作成/更新
// -----------------------------------------------------------

/** 顧客ノートを UPSERT する。cast_id + customer_id の複合ユニーク制約を想定。 */
export async function upsertCustomerNote(
  castId: string,
  customerId: string,
  note: Partial<CustomerNote>,
): Promise<CustomerNote> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('customer_notes')
    .upsert(
      {
        ...note,
        cast_id: castId,
        customer_id: customerId,
        updated_at: now,
      },
      { onConflict: 'cast_id,customer_id' },
    )
    .select('*, customer:users!customer_notes_customer_id_fkey(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('顧客ノートの保存に失敗しました。');
  return data as CustomerNote;
}

// -----------------------------------------------------------
// リマインダー対象顧客の取得
// -----------------------------------------------------------

/**
 * リマインダー対象となる顧客ノートを返す。
 * - 次回来店日が今日から 3 日以内
 * - 誕生日が今日から 7 日以内（年を無視して月日で比較）
 */
export async function getReminderCustomers(
  castId: string,
): Promise<CustomerNote[]> {
  const today = new Date();

  // 来店リマインダー: 3 日以内
  const visitLimit = new Date(today);
  visitLimit.setDate(visitLimit.getDate() + 3);

  // 誕生日リマインダー: 7 日以内（簡易実装: next_visit_date と birthday を OR 条件で取得）
  const birthdayLimit = new Date(today);
  birthdayLimit.setDate(birthdayLimit.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const visitLimitStr = visitLimit.toISOString().split('T')[0];
  const birthdayLimitStr = birthdayLimit.toISOString().split('T')[0];

  // 来店日が範囲内のノート
  const { data: visitData, error: visitError } = await supabase
    .from('customer_notes')
    .select('*, customer:users!customer_notes_customer_id_fkey(*)')
    .eq('cast_id', castId)
    .gte('next_visit_date', todayStr)
    .lte('next_visit_date', visitLimitStr);

  if (visitError) throw visitError;

  // 誕生日が範囲内のノート（月日のみ比較するため全件取得して JS でフィルタ）
  const { data: allNotes, error: allError } = await supabase
    .from('customer_notes')
    .select('*, customer:users!customer_notes_customer_id_fkey(*)')
    .eq('cast_id', castId)
    .not('birthday', 'is', null);

  if (allError) throw allError;

  const todayMD = todayStr.slice(5); // MM-DD
  const birthdayLimitMD = birthdayLimitStr.slice(5);

  const birthdayReminders = ((allNotes ?? []) as CustomerNote[]).filter(
    (note) => {
      if (!note.birthday) return false;
      const birthdayMD = note.birthday.slice(5); // MM-DD
      // 月をまたぐ場合（例: 12-29 ～ 01-04）も考慮した簡易比較
      return birthdayMD >= todayMD && birthdayMD <= birthdayLimitMD;
    },
  );

  // 重複を除いてマージ
  const visitIds = new Set((visitData ?? []).map((n) => n.id));
  const merged = [
    ...((visitData ?? []) as CustomerNote[]),
    ...birthdayReminders.filter((n) => !visitIds.has(n.id)),
  ];

  return merged;
}
