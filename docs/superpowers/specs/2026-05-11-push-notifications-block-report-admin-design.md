# 設計ドキュメント: プッシュ通知・ブロック/通報・管理Webアプリ

> 作成日: 2026-05-11  
> ステータス: 承認済み

---

## 概要

3つのフェーズに分けて実装する。

| Phase | 内容 |
|---|---|
| Phase 1 | DBスキーマ追加（push_tokens / blocks / reports / announcements / users_admin） |
| Phase 2 | プッシュ通知（モバイル側 + Supabase Edge Function + 通知設定画面） |
| Phase 3 | ブロック・通報（モバイル側） + 管理Webアプリ（Next.js） |

---

## Phase 1: DBスキーマ

### 新規テーブル

#### `users_admin`
管理者専用テーブル。`public.users` とは完全分離。Supabase Auth の auth.users.id と紐づく。

```sql
id          UUID PRIMARY KEY  -- auth.users.id と一致
email       TEXT NOT NULL UNIQUE
name        TEXT NOT NULL
created_at  TIMESTAMPTZ DEFAULT now()
```

#### `push_tokens`
デバイスのプッシュ通知トークンと、通知種別ごとのON/OFFフラグ。

```sql
id                              UUID PRIMARY KEY
user_id                         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
token                           TEXT NOT NULL UNIQUE
platform                        TEXT CHECK (platform IN ('ios', 'android'))
notification_messages           BOOLEAN DEFAULT true
notification_matches            BOOLEAN DEFAULT true
notification_likes              BOOLEAN DEFAULT true
notification_tonight_requests   BOOLEAN DEFAULT true
notification_tonight_responses  BOOLEAN DEFAULT true
created_at                      TIMESTAMPTZ DEFAULT now()
updated_at                      TIMESTAMPTZ DEFAULT now()
```

#### `blocks`
ユーザー間のブロック関係。

```sql
id          UUID PRIMARY KEY
blocker_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
blocked_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
created_at  TIMESTAMPTZ DEFAULT now()
UNIQUE(blocker_id, blocked_id)
```

#### `reports`
通報記録。管理者が対応ステータスを更新する。

```sql
id               UUID PRIMARY KEY
reporter_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
reason           TEXT NOT NULL CHECK (reason IN ('spam','inappropriate_content','harassment','other'))
detail           TEXT
status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed'))
created_at       TIMESTAMPTZ DEFAULT now()
reviewed_at      TIMESTAMPTZ
reviewed_by      UUID REFERENCES public.users_admin(id)
```

#### `announcements`
管理者が送るお知らせ通知の記録。

```sql
id              UUID PRIMARY KEY
title           TEXT NOT NULL
body            TEXT NOT NULL
target_type     TEXT NOT NULL CHECK (target_type IN ('all_male','all_female','individual'))
target_user_id  UUID REFERENCES public.users(id)  -- individual のみ
sent_at         TIMESTAMPTZ
created_by      UUID NOT NULL REFERENCES public.users_admin(id)
created_at      TIMESTAMPTZ DEFAULT now()
```

### 既存テーブルへの変更

```sql
-- users テーブルに管理者ブロックフラグを追加
ALTER TABLE public.users ADD COLUMN is_blocked BOOLEAN DEFAULT false;
```

### RLSポリシー（ブロック対応）

以下のテーブルのSELECTポリシーに「ブロック関係のある相手は除外」を追加する：
- `public.users`
- `public.timelines`
- `public.cast_profiles`
- `public.tonight_requests`
- `public.likes`
- `public.footprints`

双方向（自分がブロックした相手 & 自分をブロックした相手）を除外する。

`is_blocked=true` のユーザーはすべてのRLSで除外する。

---

## Phase 2: プッシュ通知

### アーキテクチャ

```
モバイルアプリ                    Supabase                    Expo Push Service
     │                               │                               │
     ├─ 起動時にトークン取得 ──────→ push_tokens に保存              │
     │                               │                               │
     │              DBトリガー発火 ──┤                               │
     │  (messages/matches/likes/tonight_requests INSERT/UPDATE)      │
     │                               ├─ Edge Function 呼び出し ────→ │
     │                               │   send-push-notification       │
     │ ←── プッシュ通知受信 ─────────────────────────────────────── │
```

### 通知トリガー一覧

| イベント | テーブル | 操作 | 受信者 | 設定フラグ |
|---|---|---|---|---|
| 新メッセージ | messages | INSERT | 相手側ユーザー | notification_messages |
| マッチング成立 | matches | INSERT | 両ユーザー | notification_matches |
| いいね受信 | likes | INSERT | to_user_id | notification_likes |
| 今夜リクエスト受信 | tonight_requests | INSERT | キャスト | notification_tonight_requests |
| 今夜リクエスト承諾/辞退 | tonight_requests | UPDATE(status) | 顧客 | notification_tonight_responses |

