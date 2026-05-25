-- ============================================================
-- Mistella: DBマイグレーション 002
-- 目的: キャスト・顧客のプロフィール項目追加
-- 実行手順:
--   Supabase Dashboard → SQL Editor にて本ファイルを実行
-- ============================================================

-- ============================================================
-- cast_profiles にプロフィール項目を追加
-- ============================================================

ALTER TABLE public.cast_profiles
  ADD COLUMN IF NOT EXISTS age          INTEGER CHECK (age > 0 AND age < 100),
  ADD COLUMN IF NOT EXISTS height       INTEGER CHECK (height > 100 AND height < 250),
  ADD COLUMN IF NOT EXISTS blood_type   TEXT CHECK (blood_type IN ('A','B','O','AB','不明')),
  ADD COLUMN IF NOT EXISTS hobbies      TEXT,
  ADD COLUMN IF NOT EXISTS personality  TEXT,
  ADD COLUMN IF NOT EXISTS charm_point  TEXT;

-- ============================================================
-- customer_profiles テーブル（男性顧客用プロフィール）
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  user_id        UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  age            INTEGER     CHECK (age > 0 AND age < 100),
  occupation     TEXT,
  annual_income  TEXT,
  hobbies        TEXT,
  preferred_area TEXT,
  appeal_message TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーなら閲覧可
DROP POLICY IF EXISTS customer_profiles_select ON public.customer_profiles;
CREATE POLICY customer_profiles_select ON public.customer_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 本人のみ作成・更新
DROP POLICY IF EXISTS customer_profiles_insert ON public.customer_profiles;
CREATE POLICY customer_profiles_insert ON public.customer_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS customer_profiles_update ON public.customer_profiles;
CREATE POLICY customer_profiles_update ON public.customer_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- updated_at 自動更新トリガー
DROP TRIGGER IF EXISTS trg_customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER trg_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
