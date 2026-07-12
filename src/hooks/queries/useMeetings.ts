// -----------------------------------------------------------
// Mistella - 会った記録・相手メモのクエリフック（両ロール共通）
// -----------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  createMeetingRecord,
  deleteMeetingRecord,
  getMeetingRecord,
  getMeetingRecords,
  getPartnerNote,
  getPartnerNotes,
  getReminders,
  updateMeetingRecord,
  upsertPartnerNote,
} from '@/services/meetingService';
import type { MeetingRecordInput } from '@/services/meetingService';
import {
  cancelPromiseReminder,
  schedulePromiseReminder,
} from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import type { MeetingRecord, PartnerNote } from '@/types';

// -----------------------------------------------------------
// 相手メモ
// -----------------------------------------------------------

/** 自分が書いた相手メモの一覧 */
export function usePartnerNotes() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.notes.list(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getPartnerNotes(user!.id),
  });
}

/** 特定の相手についてのメモ（未作成なら null） */
export function usePartnerNote(partnerId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.notes.detail(user?.id ?? '', partnerId ?? ''),
    enabled: !!user && !!partnerId,
    queryFn: () => getPartnerNote(user!.id, partnerId!),
  });
}

/** 相手メモの保存（UPSERT） */
export function useSavePartnerNote(partnerId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: Partial<PartnerNote>) =>
      upsertPartnerNote(user!.id, partnerId, note),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        queryKeys.notes.detail(user?.id ?? '', partnerId),
        saved,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(user?.id ?? '') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.reminders(user?.id ?? ''),
      });
    },
  });
}

// -----------------------------------------------------------
// 会った記録
// -----------------------------------------------------------

/** 会った記録一覧（partnerId 指定で相手別、未指定で全件） */
export function useMeetingRecords(partnerId?: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.meetings.list(user?.id ?? '', partnerId),
    enabled: !!user,
    queryFn: () => getMeetingRecords(user!.id, partnerId),
  });
}

/** 会った記録1件（編集画面用） */
export function useMeetingRecord(recordId: string | undefined) {
  return useQuery({
    queryKey: ['meetings', 'detail', recordId ?? ''],
    enabled: !!recordId,
    queryFn: () => getMeetingRecord(recordId!),
  });
}

/** 記録関連のクエリをまとめて invalidate する */
function useInvalidateMeetings() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    queryClient.invalidateQueries({
      queryKey: queryKeys.notes.reminders(user?.id ?? ''),
    });
  };
}

/** 記録の作成。約束があればローカル通知をスケジュールする。 */
export function useCreateMeetingRecord(partnerId: string) {
  const user = useAuthStore((s) => s.user);
  const invalidate = useInvalidateMeetings();

  return useMutation({
    mutationFn: (record: MeetingRecordInput) =>
      createMeetingRecord(user!.id, partnerId, record),
    onSuccess: async (created) => {
      invalidate();
      await syncPromiseReminder(created);
    },
  });
}

/** 記録の更新。約束の変更に合わせてローカル通知を再スケジュールする。 */
export function useUpdateMeetingRecord() {
  const invalidate = useInvalidateMeetings();

  return useMutation({
    mutationFn: ({
      recordId,
      record,
    }: {
      recordId: string;
      record: Partial<MeetingRecordInput>;
    }) => updateMeetingRecord(recordId, record),
    onSuccess: async (updated) => {
      invalidate();
      await syncPromiseReminder(updated);
    },
  });
}

/** 記録の削除。ローカル通知もキャンセルする。 */
export function useDeleteMeetingRecord() {
  const invalidate = useInvalidateMeetings();

  return useMutation({
    mutationFn: (recordId: string) => deleteMeetingRecord(recordId),
    onSuccess: async (_data, recordId) => {
      invalidate();
      await cancelPromiseReminder(recordId);
    },
  });
}

/** 記録の約束に合わせて通知を登録/解除する（失敗しても保存自体は成功扱い） */
async function syncPromiseReminder(record: MeetingRecord): Promise<void> {
  try {
    if (record.next_promise_at) {
      await schedulePromiseReminder(record);
    } else {
      await cancelPromiseReminder(record.id);
    }
  } catch {
    // 通知の登録失敗は無視（設定オフや権限なしの場合など）
  }
}

// -----------------------------------------------------------
// リマインダー
// -----------------------------------------------------------

/** 来店予定・誕生日・約束のリマインダー */
export function useMeetingReminders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.notes.reminders(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => getReminders(user!.id),
  });
}
