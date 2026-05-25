-- ============================================================
-- Mistella: DBマイグレーション 004
-- 目的: キャストプロフィールのアピール項目を追加
-- 実行手順:
--   Supabase Dashboard → SQL Editor にて本ファイルを実行
-- ============================================================

ALTER TABLE public.cast_profiles
  ADD COLUMN IF NOT EXISTS favorite_drink   TEXT,  -- 得意なお酒・飲み方
  ADD COLUMN IF NOT EXISTS service_style    TEXT,  -- 接客スタイル
  ADD COLUMN IF NOT EXISTS favorite_topics  TEXT,  -- 得意な話題
  ADD COLUMN IF NOT EXISTS activities       TEXT,  -- 一緒にやりたいこと
  ADD COLUMN IF NOT EXISTS customer_message TEXT,  -- お客様への一言
  ADD COLUMN IF NOT EXISTS hometown         TEXT,  -- 出身地
  ADD COLUMN IF NOT EXISTS motto            TEXT;  -- 座右の銘・好きな言葉
