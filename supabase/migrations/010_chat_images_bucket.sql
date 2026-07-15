-- ============================================================
-- Mistella: DBマイグレーション 010
-- 目的: chat-images バケットの RLS
--   チャットの画像メッセージ用。パス構成: {senderId}/{matchId}/{timestamp}.jpg
--   バケット自体は Supabase Dashboard または API で public 作成しておくこと。
-- ============================================================

DROP POLICY IF EXISTS "chat_images_insert_own" ON storage.objects;
CREATE POLICY "chat_images_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "chat_images_update_own" ON storage.objects;
CREATE POLICY "chat_images_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "chat_images_select_all" ON storage.objects;
CREATE POLICY "chat_images_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "chat_images_delete_own" ON storage.objects;
CREATE POLICY "chat_images_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