### Supabase Edge Function

`supabase/functions/send-push-notification/index.ts`
- DBトリガー（pg_net）または直接呼び出しで起動
- `push_tokens` から対象ユーザーのトークンを取得（通知設定ONのもののみ）
- Expo Push API（`https://exp.host/--/api/v2/push/send`）にPOST

`supabase/functions/send-announcement/index.ts`
- 管理Webから呼び出し
- `target_type` に応じて `push_tokens` を一括取得して送信
- 送信後 `announcements.sent_at` を更新

### モバイル側の変更ファイル

| ファイル | 内容 |
|---|---|
| `src/services/notificationService.ts` (新規) | トークン取得・Supabase保存・更新 |
| `App.tsx` | ログイン後にトークン登録処理を追加 |
| `src/screens/common/NotificationSettingsScreen.tsx` (新規) | 通知ON/OFF設定UI |
| `src/navigation/CastTabNavigator.tsx` | NotificationSettings へのルート追加 |
| `src/navigation/CustomerTabNavigator.tsx` | NotificationSettings へのルート追加 |
| `src/types/index.ts` | PushToken型・ナビゲーション型追加 |

---

## Phase 3: ブロック・通報 + 管理Webアプリ

### モバイル側

**UIエントリーポイント**
- `UserProfileScreen` 右上に「…」メニューボタン追加
- メニュー：「ブロックする」「通報する」

**通報フロー**
```
「通報する」タップ
  → 理由選択モーダル（スパム / 不適切なコンテンツ / 嫌がらせ / その他）
  → 補足テキスト入力（任意、200文字以内）
  → 送信 → reports テーブルに INSERT
  → 完了アラート（「通報を受け付けました」）
```

**ブロックフロー**
```
「ブロックする」タップ
  → 確認アラート（「ブロックしますか？」）
  → blocks テーブルに INSERT
  → 前画面に戻る（RLSにより以降全クエリから自動除外）
```

| ファイル | 内容 |
|---|---|
| `src/services/blockService.ts` (新規) | ブロック・通報API |
| `src/screens/common/UserProfileScreen.tsx` | 「…」メニュー追加 |

### 管理Webアプリ（Next.js）

**ディレクトリ**: `Mistella-admin/`（リポジトリ直下）

**技術スタック**
- Next.js 14（App Router）
- TypeScript
- Tailwind CSS
- `@supabase/ssr`（サーバーサイドセッション管理）

**認証フロー**
```
ログイン画面（/login）
  → Supabase Auth でサインイン（メール/PW）
  → users_admin テーブルにIDが存在するか確認
  → 存在しない → エラー「管理者権限がありません」
  → 存在する  → /dashboard にリダイレクト
middleware.ts で全 /dashboard/* ルートを保護
```

**ページ構成**

```
/login                          # ログイン
/dashboard                      # サマリー（通報数・ユーザー数・未対応件数）
/dashboard/reports              # 通報一覧（ステータスフィルタ）
/dashboard/reports/[id]         # 通報詳細・ステータス更新
/dashboard/users/male           # 男性(customer)一覧・検索
/dashboard/users/male/[id]      # 編集・ブロック・プレミアムON/OFF
/dashboard/users/female         # 女性(cast)一覧・検索
/dashboard/users/female/[id]    # 編集・ブロック・プレミアムON/OFF・キャストプロフィール
/dashboard/announcements        # お知らせ一覧（送信済み）
/dashboard/announcements/new    # お知らせ作成（送信先選択・本文入力・送信）
/dashboard/shops                # 店舗一覧（cast_profiles）
/dashboard/shops/[userId]       # 店舗情報編集（店舗名・住所・料金・sponsored）
```

**各ページの主要機能**

| ページ | 機能 |
|---|---|
| ユーザー一覧 | ニックネーム・メール・登録日・ステータスで検索・フィルタ |
| ユーザー編集 | ニックネーム・bio変更、is_premium / is_blocked トグル |
| 通報一覧 | pending/reviewed/dismissed フィルタ、日時ソート |
| 通報詳細 | 報告者・被報告者プロフィール表示、ステータス更新 |
| お知らせ作成 | 男性全員 / 女性全員 / 個別ユーザー選択、タイトル・本文入力、Edge Function 呼び出し |
| 店舗編集 | 店舗名・住所・料金・is_sponsored 編集 |
