-- ============================================================
-- Mistella: DBマイグレーション
-- 目的: プッシュ通知、ブロック、通報、お知らせ機能のテーブル追加
-- 実行手順:
--   1. Supabase Dashboard → SQL Editor にて本ファイルを実行
--   2. または: supabase db push コマンドで自動実行
-- ============================================================

-- ============================================================
-- 既存テーブル変更
-- ============================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- ============================================================
-- 新規テーブル
-- ============================================================

-- 管理者テーブル（public.usersとは完全分離）
CREATE TABLE IF NOT EXISTS public.users_admin (
	id         UUID PRIMARY KEY,  -- auth.users.id と一致
	email      TEXT NOT NULL UNIQUE,
	name       TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users_admin ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = 一般ユーザーからの全操作を拒否。管理Webはservice_role keyでバイパス。

-- プッシュ通知トークン
CREATE TABLE IF NOT EXISTS public.push_tokens (
	id                              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id                         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	token                           TEXT        NOT NULL UNIQUE,
	platform                        TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),
	notification_messages           BOOLEAN     DEFAULT true,
	notification_matches            BOOLEAN     DEFAULT true,
	notification_likes              BOOLEAN     DEFAULT true,
	notification_tonight_requests   BOOLEAN     DEFAULT true,
	notification_tonight_responses  BOOLEAN     DEFAULT true,
	created_at                      TIMESTAMPTZ DEFAULT now(),
	updated_at                      TIMESTAMPTZ DEFAULT now()
);

-- ブロック
CREATE TABLE IF NOT EXISTS public.blocks (
	id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
	blocker_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	blocked_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT now(),
	UNIQUE (blocker_id, blocked_id),
	CONSTRAINT blocks_no_self_block CHECK (blocker_id != blocked_id)
);

-- 通報
CREATE TABLE IF NOT EXISTS public.reports (
	id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
	reporter_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	reported_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	reason           TEXT        NOT NULL CHECK (reason IN ('spam','inappropriate_content','harassment','other')),
	detail           TEXT,
	status           TEXT        DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
	created_at       TIMESTAMPTZ DEFAULT now(),
	reviewed_at      TIMESTAMPTZ,
	reviewed_by      UUID        REFERENCES public.users_admin(id) ON DELETE SET NULL,
	CONSTRAINT reports_no_self_report CHECK (reporter_id != reported_user_id)
);

-- お知らせ通知
CREATE TABLE IF NOT EXISTS public.announcements (
	id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
	title          TEXT        NOT NULL,
	body           TEXT        NOT NULL,
	target_type    TEXT        NOT NULL CHECK (target_type IN ('all_male','all_female','individual')),
	target_user_id UUID        REFERENCES public.users(id) ON DELETE SET NULL,
	sent_at        TIMESTAMPTZ,
	created_by     UUID        NOT NULL REFERENCES public.users_admin(id),
	created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id  ON public.push_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id     ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id     ON public.blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_status        ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports (reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);

-- ============================================================
-- push_tokens の updated_at 自動更新トリガー
-- ============================================================

DROP TRIGGER IF EXISTS trg_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trg_push_tokens_updated_at
	BEFORE UPDATE ON public.push_tokens
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS: ブロック・管理者ブロック対応
-- ============================================================

-- schema.sql の既存ポリシーを置き換える
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- users: ブロックされたユーザーを非表示
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
	FOR SELECT USING (
		is_blocked = false
		AND NOT EXISTS (
			SELECT 1 FROM public.blocks
			WHERE blocker_id = auth.uid() AND blocked_id = id
		)
		AND NOT EXISTS (
			SELECT 1 FROM public.blocks
			WHERE blocked_id = auth.uid() AND blocker_id = id
		)
	);

DROP POLICY IF EXISTS users_update_own_policy ON public.users;
CREATE POLICY users_update_own_policy ON public.users
	FOR UPDATE USING (id = auth.uid())
	WITH CHECK (id = auth.uid());

-- push_tokens: 本人のみ読み書き可
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_select_policy ON public.push_tokens;
CREATE POLICY push_tokens_select_policy ON public.push_tokens
	FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_insert_policy ON public.push_tokens;
CREATE POLICY push_tokens_insert_policy ON public.push_tokens
	FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_update_policy ON public.push_tokens;
CREATE POLICY push_tokens_update_policy ON public.push_tokens
	FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_delete_policy ON public.push_tokens;
CREATE POLICY push_tokens_delete_policy ON public.push_tokens
	FOR DELETE USING (user_id = auth.uid());

-- blocks: 本人のみ読み書き可
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blocks_select_policy ON public.blocks;
CREATE POLICY blocks_select_policy ON public.blocks
	FOR SELECT USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS blocks_insert_policy ON public.blocks;
CREATE POLICY blocks_insert_policy ON public.blocks
	FOR INSERT WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS blocks_delete_policy ON public.blocks;
CREATE POLICY blocks_delete_policy ON public.blocks
	FOR DELETE USING (blocker_id = auth.uid());

-- reports: 本人が書いたものを読める、誰でも作成可
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_insert_policy ON public.reports;
CREATE POLICY reports_insert_policy ON public.reports
	FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS reports_select_own_policy ON public.reports;
CREATE POLICY reports_select_own_policy ON public.reports
	FOR SELECT USING (reporter_id = auth.uid());

-- announcements: 認証済みユーザーは読み取り可（管理者が書き込む）
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select_policy ON public.announcements;
CREATE POLICY announcements_select_policy ON public.announcements
	FOR SELECT USING (
		auth.uid() IS NOT NULL
		AND (
			target_type IN ('all_male', 'all_female')
			OR target_user_id = auth.uid()
		)
	);
