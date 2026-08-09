-- ============================================================
-- Mistella: お知らせ既読管理
-- ============================================================
-- お知らせ本文は announcements に保持し、利用者ごとの既読状態だけを
-- このテーブルに分離する。対象者以外の announcements は既存 RLS により
-- 取得できないため、男女別・個別配信にもそのまま対応する。

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id
  ON public.announcement_reads(user_id);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcement_reads_select_own ON public.announcement_reads;
CREATE POLICY announcement_reads_select_own ON public.announcement_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS announcement_reads_insert_own ON public.announcement_reads;
CREATE POLICY announcement_reads_insert_own ON public.announcement_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
