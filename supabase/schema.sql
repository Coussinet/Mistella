-- =============================================================================
-- YoruConnect PostgreSQL スキーマ定義
-- 作成日: 2026-05-11
-- 説明: キャストとお客様をつなぐマッチングアプリ「YoruConnect」のデータベーススキーマ
-- =============================================================================

-- pg_cron 拡張機能を有効化（期限切れタイムライン削除に使用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================================================
-- テーブル定義
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. users テーブル
-- Supabase auth.users と連携するアプリユーザー情報
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID        PRIMARY KEY,  -- auth.users.id と一致させる
    role        TEXT        NOT NULL CHECK (role IN ('cast', 'customer')),
    nickname    TEXT        NOT NULL,
    avatar_url  TEXT,
    bio         TEXT,
    is_premium  BOOLEAN     DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.users              IS 'アプリ利用者（キャスト・お客様）の基本プロフィール';
COMMENT ON COLUMN public.users.id          IS 'Supabase auth.users.id と同一の UUID';
COMMENT ON COLUMN public.users.role        IS 'ユーザー種別: cast（キャスト）/ customer（お客様）';
COMMENT ON COLUMN public.users.nickname    IS '表示ニックネーム';
COMMENT ON COLUMN public.users.avatar_url  IS 'プロフィール画像 URL';
COMMENT ON COLUMN public.users.bio         IS '自己紹介文';
COMMENT ON COLUMN public.users.is_premium  IS 'プレミアム会員フラグ';

-- -----------------------------------------------------------------------------
-- 2. cast_profiles テーブル
-- キャスト専用の詳細プロフィール（role='cast' のユーザーのみ持つ）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cast_profiles (
    user_id          UUID    PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    shop_name        TEXT,
    shop_address     TEXT,
    price_info       TEXT,
    is_sponsored     BOOLEAN DEFAULT false,
    is_working       BOOLEAN DEFAULT false,
    work_status      TEXT    DEFAULT 'off' CHECK (work_status IN ('working', 'break', 'off')),
    location_lat     FLOAT8,
    location_lng     FLOAT8,
    location_enabled BOOLEAN DEFAULT false,
    updated_at       TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.cast_profiles                  IS 'キャスト専用の詳細プロフィール情報';
COMMENT ON COLUMN public.cast_profiles.user_id         IS 'users.id への外部キー（キャストのみ）';
COMMENT ON COLUMN public.cast_profiles.shop_name       IS '所属店舗名';
COMMENT ON COLUMN public.cast_profiles.shop_address    IS '店舗住所';
COMMENT ON COLUMN public.cast_profiles.price_info      IS '料金情報テキスト';
COMMENT ON COLUMN public.cast_profiles.is_sponsored    IS 'スポンサー（広告掲載）フラグ';
COMMENT ON COLUMN public.cast_profiles.is_working      IS '現在出勤中かどうか';
COMMENT ON COLUMN public.cast_profiles.work_status     IS '勤務状態: working（出勤中）/ break（休憩中）/ off（退勤）';
COMMENT ON COLUMN public.cast_profiles.location_lat    IS '現在地の緯度（位置情報共有時のみ）';
COMMENT ON COLUMN public.cast_profiles.location_lng    IS '現在地の経度（位置情報共有時のみ）';
COMMENT ON COLUMN public.cast_profiles.location_enabled IS '位置情報の共有を有効にしているか';
COMMENT ON COLUMN public.cast_profiles.updated_at      IS '最終更新日時（トリガーで自動更新）';

-- -----------------------------------------------------------------------------
-- 3. timelines テーブル
-- キャスト・お客様が投稿する期限付き近況投稿
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timelines (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content     TEXT,
    media_url   TEXT,
    media_type  TEXT        CHECK (media_type IN ('image', 'video')),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.timelines              IS '期限付きタイムライン投稿（24時間で自動削除）';
COMMENT ON COLUMN public.timelines.id          IS 'タイムライン投稿 ID';
COMMENT ON COLUMN public.timelines.user_id     IS '投稿者の users.id';
COMMENT ON COLUMN public.timelines.content     IS '投稿テキスト本文';
COMMENT ON COLUMN public.timelines.media_url   IS '添付メディア（画像・動画）の URL';
COMMENT ON COLUMN public.timelines.media_type  IS 'メディア種別: image / video';
COMMENT ON COLUMN public.timelines.expires_at  IS '表示期限（この時刻を過ぎると非表示 → pg_cron で削除）';

-- -----------------------------------------------------------------------------
-- 4. likes テーブル
-- ユーザー間のいいね（相互いいねでマッチ成立）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (from_user_id, to_user_id)
);

COMMENT ON TABLE  public.likes                  IS 'ユーザー間のいいね。相互いいねで matches が自動作成される';
COMMENT ON COLUMN public.likes.id              IS 'いいね ID';
COMMENT ON COLUMN public.likes.from_user_id    IS 'いいねを送ったユーザーの users.id';
COMMENT ON COLUMN public.likes.to_user_id      IS 'いいねを受けたユーザーの users.id';

-- -----------------------------------------------------------------------------
-- 5. matches テーブル
-- 相互いいねが成立したペア（マッチ）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cast_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status      TEXT        DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (customer_id, cast_id)
);

