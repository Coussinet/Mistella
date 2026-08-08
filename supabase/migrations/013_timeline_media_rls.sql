-- ============================================================
-- Mistella: タイムライン投稿・メディア用 RLS 修正
-- 画像投稿時の Storage RLS 違反を修正し、テーブル側の権限も明示する。
-- Storage パス: {auth.uid()}/timelines/{timestamp}.{ext}
-- ============================================================

-- media バケットを公開読み取り可能な状態で保証する。
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "media_insert_own" ON storage.objects;
CREATE POLICY "media_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "media_select_all" ON storage.objects;
CREATE POLICY "media_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- タイムライン本体。期限内の投稿と自分の投稿を閲覧可能にする。
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timelines_select_not_expired" ON public.timelines;
CREATE POLICY "timelines_select_not_expired"
  ON public.timelines FOR SELECT TO authenticated
  USING (expires_at > now() OR user_id = auth.uid());

DROP POLICY IF EXISTS "timelines_insert_own" ON public.timelines;
CREATE POLICY "timelines_insert_own"
  ON public.timelines FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "timelines_update_own" ON public.timelines;
CREATE POLICY "timelines_update_own"
  ON public.timelines FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "timelines_delete_own" ON public.timelines;
CREATE POLICY "timelines_delete_own"
  ON public.timelines FOR DELETE TO authenticated
  USING (user_id = auth.uid());
