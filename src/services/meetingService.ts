// ============================================================
// Mistella - Meeting Service（会った記録・相手メモ）
// 両ロール共通。partner_notes（相手ごと1件のメモ）と
// meeting_records（会った履歴ログ）を扱う。
// RLS により author_id = auth.uid() の行しか読み書きできない。
// ============================================================

import { supabase } from '@/lib/supabase';
import type { MeetingRecord, PartnerNote } from '@/types';

// -----------------------------------------------------------
// 相手メモ（partner_notes）
// -----------------------------------------------------------

/** 自分が書いた相手メモの一覧を取得する（相手情報を JOIN、更新日降順）。 */
export async function getPartnerNotes(authorId: string): Promise<PartnerNote[]> {
  const { data, error } = await supabase
    .from('partner_notes')
    .select('*, partner:users!partner_notes_partner_id_fkey(*)')
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as PartnerNote[];
}

/** 特定の相手についてのメモを取得する（未作成なら null）。 */
export async function getPartnerNote(
  authorId: string,
  partnerId: string,
): Promise<PartnerNote | null> {
  const { data, error } = await supabase
    .from('partner_notes')
    .select('*, partner:users!partner_notes_partner_id_fkey(*)')
    .eq('author_id', authorId)
    .eq('partner_id', partnerId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as PartnerNote) ?? null;
}

/** 相手メモを UPSERT する（author_id + partner_id の複合ユニーク）。 */
export async function upsertPartnerNote(
  authorId: string,
  partnerId: string,
  note: Partial<PartnerNote>,
): Promise<PartnerNote> {
  // JOIN 済みの partner やサーバー管理カラムは upsert に含めない
  const {
    partner: _p,
    id: _id,
    created_at: _ca,
    updated_at: _ua,
    author_id: _ai,
    partner_id: _pi,
    ...noteFields
  } = note;

  const { data, error } = await supabase
    .from('partner_notes')
    .upsert(
      {
        ...noteFields,
        author_id: authorId,
        partner_id: partnerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'author_id,partner_id' },
    )
    .select('*, partner:users!partner_notes_partner_id_fkey(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('メモの保存に失敗しました。');
  return data as unknown as PartnerNote;
}

/** 相手メモを削除する。 */
export async function deletePartnerNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('partner_notes').delete().eq('id', noteId);
  if (error) throw error;
}

// -----------------------------------------------------------
// 会った記録（meeting_records）
// -----------------------------------------------------------

/**
 * 会った記録を取得する（met_at 降順）。
 * partnerId 指定時は相手別、未指定なら自分の全記録。
 */