COMMENT ON TABLE  public.matches                IS '相互いいねで成立したマッチペア';
COMMENT ON COLUMN public.matches.id            IS 'マッチ ID';
COMMENT ON COLUMN public.matches.customer_id   IS 'お客様側の users.id';
COMMENT ON COLUMN public.matches.cast_id       IS 'キャスト側の users.id';
COMMENT ON COLUMN public.matches.status        IS 'マッチ状態: active（有効）/ blocked（ブロック済み）';

-- -----------------------------------------------------------------------------
-- 6. messages テーブル
-- マッチ済みペア間のチャットメッセージ
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id   UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content    TEXT,
    image_url  TEXT,
    is_read    BOOLEAN     DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.messages               IS 'マッチ済みペア間のチャットメッセージ';
COMMENT ON COLUMN public.messages.id           IS 'メッセージ ID';
COMMENT ON COLUMN public.messages.match_id     IS '対象マッチの matches.id';
COMMENT ON COLUMN public.messages.sender_id    IS '送信者の users.id';
COMMENT ON COLUMN public.messages.content      IS 'テキストメッセージ本文';
COMMENT ON COLUMN public.messages.image_url    IS '送信画像の URL';
COMMENT ON COLUMN public.messages.is_read      IS '既読フラグ';

-- -----------------------------------------------------------------------------
-- 7. tonight_requests テーブル
-- お客様からキャストへの「今夜どう？」リクエスト
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tonight_requests (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_cast_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status         TEXT        DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'accepted', 'declined')),
    message        TEXT,
    expires_at     TIMESTAMPTZ NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.tonight_requests                  IS '「今夜どう？」リクエスト（お客様 → キャスト）';
COMMENT ON COLUMN public.tonight_requests.id              IS 'リクエスト ID';
COMMENT ON COLUMN public.tonight_requests.customer_id     IS 'リクエスト送信者（お客様）の users.id';
COMMENT ON COLUMN public.tonight_requests.target_cast_id  IS '送信先キャストの users.id';
COMMENT ON COLUMN public.tonight_requests.status          IS 'ステータス: sent / read / accepted / declined';
COMMENT ON COLUMN public.tonight_requests.message         IS 'リクエストに添えるメッセージ';
COMMENT ON COLUMN public.tonight_requests.expires_at      IS 'リクエストの有効期限';

-- -----------------------------------------------------------------------------
-- 8. customer_notes テーブル
-- キャストがお客様について記録するメモ（お客様は絶対に閲覧不可）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    cast_id          UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_id      UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    note_text        TEXT,
    next_visit_date  DATE,
    birthday         DATE,
    nickname_called  TEXT,
    bottle_history   TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (cast_id, customer_id)
);

COMMENT ON TABLE  public.customer_notes                     IS 'キャストがお客様について記録する秘密メモ（お客様は閲覧不可）';
COMMENT ON COLUMN public.customer_notes.id                 IS 'ノート ID';
COMMENT ON COLUMN public.customer_notes.cast_id            IS 'メモを書いたキャストの users.id';
COMMENT ON COLUMN public.customer_notes.customer_id        IS 'メモの対象お客様の users.id';
COMMENT ON COLUMN public.customer_notes.note_text          IS '自由記述メモ';
COMMENT ON COLUMN public.customer_notes.next_visit_date    IS '次回来店予定日';
COMMENT ON COLUMN public.customer_notes.birthday           IS 'お客様の誕生日';
COMMENT ON COLUMN public.customer_notes.nickname_called    IS 'お客様の呼び名（愛称）';
COMMENT ON COLUMN public.customer_notes.bottle_history     IS 'ボトルキープ履歴';
COMMENT ON COLUMN public.customer_notes.updated_at         IS '最終更新日時（トリガーで自動更新）';

-- -----------------------------------------------------------------------------
-- 9. favorites テーブル
-- ユーザーが他ユーザーをお気に入り登録する機能
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, target_user_id)
);

