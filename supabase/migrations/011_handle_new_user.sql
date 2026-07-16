-- ============================================================
-- Mistella: DBマイグレーション 011
-- 目的: auth.users 作成時に public.users（＋キャストは cast_profiles）を
--       自動作成するトリガー。
--   - メールアドレス確認フローでは signUp 直後にセッションが無いため、
--     クライアントからの users INSERT はできない。SECURITY DEFINER の
--     トリガーで確実にプロフィール行を作成する。
--   - role / nickname は signUp 時の user_metadata から取得する。
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role     TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  v_nickname TEXT := COALESCE(NEW.raw_user_meta_data->>'nickname', 'ゲスト');
BEGIN
  -- role が不正な場合は customer にフォールバック
  IF v_role NOT IN ('cast', 'customer') THEN
    v_role := 'customer';
  END IF;

  INSERT INTO public.users (id, role, nickname, avatar_url, bio, is_premium)
  VALUES (NEW.id, v_role, v_nickname, NULL, NULL, false)
  ON CONFLICT (id) DO NOTHING;

  -- キャストは cast_profiles の初期行も作成
  IF v_role = 'cast' THEN
    INSERT INTO public.cast_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'auth.users 作成時に public.users（キャストは cast_profiles も）を自動作成する';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
