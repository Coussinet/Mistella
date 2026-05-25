-- ============================================================
-- Mistella: DBマイグレーション 005
-- 目的: Supabase Storage バケットの RLS ポリシー設定
-- 実行手順:
--   Supabase Dashboard → SQL Editor にて本ファイルを実行
-- ============================================================

-- ============================================================
-- avatars バケット
-- ============================================================

-- 本人のフォルダにアップロード可（パス: {userId}/avatar.jpg）
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 本人のファイルを更新可（upsert）
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 全員が読み取り可（プロフィール画像を表示するため）
CREATE POLICY "avatars_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 本人のファイルを削除可
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- media バケット（タイムライン画像・動画）
-- ============================================================

CREATE POLICY "media_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "media_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "media_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