COMMENT ON TABLE  public.favorites                   IS 'お気に入り登録（一方向、相互不要）';
COMMENT ON COLUMN public.favorites.id               IS 'お気に入り ID';
COMMENT ON COLUMN public.favorites.user_id          IS 'お気に入りを登録したユーザーの users.id';
COMMENT ON COLUMN public.favorites.target_user_id   IS 'お気に入り登録されたユーザーの users.id';

-- -----------------------------------------------------------------------------
-- 10. footprints テーブル
-- プロフィールの閲覧足跡
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.footprints (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    visited_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.footprints                     IS 'プロフィール閲覧の足跡ログ';
COMMENT ON COLUMN public.footprints.id                 IS '足跡 ID';
COMMENT ON COLUMN public.footprints.visitor_id         IS '閲覧者の users.id';
COMMENT ON COLUMN public.footprints.visited_user_id    IS '閲覧されたユーザーの users.id';

-- =============================================================================
-- インデックス定義
-- 頻繁に検索・JOIN されるカラムにインデックスを設定してパフォーマンスを改善
-- =============================================================================

-- timelines: expires_at でのフィルタリングを高速化
CREATE INDEX IF NOT EXISTS idx_timelines_expires_at  ON public.timelines (expires_at);
-- timelines: 特定ユーザーの投稿一覧取得を高速化
CREATE INDEX IF NOT EXISTS idx_timelines_user_id     ON public.timelines (user_id);

-- likes: to_user_id を軸にした「誰が自分をいいねしているか」検索を高速化
CREATE INDEX IF NOT EXISTS idx_likes_to_user_id      ON public.likes (to_user_id);
-- likes: from_user_id を軸にした「自分が送ったいいね」検索を高速化
CREATE INDEX IF NOT EXISTS idx_likes_from_user_id    ON public.likes (from_user_id);

-- matches: customer_id / cast_id それぞれの一覧取得を高速化
CREATE INDEX IF NOT EXISTS idx_matches_customer_id   ON public.matches (customer_id);
CREATE INDEX IF NOT EXISTS idx_matches_cast_id       ON public.matches (cast_id);

-- messages: match_id を軸にしたチャット履歴取得を高速化
CREATE INDEX IF NOT EXISTS idx_messages_match_id     ON public.messages (match_id);
-- messages: 未読フィルタリングを高速化
CREATE INDEX IF NOT EXISTS idx_messages_is_read      ON public.messages (is_read) WHERE is_read = false;

-- tonight_requests: キャスト側の受信リクエスト一覧取得を高速化
CREATE INDEX IF NOT EXISTS idx_tonight_requests_target_cast_id ON public.tonight_requests (target_cast_id);
-- tonight_requests: expires_at でのフィルタリングを高速化
CREATE INDEX IF NOT EXISTS idx_tonight_requests_expires_at     ON public.tonight_requests (expires_at);

-- customer_notes: cast_id を軸にしたメモ一覧取得を高速化
CREATE INDEX IF NOT EXISTS idx_customer_notes_cast_id          ON public.customer_notes (cast_id);

-- footprints: 特定ユーザーへの足跡一覧取得を高速化
CREATE INDEX IF NOT EXISTS idx_footprints_visited_user_id      ON public.footprints (visited_user_id);

-- =============================================================================
-- トリガー関数定義
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at 自動更新関数
-- cast_profiles・customer_notes の updated_at を UPDATE 時に自動で now() に更新する
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS 'UPDATE 時に updated_at カラムを now() に自動設定する汎用トリガー関数';

-- cast_profiles の updated_at 自動更新トリガー
DROP TRIGGER IF EXISTS trg_cast_profiles_updated_at ON public.cast_profiles;
CREATE TRIGGER trg_cast_profiles_updated_at
    BEFORE UPDATE ON public.cast_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TRIGGER trg_cast_profiles_updated_at ON public.cast_profiles
    IS 'cast_profiles が更新されたとき updated_at を自動で更新する';

-- customer_notes の updated_at 自動更新トリガー
DROP TRIGGER IF EXISTS trg_customer_notes_updated_at ON public.customer_notes;
CREATE TRIGGER trg_customer_notes_updated_at
    BEFORE UPDATE ON public.customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TRIGGER trg_customer_notes_updated_at ON public.customer_notes
    IS 'customer_notes が更新されたとき updated_at を自動で更新する';

-- -----------------------------------------------------------------------------
-- 相互いいねによるマッチ自動作成トリガー
-- likes に INSERT されたとき、相手からのいいねがすでに存在していれば
-- matches テーブルに自動でレコードを挿入する
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- RLS をバイパスして matches を挿入するため SECURITY DEFINER を使用
AS $$
DECLARE
    v_customer_id UUID;
    v_cast_id     UUID;
    v_from_role   TEXT;
    v_to_role     TEXT;
BEGIN
    -- 相手からのいいねが存在するか確認（相互いいねの検出）
    IF EXISTS (
        SELECT 1 FROM public.likes
        WHERE from_user_id = NEW.to_user_id
          AND to_user_id   = NEW.from_user_id
    ) THEN
        -- 双方のロールを取得して customer_id / cast_id を正しく割り当てる
        SELECT role INTO v_from_role FROM public.users WHERE id = NEW.from_user_id;
        SELECT role INTO v_to_role   FROM public.users WHERE id = NEW.to_user_id;

        IF v_from_role = 'customer' AND v_to_role = 'cast' THEN
            v_customer_id := NEW.from_user_id;
            v_cast_id     := NEW.to_user_id;
        ELSIF v_from_role = 'cast' AND v_to_role = 'customer' THEN
            v_customer_id := NEW.to_user_id;
            v_cast_id     := NEW.from_user_id;
        ELSE
            -- 同ロール同士のいいねはマッチを作成しない
            RETURN NEW;
        END IF;

        -- matches に INSERT（重複は無視）
        INSERT INTO public.matches (customer_id, cast_id)
        VALUES (v_customer_id, v_cast_id)
        ON CONFLICT (customer_id, cast_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_match_on_mutual_like IS
    '相互いいね検出時に matches を自動作成するトリガー関数。'
    'SECURITY DEFINER により RLS をバイパスして matches を挿入する。';

-- likes への INSERT 後にマッチ作成トリガーを実行
DROP TRIGGER IF EXISTS trg_likes_create_match ON public.likes;
CREATE TRIGGER trg_likes_create_match
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.create_match_on_mutual_like();

COMMENT ON TRIGGER trg_likes_create_match ON public.likes
    IS 'likes に INSERT されたとき、相互いいねが揃っていれば matches を自動作成する';

-- =============================================================================
-- Row Level Security (RLS) 設定
-- 全テーブルで RLS を有効にし、ユーザーが自分のデータのみ操作できるよう制限する
-- =============================================================================

-- =============================================================================
-- RLS: users
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが他のユーザーのプロフィールを閲覧可能
CREATE POLICY "users_select_all"
    ON public.users FOR SELECT
    USING (true);

-- 自分自身のレコードのみ INSERT 可能（auth.uid() と一致する id のみ）
CREATE POLICY "users_insert_own"
    ON public.users FOR INSERT
    WITH CHECK (id = auth.uid());

-- 自分自身のレコードのみ UPDATE 可能
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =============================================================================
-- RLS: cast_profiles
-- =============================================================================
ALTER TABLE public.cast_profiles ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがキャストプロフィールを閲覧可能
CREATE POLICY "cast_profiles_select_all"
    ON public.cast_profiles FOR SELECT
    USING (true);

-- 自分自身のキャストプロフィールのみ INSERT 可能
CREATE POLICY "cast_profiles_insert_own"
    ON public.cast_profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 自分自身のキャストプロフィールのみ UPDATE 可能
CREATE POLICY "cast_profiles_update_own"
    ON public.cast_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- RLS: timelines
-- =============================================================================
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;

-- 有効期限内の投稿は全員が閲覧可能
CREATE POLICY "timelines_select_not_expired"
    ON public.timelines FOR SELECT
    USING (expires_at > now());

-- 自分の投稿のみ INSERT 可能
CREATE POLICY "timelines_insert_own"
    ON public.timelines FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 自分の投稿のみ UPDATE 可能
CREATE POLICY "timelines_update_own"
    ON public.timelines FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 自分の投稿のみ DELETE 可能
CREATE POLICY "timelines_delete_own"
    ON public.timelines FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- RLS: likes
-- =============================================================================
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがいいね一覧を閲覧可能（誰が誰にいいねしたか）
CREATE POLICY "likes_select_all"
    ON public.likes FOR SELECT
    USING (true);

-- 自分が送信者のいいねのみ INSERT 可能
CREATE POLICY "likes_insert_own"
    ON public.likes FOR INSERT
    WITH CHECK (from_user_id = auth.uid());

-- 自分が送ったいいねのみ DELETE 可能（いいね取消）
CREATE POLICY "likes_delete_own"
    ON public.likes FOR DELETE
    USING (from_user_id = auth.uid());

-- =============================================================================
-- RLS: matches
-- =============================================================================
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 自分が参加しているマッチのみ閲覧可能（customer または cast として）
CREATE POLICY "matches_select_participant"
    ON public.matches FOR SELECT
    USING (
        customer_id = auth.uid()
        OR cast_id  = auth.uid()
    );

-- INSERT はマッチ作成トリガー（SECURITY DEFINER）経由のみ許可
-- 通常ユーザーからの直接 INSERT は禁止するためポリシーを設けない
-- ※ アプリロジック上、マッチはいいねトリガーによってのみ作成される

-- =============================================================================
-- RLS: messages
-- =============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 自分が参加するマッチのメッセージのみ閲覧可能
CREATE POLICY "messages_select_participant"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = messages.match_id
              AND (m.customer_id = auth.uid() OR m.cast_id = auth.uid())
        )
    );

