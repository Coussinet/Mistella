-- ============================================================
-- Mistella: DBマイグレーション 008
-- 目的: 「会った記録」機能の導入
--   1. partner_notes   … 両ロール共通の相手メモ（customer_notes の汎用化、1ペア1件）
--   2. meeting_records … 会った履歴のイベントログ（1ペアN件）
--   3. customer_notes からのデータ移行と廃止（未リリースのため同期トリガーは不要）
--   4. push_tokens に約束リマインダー通知設定を追加
-- ============================================================

-- -----------------------------------------------------------------------------
-- 1. partner_notes テーブル
-- 自分が相手について記録するメモ。書いた本人以外（相手含む）は絶対に閲覧不可。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_notes (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    partner_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    note_text        TEXT,
    nickname_called  TEXT,
    birthday         DATE,
    preferences      TEXT,
    bottle_history   TEXT,
    next_visit_date  DATE,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (author_id, partner_id),
    CHECK (author_id <> partner_id)
);

COMMENT ON TABLE  public.partner_notes                    IS '相手について記録するメモ（書いた本人のみ閲覧可・両ロール共通）';
COMMENT ON COLUMN public.partner_notes.author_id          IS 'メモを書いた本人の users.id';
COMMENT ON COLUMN public.partner_notes.partner_id         IS 'メモ対象の相手の users.id';
COMMENT ON COLUMN public.partner_notes.note_text          IS '自由記述メモ';
COMMENT ON COLUMN public.partner_notes.nickname_called    IS '相手の呼び名（愛称）';
COMMENT ON COLUMN public.partner_notes.birthday           IS '相手の誕生日';
COMMENT ON COLUMN public.partner_notes.preferences        IS '相手の好み・特徴（好きなお酒・話題・NG など）';
COMMENT ON COLUMN public.partner_notes.bottle_history     IS 'ボトルキープ履歴（キャスト用途）';
COMMENT ON COLUMN public.partner_notes.next_visit_date    IS '次回来店予定日（キャスト用途）';

CREATE INDEX IF NOT EXISTS idx_partner_notes_author
    ON public.partner_notes (author_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_partner_notes_updated_at ON public.partner_notes;
CREATE TRIGGER trg_partner_notes_updated_at
    BEFORE UPDATE ON public.partner_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. meeting_records テーブル
-- 「会った記録」イベントログ。書いた本人のみ閲覧可。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meeting_records (
    id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    partner_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    met_at             TIMESTAMPTZ NOT NULL,
    place              TEXT,
    activities         TEXT,
    memo               TEXT,
    amount_spent       INTEGER,
    next_promise_at    TIMESTAMPTZ,
    next_promise_note  TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now(),
    CHECK (author_id <> partner_id)
);

COMMENT ON TABLE  public.meeting_records                     IS '会った記録（書いた本人のみ閲覧可・1ペアにつき複数件）';
COMMENT ON COLUMN public.meeting_records.author_id           IS '記録を書いた本人の users.id';
COMMENT ON COLUMN public.meeting_records.partner_id          IS '会った相手の users.id';
COMMENT ON COLUMN public.meeting_records.met_at              IS '会った日時';
COMMENT ON COLUMN public.meeting_records.place               IS '場所・店名';
COMMENT ON COLUMN public.meeting_records.activities          IS '一緒にしたこと';
COMMENT ON COLUMN public.meeting_records.memo                IS '自由メモ';
COMMENT ON COLUMN public.meeting_records.amount_spent        IS '金額（円）。客: 使った金額 / キャスト: 売上メモ';
COMMENT ON COLUMN public.meeting_records.next_promise_at     IS '次回の約束日時';
COMMENT ON COLUMN public.meeting_records.next_promise_note   IS '次回の約束の内容';

CREATE INDEX IF NOT EXISTS idx_meeting_records_author_met
    ON public.meeting_records (author_id, met_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_records_author_partner
    ON public.meeting_records (author_id, partner_id, met_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_records_promise
    ON public.meeting_records (author_id, next_promise_at)
    WHERE next_promise_at IS NOT NULL;

DROP TRIGGER IF EXISTS trg_meeting_records_updated_at ON public.meeting_records;
CREATE TRIGGER trg_meeting_records_updated_at
    BEFORE UPDATE ON public.meeting_records
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. RLS: 書いた本人のみ全操作可（相手からは一切見えない）
-- -----------------------------------------------------------------------------
ALTER TABLE public.partner_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_notes_select_own" ON public.partner_notes;
CREATE POLICY "partner_notes_select_own"
    ON public.partner_notes FOR SELECT TO authenticated
    USING (author_id = auth.uid());

DROP POLICY IF EXISTS "partner_notes_insert_own" ON public.partner_notes;
CREATE POLICY "partner_notes_insert_own"
    ON public.partner_notes FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "partner_notes_update_own" ON public.partner_notes;
CREATE POLICY "partner_notes_update_own"
    ON public.partner_notes FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "partner_notes_delete_own" ON public.partner_notes;
CREATE POLICY "partner_notes_delete_own"
    ON public.partner_notes FOR DELETE TO authenticated
    USING (author_id = auth.uid());

DROP POLICY IF EXISTS "meeting_records_select_own" ON public.meeting_records;
CREATE POLICY "meeting_records_select_own"
    ON public.meeting_records FOR SELECT TO authenticated
    USING (author_id = auth.uid());

DROP POLICY IF EXISTS "meeting_records_insert_own" ON public.meeting_records;
CREATE POLICY "meeting_records_insert_own"
    ON public.meeting_records FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "meeting_records_update_own" ON public.meeting_records;
CREATE POLICY "meeting_records_update_own"
    ON public.meeting_records FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "meeting_records_delete_own" ON public.meeting_records;
CREATE POLICY "meeting_records_delete_own"
    ON public.meeting_records FOR DELETE TO authenticated
    USING (author_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. customer_notes からのデータ移行 → 廃止
-- 未リリース（旧クライアント無し）のため、コピー後にそのまま DROP する。
-- -----------------------------------------------------------------------------
INSERT INTO public.partner_notes
    (id, author_id, partner_id, note_text, nickname_called, birthday,
     bottle_history, next_visit_date, created_at, updated_at)
SELECT id, cast_id, customer_id, note_text, nickname_called, birthday,
       bottle_history, next_visit_date, created_at, updated_at
FROM public.customer_notes
WHERE cast_id <> customer_id
ON CONFLICT (author_id, partner_id) DO NOTHING;

DROP TABLE IF EXISTS public.customer_notes;

-- -----------------------------------------------------------------------------
-- 5. push_tokens: 約束リマインダー通知設定
-- -----------------------------------------------------------------------------
ALTER TABLE public.push_tokens
    ADD COLUMN IF NOT EXISTS notification_meeting_reminders BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.push_tokens.notification_meeting_reminders
    IS '約束リマインダー通知の受信設定';
