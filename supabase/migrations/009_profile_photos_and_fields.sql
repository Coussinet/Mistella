-- ============================================================
-- Mistella: DBマイグレーション 009
-- 目的:
--   1. profile_photos テーブル新設（キャスト・お客様の複数写真、全員閲覧可）
--   2. cast_profiles に女性プロフィール項目を追加
--      （飲みべ drink_strength / 好きな歌 favorite_song / スタイル body_style）
--      ※ 好きなお酒 favorite_drink は 004 で追加済み
--   3. profile-photos Storage バケットの RLS
-- ============================================================

-- -----------------------------------------------------------------------------
-- 1. profile_photos テーブル
-- ユーザーが複数枚のプロフィール写真を登録できる。表示は全員可、編集は本人のみ。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_photos (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    photo_url   TEXT        NOT NULL,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.profile_photos            IS 'プロフィール写真（1ユーザーにつき複数枚・全員閲覧可）';
COMMENT ON COLUMN public.profile_photos.user_id    IS '写真の所有者 users.id';
COMMENT ON COLUMN public.profile_photos.photo_url  IS '写真の公開 URL';
COMMENT ON COLUMN public.profile_photos.sort_order IS '表示順（昇順）';

CREATE INDEX IF NOT EXISTS idx_profile_photos_user
    ON public.profile_photos (user_id, sort_order);

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_photos_select_all" ON public.profile_photos;
CREATE POLICY "profile_photos_select_all"
    ON public.profile_photos FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "profile_photos_insert_own" ON public.profile_photos;
CREATE POLICY "profile_photos_insert_own"
    ON public.profile_photos FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_photos_update_own" ON public.profile_photos;
CREATE POLICY "profile_photos_update_own"
    ON public.profile_photos FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_photos_delete_own" ON public.profile_photos;
CREATE POLICY "profile_photos_delete_own"
    ON public.profile_photos FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. cast_profiles に女性プロフィール項目を追加
-- -----------------------------------------------------------------------------
ALTER TABLE public.cast_profiles
    ADD COLUMN IF NOT EXISTS drink_strength TEXT,   -- 飲みべ（酒豪/高め/普通/弱い/飲めない）
    ADD COLUMN IF NOT EXISTS favorite_song  TEXT,   -- 好きな歌
    ADD COLUMN IF NOT EXISTS body_style     TEXT;   -- スタイル（スリム/やや細身/普通/グラマー/ぽっちゃり）

COMMENT ON COLUMN public.cast_profiles.drink_strength IS '飲みべ（酒豪/高め/普通/弱い/飲めない）';
COMMENT ON COLUMN public.cast_profiles.favorite_song  IS '好きな歌';
COMMENT ON COLUMN public.cast_profiles.body_style     IS 'スタイル（スリム/やや細身/普通/グラマー/ぽっちゃり）';

-- -----------------------------------------------------------------------------
-- 3. profile-photos Storage バケットの RLS
--    バケット自体は Supabase Dashboard で public 作成しておくこと。
--    パス構成: {userId}/{timestamp}.jpg
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profile_photos_storage_insert_own" ON storage.objects;
CREATE POLICY "profile_photos_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "profile_photos_storage_update_own" ON storage.objects;
CREATE POLICY "profile_photos_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "profile_photos_storage_select_all" ON storage.objects;
CREATE POLICY "profile_photos_storage_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "profile_photos_storage_delete_own" ON storage.objects;
CREATE POLICY "profile_photos_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