-- 自分が送信者のメッセージのみ INSERT 可能
CREATE POLICY "messages_insert_own"
    ON public.messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_id
              AND (m.customer_id = auth.uid() OR m.cast_id = auth.uid())
              AND m.status = 'active'
        )
    );

-- =============================================================================
-- RLS: tonight_requests
-- =============================================================================
ALTER TABLE public.tonight_requests ENABLE ROW LEVEL SECURITY;

-- 自分が受信者（キャスト）または送信者（お客様）のリクエストのみ閲覧可能
CREATE POLICY "tonight_requests_select_own"
    ON public.tonight_requests FOR SELECT
    USING (
        target_cast_id = auth.uid()
        OR customer_id = auth.uid()
    );

-- 自分が customer_id のリクエストのみ送信（INSERT）可能
CREATE POLICY "tonight_requests_insert_own"
    ON public.tonight_requests FOR INSERT
    WITH CHECK (customer_id = auth.uid());

-- 受信者（キャスト）のみリクエストのステータスを更新可能（承認・辞退）
CREATE POLICY "tonight_requests_update_target_cast"
    ON public.tonight_requests FOR UPDATE
    USING (target_cast_id = auth.uid())
    WITH CHECK (target_cast_id = auth.uid());

-- =============================================================================
-- RLS: customer_notes
-- 重要: キャスト本人のみアクセス可能。お客様は絶対に読み書き不可。
-- =============================================================================
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- キャスト本人のみ自分のメモを閲覧可能（お客様は閲覧不可）
CREATE POLICY "customer_notes_select_cast_own"
    ON public.customer_notes FOR SELECT
    USING (cast_id = auth.uid());

