-- ============================================================
-- Mistella: 管理画面のお知らせ対象拡張 / キャスト勤務予定時間
-- ============================================================

-- 全ユーザー向けのお知らせを追加する。
ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_target_type_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_target_type_check
  CHECK (target_type IN ('all', 'all_male', 'all_female', 'individual'));

-- お知らせは対象ロールだけが読めるよう、既存の広すぎるポリシーを修正する。
DROP POLICY IF EXISTS announcements_select_policy ON public.announcements;
CREATE POLICY announcements_select_policy ON public.announcements
  FOR SELECT TO authenticated
  USING (
    target_type = 'all'
    OR target_user_id = auth.uid()
    OR (
      target_type = 'all_male'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'customer'
      )
    )
    OR (
      target_type = 'all_female'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'cast'
      )
    )
  );

-- 現在の勤務予定。日をまたぐ勤務にも対応するためTIMESTAMPTZで保持する。
ALTER TABLE public.cast_profiles
  ADD COLUMN IF NOT EXISTS shift_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shift_ends_at TIMESTAMPTZ;

ALTER TABLE public.cast_profiles
  DROP CONSTRAINT IF EXISTS cast_profiles_shift_time_order_check;

ALTER TABLE public.cast_profiles
  ADD CONSTRAINT cast_profiles_shift_time_order_check
  CHECK (
    shift_starts_at IS NULL
    OR shift_ends_at IS NULL
    OR shift_ends_at > shift_starts_at
  );

COMMENT ON COLUMN public.cast_profiles.shift_starts_at IS '現在の勤務予定開始日時';
COMMENT ON COLUMN public.cast_profiles.shift_ends_at IS '現在の勤務予定終了日時';
