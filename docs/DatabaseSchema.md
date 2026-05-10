# データベース定義書 (Database Schema) : YoruConnect

本ドキュメントは、Supabase (PostgreSQL) 上で構築するデータベースのテーブル設計です。プレミアムプラン（将来）や広告枠の実装を見据えた設計とします。

## 1. テーブル定義

### `users` (ユーザー基本情報)

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `id` | UUID | Primary Key | Supabase AuthのUIDと連携 |
| `role` | String | Not Null | `'cast'` または `'customer'` |
| `nickname` | String | Not Null | 表示名 |
| `avatar_url` | String | Nullable | プロフィール画像URL |
| `is_premium` | Boolean | Default false | 【将来実装用】プレミアム会員フラグ |
| `created_at` | Timestamp | Default now() | 登録日時 |

### `cast_profiles` (キャスト詳細情報)

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `user_id` | UUID | PK, FK(users.id) | キャストのユーザーID |
| `shop_name` | String | Nullable | 所属店舗名 |
| `is_sponsored` | Boolean | Default false | 【BtoB収益用】広告枠購入済の店舗/キャストフラグ |
| `is_working` | Boolean | Default false | 現在出勤中（オンライン）かどうか |
| `location_lat` | Float | Nullable | ぼかし処理済みの緯度 |
| `location_lng` | Float | Nullable | ぼかし処理済みの経度 |

### `timelines` (タイムライン投稿 - 24時間で消去)

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `id` | UUID | Primary Key | 投稿ID |
| `user_id` | UUID | FK(users.id) | 投稿者ID |
| `content` | Text | Nullable | 投稿テキスト |
| `media_url` | String | Nullable | 画像または動画(3秒)のURL |
| `expires_at` | Timestamp | Not Null | 削除予定日時 (created_at + 24h) |
| `created_at` | Timestamp | Default now() | 投稿日時 |

### `tonight_requests` (今夜行ける？機能)

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `id` | UUID | Primary Key | リクエストID |
| `customer_id` | UUID | FK(users.id) | 送信元（顧客） |
| `target_cast_id` | UUID | FK(users.id) | 送信先（指定した場合。NULLなら周辺ブロードキャスト等要検討） |
| `status` | String | Default 'sent' | `'sent'`, `'read'`, `'accepted'` 等 |
| `expires_at` | Timestamp | Not Null | リクエスト有効期限（当日営業終了まで等） |

### `matches` & `messages` (チャット機能)

- **`matches`**: `id`, `customer_id`, `cast_id`, `status`
- **`messages`**: `id`, `match_id`, `sender_id`, `content`, `created_at`

### `customer_notes` (キャスト向けCRM ＆ リマインダー)

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `id` | UUID | Primary Key | メモID |
| `cast_id` | UUID | FK(users.id) | メモ作成者 |
| `customer_id` | UUID | FK(users.id) | メモ対象の顧客 |
| `note_text` | Text | Nullable | 会話内容や特徴 |
| `next_visit_date` | Date | Nullable | 【リマインダー用】次回来店予定日 |
| `birthday` | Date | Nullable | 【リマインダー用】顧客の誕生日 |

## 2. RLS (Row Level Security) 設定方針

- Supabase無料枠でのセキュリティインシデントを防ぐため、厳格なRLSを設定する。
- **customer_notes**: `cast_id` がログインユーザーと一致する場合のみ SELECT/INSERT/UPDATE可能（顧客からは絶対に読み取れない）。