export async function getMeetingRecords(
  authorId: string,
  partnerId?: string,
): Promise<MeetingRecord[]> {
  let query = supabase
    .from('meeting_records')
    .select('*, partner:users!meeting_records_partner_id_fkey(*)')
    .eq('author_id', authorId)
    .order('met_at', { ascending: false });

  if (partnerId) {
    query = query.eq('partner_id', partnerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as MeetingRecord[];
}

/** 会った記録を1件取得する。 */
export async function getMeetingRecord(
  recordId: string,
): Promise<MeetingRecord | null> {
  const { data, error } = await supabase
    .from('meeting_records')
    .select('*, partner:users!meeting_records_partner_id_fkey(*)')
    .eq('id', recordId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as MeetingRecord) ?? null;
}

export interface MeetingRecordInput {
  met_at: string;
  place?: string | null;
  activities?: string | null;
  memo?: string | null;
  amount_spent?: number | null;
  next_promise_at?: string | null;
  next_promise_note?: string | null;
}

/** 会った記録を作成する。 */
export async function createMeetingRecord(
  authorId: string,
  partnerId: string,
  record: MeetingRecordInput,
): Promise<MeetingRecord> {
  const { data, error } = await supabase
    .from('meeting_records')
    .insert({ ...record, author_id: authorId, partner_id: partnerId })
    .select('*, partner:users!meeting_records_partner_id_fkey(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('記録の保存に失敗しました。');
  return data as unknown as MeetingRecord;
}

/** 会った記録を更新する。 */
export async function updateMeetingRecord(
  recordId: string,
  record: Partial<MeetingRecordInput>,
): Promise<MeetingRecord> {
  const { data, error } = await supabase
    .from('meeting_records')
    .update({ ...record, updated_at: new Date().toISOString() })
    .eq('id', recordId)
    .select('*, partner:users!meeting_records_partner_id_fkey(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('記録の更新に失敗しました。');
  return data as unknown as MeetingRecord;
}

/** 会った記録を削除する。 */
export async function deleteMeetingRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('meeting_records').delete().eq('id', recordId);
  if (error) throw error;
}

// -----------------------------------------------------------
// リマインダー
// -----------------------------------------------------------

export interface MeetingReminders {
  /** 来店予定（3日以内）・誕生日（7日以内）のメモ */
  notes: PartnerNote[];
  /** 今後の約束（7日以内）の記録 */
  promises: MeetingRecord[];
}

/**
 * リマインダー対象を取得する。
 * - partner_notes: 次回来店日が今日から3日以内、または誕生日が7日以内（月日比較）
 * - meeting_records: next_promise_at が今日から7日以内
 */
export async function getReminders(authorId: string): Promise<MeetingReminders> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const visitLimit = new Date(today);
  visitLimit.setDate(visitLimit.getDate() + 3);
  const visitLimitStr = visitLimit.toISOString().split('T')[0];

  const birthdayLimit = new Date(today);
  birthdayLimit.setDate(birthdayLimit.getDate() + 7);
  const birthdayLimitStr = birthdayLimit.toISOString().split('T')[0];

  const promiseLimit = new Date(today);
  promiseLimit.setDate(promiseLimit.getDate() + 7);

  const [visitRes, birthdayRes, promiseRes] = await Promise.all([
    // 来店日が範囲内のメモ
    supabase
      .from('partner_notes')
      .select('*, partner:users!partner_notes_partner_id_fkey(*)')
      .eq('author_id', authorId)
      .gte('next_visit_date', todayStr)
      .lte('next_visit_date', visitLimitStr),
    // 誕生日ありのメモ（月日比較のため全件取得して JS でフィルタ）
    supabase
      .from('partner_notes')
      .select('*, partner:users!partner_notes_partner_id_fkey(*)')
      .eq('author_id', authorId)
      .not('birthday', 'is', null),
    // 約束が範囲内の記録
    supabase
      .from('meeting_records')
      .select('*, partner:users!meeting_records_partner_id_fkey(*)')
      .eq('author_id', authorId)
      .gte('next_promise_at', today.toISOString())
      .lte('next_promise_at', promiseLimit.toISOString())
      .order('next_promise_at', { ascending: true }),
  ]);

  if (visitRes.error) throw visitRes.error;
  if (birthdayRes.error) throw birthdayRes.error;
  if (promiseRes.error) throw promiseRes.error;

  const todayMD = todayStr.slice(5); // MM-DD
  const birthdayLimitMD = birthdayLimitStr.slice(5);

  const birthdayReminders = (
    (birthdayRes.data ?? []) as unknown as PartnerNote[]
  ).filter((note) => {
    if (!note.birthday) return false;
    const birthdayMD = note.birthday.slice(5);
    // 月をまたぐ場合（例: 12-29 ～ 01-04）も考慮した簡易比較
    if (todayMD <= birthdayLimitMD) {
      return birthdayMD >= todayMD && birthdayMD <= birthdayLimitMD;
    }
    return birthdayMD >= todayMD || birthdayMD <= birthdayLimitMD;
  });

  const visitNotes = (visitRes.data ?? []) as unknown as PartnerNote[];
  const visitIds = new Set(visitNotes.map((n) => n.id));
  const notes = [
    ...visitNotes,
    ...birthdayReminders.filter((n) => !visitIds.has(n.id)),
  ];

  return {
    notes,
    promises: (promiseRes.data ?? []) as unknown as MeetingRecord[],
  };
}

// -----------------------------------------------------------
// 集計
// -----------------------------------------------------------

/** 相手ごとの記録サマリー（最終接触日・記録件数・累計金額） */
export interface MeetingSummary {
  lastMetAt: string | null;
  recordCount: number;
  totalSpent: number;
}

/** 自分の全記録から相手ごとのサマリーを作る（クライアント側集計）。 */
export function summarizeByPartner(
  records: MeetingRecord[],
): Record<string, MeetingSummary> {
  const map: Record<string, MeetingSummary> = {};
  for (const r of records) {
    const entry = (map[r.partner_id] ??= {
      lastMetAt: null,
      recordCount: 0,
      totalSpent: 0,
    });
    entry.recordCount += 1;
    entry.totalSpent += r.amount_spent ?? 0;
    if (!entry.lastMetAt || r.met_at > entry.lastMetAt) {
      entry.lastMetAt = r.met_at;
    }
  }
  return map;
}