-- キャスト本人のみメモを作成可能
CREATE POLICY "customer_notes_insert_cast_own"
    ON public.customer_notes FOR INSERT
    WITH CHECK (cast_id = auth.uid());

-- キャスト本人のみメモを更新可能
CREATE POLICY "customer_notes_update_cast_own"
    ON public.customer_notes FOR UPDATE
    USING (cast_id = auth.uid())
    WITH CHECK (cast_id = auth.uid());

-- キャスト本人のみメモを削除可能
CREATE POLICY "customer_notes_delete_cast_own"
    ON public.customer_notes FOR DELETE
    USING (cast_id = auth.uid());

-- =============================================================================
-- RLS: favorites
-- =============================================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 自分のお気に入り一覧のみ閲覧可能
CREATE POLICY "favorites_select_own"
    ON public.favorites FOR SELECT
    USING (user_id = auth.uid());

-- 自分が登録者のお気に入りのみ INSERT 可能
CREATE POLICY "favorites_insert_own"
    ON public.favorites FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 自分が登録したお気に入りのみ削除可能
CREATE POLICY "favorites_delete_own"
    ON public.favorites FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- RLS: footprints
-- =============================================================================
ALTER TABLE public.footprints ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールに来た足跡のみ閲覧可能
CREATE POLICY "footprints_select_visited"
    ON public.footprints FOR SELECT
    USING (visited_user_id = auth.uid());

-- 全認証ユーザーが足跡を残せる（INSERT 可能）
CREATE POLICY "footprints_insert_authenticated"
    ON public.footprints FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- pg_cron ジョブ設定
-- 期限切れタイムライン投稿を毎時削除する
-- =============================================================================

-- 既存のジョブが存在する場合は削除してから再登録する
SELECT cron.unschedule('delete-expired-timelines')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-timelines'
);

-- 毎時0分に期限切れ（expires_at < now()）のタイムライン投稿を削除
SELECT cron.schedule(
    'delete-expired-timelines',  -- ジョブ名
    '0 * * * *',                 -- cron 式: 毎時0分
    'DELETE FROM public.timelines WHERE expires_at < now()'
);

-- =============================================================================
-- Realtime 設定
-- メッセージ・マッチング関連テーブルをリアルタイム購読対象に追加
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tonight_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timelines;
