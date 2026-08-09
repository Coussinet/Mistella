// ============================================================
// Mistella - アプリ内お知らせ
// announcements の RLS が対象ロール・対象ユーザーを絞り込むため、
// クライアントではログインユーザー向けの行だけを取得できる。
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];

export type AnnouncementItem = Pick<
  AnnouncementRow,
  'id' | 'title' | 'body' | 'created_at' | 'sent_at'
> & {
  isRead: boolean;
};

export async function getAnnouncements(userId: string): Promise<AnnouncementItem[]> {
  const { data: announcements, error: announcementsError } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, sent_at')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(100);

  if (announcementsError) throw announcementsError;

  const ids = (announcements ?? []).map((announcement) => announcement.id);
  if (ids.length === 0) return [];

  const { data: reads, error: readsError } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', userId)
    .in('announcement_id', ids);

  if (readsError) throw readsError;

  const readIds = new Set((reads ?? []).map((read) => read.announcement_id));
  return (announcements ?? []).map((announcement) => ({
    ...announcement,
    isRead: readIds.has(announcement.id),
  }));
}

export async function markAnnouncementsRead(
  userId: string,
  announcementIds: string[],
): Promise<void> {
  if (announcementIds.length === 0) return;

  const { error } = await supabase.from('announcement_reads').upsert(
    announcementIds.map((announcementId) => ({
      announcement_id: announcementId,
      user_id: userId,
    })),
    { onConflict: 'announcement_id,user_id', ignoreDuplicates: true },
  );

  if (error) throw error;
}
