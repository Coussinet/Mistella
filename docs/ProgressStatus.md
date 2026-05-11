# 開発進捗ドキュメント：Mistella

> **最終更新日**: 2026-05-11  
> **担当**: y.araya@crea-lp.com  
> **ステータス**: フロントエンド全機能実装完了・管理Webアプリ実装完了 / **Supabaseセットアップ・Edge Functionデプロイ待ち**

---

## 1. 実装完了済みの機能

### 1.1 認証・アカウント管理 ✅
- メール/パスワード新規登録
- ログイン・ログアウト
- パスワードリセット（メール送信）
- 登録時のロール選択（キャスト / 顧客）
- キャスト登録時の `cast_profiles` 初期レコード自動作成

### 1.2 プロフィール ✅
- アバター画像変更（Supabase Storage `avatars` バケット）
- ニックネーム・自己紹介編集
- キャスト用: 店舗名・住所・料金システム編集
- 他ユーザーのプロフィール閲覧（足跡自動記録）

### 1.3 タイムライン（24時間ストーリーズ） ✅
- テキスト・画像・動画（最大3秒）投稿
- 画像アップロード前の圧縮（600×600 / JPEG 品質0.7）
- 無限スクロール（ページネーション）
- Supabase Realtime によるリアルタイム新着表示
- 「〇時間後に消えます」カウントダウン表示
- 投稿削除機能

### 1.4 マッチング ✅
- いいね送信・取り消し
- 相互いいね → 自動マッチング（DBトリガー）
- マッチ一覧表示

### 1.5 ダイレクトメッセージ ✅
- テキスト・画像送信
- Supabase Realtime によるリアルタイム受信
- 既読処理
- 画面離脱時の自動 unsubscribe

### 1.6 お気に入り・足跡 ✅
- お気に入り追加・削除
- スワイプで削除（Swipeable）
- 足跡一覧（自分のプロフィールを見た人）

### 1.7 キャスト専用機能 ✅
- 出勤ステータス切り替え（出勤中 / 休憩中 / 退勤）
- 位置情報共有（±0.01度のオフセットでぼかし処理）
- 店舗情報管理（店舗名・住所・料金）
- 「今夜行ける？」リクエスト受信・承諾・辞退
- 顧客管理CRM（プライベートメモ・ボトル履歴・来店予定日・誕生日）
- 来店予定日3日以内・誕生日7日以内のリマインダー表示

### 1.8 顧客専用機能 ✅
- キャスト検索（キーワード・エリア・出勤状況・店舗名）
- **Sponsoredキャスト優先表示**（`is_sponsored=true`を上部にゴールド枠で表示）
- マップ表示（出勤中・位置情報ONのキャストをピン表示）
- 「今夜行ける？」アピール送信（お気に入り指定 / 特定キャスト / 現在地周辺一括）

### 1.9 プッシュ通知 ✅（コード実装済み / Supabaseデプロイ待ち）
- expo-notifications による端末トークン取得・保存（`push_tokens` テーブル）
- 通知設定画面（5種類のトグル: メッセージ / マッチング / いいね / 今夜リクエスト / 今夜返答）
- ProfileScreen → 「通知設定」メニュー経由でアクセス
- `notificationService.ts` でEdge Function `send-push-notification` を呼び出し
- 以下のイベントで自動通知:
  - メッセージ受信（`messageService.sendMessage`）
  - いいね受信（`matchService.sendLike`）
  - マッチング成立（`matchService.sendLike`）
  - 今夜リクエスト受信（`customerService.sendTonightRequest`）
  - 今夜リクエスト返答（`castService.updateTonightRequestStatus`）

### 1.10 ブロック・通報機能 ✅
- `blockService.ts`: ブロック追加・解除・確認
- `reportUser()`: 通報（理由4種: spam / inappropriate_content / harassment / other）
- `UserProfileScreen` ヘッダー右上の「…」ボタンからブロック・通報が可能
- ブロック後は自動で前画面に戻る
- 通報はモーダルで理由+補足コメント入力

### 1.11 管理Webアプリ（Mistella-admin） ✅（コード実装済み / Supabase設定・デプロイ待ち）
- Next.js 14 App Router + TypeScript + Tailwind CSS（`Mistella-admin/` ディレクトリ）
- `/login`: Supabase Auth + `users_admin` テーブルによる2段階管理者認証
- `/dashboard`: サマリー（ユーザー数・未対応通報数）
- `/dashboard/reports`: 通報一覧（ステータスフィルタ）・詳細・対応済み/却下処理
- `/dashboard/users/male`: 男性ユーザー一覧・プレミアム/ブロック編集
- `/dashboard/users/female`: 女性ユーザー一覧・プレミアム/ブロック編集
- `/dashboard/announcements`: お知らせ一覧・新規作成（一斉/個別プッシュ通知送信）
- `/dashboard/shops`: 店舗一覧・Sponsoredバッジ・料金情報編集

---

## 2. ファイル構成

```
Mistella/
├── App.tsx                          # エントリーポイント（セッション管理・プロフィール自動取得）
├── app.json                         # Expo設定
├── package.json                     # 依存パッケージ
├── tsconfig.json                    # TypeScript設定
├── babel.config.js
├── .env                             # ← Supabase URL/Key を設定する（要作成）
├── .env.example                     # 環境変数サンプル
├── assets/
│   └── images/                      # アプリアイコン・スプラッシュ（作成済み）
├── supabase/
│   ├── schema.sql                   # 初回DB定義・RLS・トリガー・pg_cron（未実行）
│   ├── migrations/
│   │   └── 001_push_block_report_admin.sql  # ★未実行: push_tokens/blocks/reports/announcements/users_admin
│   └── functions/
│       ├── send-push-notification/
│       │   └── index.ts             # ★未デプロイ: 個別プッシュ通知 Edge Function
│       └── send-announcement/
│           └── index.ts             # ★未デプロイ: 一斉/個別お知らせ Edge Function
├── Mistella-admin/                  # ★管理Webアプリ（Next.js 14）
│   ├── .env.local                   # ← Supabase URL/Key を設定する（要設定）
│   ├── package.json
│   ├── middleware.ts                # /dashboard/* 認証ガード
│   ├── lib/supabase/
│   │   ├── client.ts               # ブラウザ用クライアント
│   │   ├── server.ts               # サーバー用クライアント（cookies）
│   │   └── admin.ts                # サービスロールキー使用（Server Actionのみ）
│   ├── types/index.ts              # 管理画面の型定義
│   ├── components/
│   │   ├── Sidebar.tsx             # サイドナビ（ログアウトボタン付き）
│   │   ├── UserListPage.tsx        # ユーザー一覧共通コンポーネント
│   │   └── UserEditPage.tsx        # ユーザー編集共通コンポーネント（Server Action）
│   └── app/
│       ├── layout.tsx              # ダークテーマ・日本語
│       ├── login/page.tsx          # ログイン（2段階認証: Supabase Auth + users_admin）
│       └── dashboard/
│           ├── layout.tsx          # Sidebar + メインコンテンツ
│           ├── page.tsx            # サマリー
│           ├── reports/
│           │   ├── page.tsx        # 通報一覧（ステータスフィルタ）
│           │   └── [id]/page.tsx   # 通報詳細・対応
│           ├── users/
│           │   ├── male/page.tsx + [id]/page.tsx   # 男性ユーザー管理
│           │   └── female/page.tsx + [id]/page.tsx # 女性ユーザー管理
│           ├── announcements/
│           │   ├── page.tsx        # お知らせ一覧
│           │   └── new/page.tsx    # お知らせ作成（Edge Function呼び出し）
│           └── shops/
│               ├── page.tsx        # 店舗一覧
│               └── [userId]/page.tsx # 店舗編集（Sponsoredバッジ・料金）
└── src/
    ├── constants/
    │   └── colors.ts                # デザインカラー定数
    ├── lib/
    │   └── supabase.ts              # Supabaseクライアント（SecureStore永続化）
    ├── types/
    │   └── index.ts                 # 全TypeScript型定義（ReportReason等を含む）
    ├── store/
    │   ├── authStore.ts             # 認証状態（Zustand）
    │   └── appStore.ts              # 未読数など（Zustand）
    ├── services/
    │   ├── authService.ts           # 認証・プロフィールAPI
    │   ├── timelineService.ts       # タイムラインAPI
    │   ├── matchService.ts          # いいね・マッチ・キャスト検索API（通知送信含む）
    │   ├── messageService.ts        # メッセージAPI（Realtime購読含む・通知送信含む）
    │   ├── castService.ts           # キャスト専用API（出勤・CRM・今夜リクエスト・通知含む）
    │   ├── customerService.ts       # 顧客専用API（お気に入り・足跡・今夜送信・通知含む）
    │   ├── notificationService.ts   # プッシュ通知Edge Function呼び出し・トークン登録
    │   └── blockService.ts          # ブロック追加・解除・確認・通報
    ├── navigation/
    │   ├── AppNavigator.tsx         # ルートナビ（認証状態・role分岐）
    │   ├── AuthNavigator.tsx        # 認証フロー
    │   ├── CastTabNavigator.tsx     # キャスト用ボトムタブ（NotificationSettings接続済）
    │   └── CustomerTabNavigator.tsx # 顧客用ボトムタブ（NotificationSettings接続済）
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── common/
    │   │   ├── TimelineScreen.tsx
    │   │   ├── ProfileScreen.tsx    # 通知設定メニュー追加済み
    │   │   ├── EditProfileScreen.tsx
    │   │   ├── MatchesScreen.tsx
    │   │   ├── ChatScreen.tsx
    │   │   ├── FavoritesScreen.tsx
    │   │   ├── FootprintsScreen.tsx
    │   │   ├── UserProfileScreen.tsx # ブロック・通報UI追加済み
    │   │   └── NotificationSettingsScreen.tsx  # ★通知設定画面
    │   ├── cast/
    │   │   ├── WorkingStatusScreen.tsx
    │   │   ├── ShopInfoScreen.tsx
    │   │   ├── TonightRequestsScreen.tsx
    │   │   ├── CRMScreen.tsx
    │   │   └── CustomerNoteScreen.tsx
    │   └── customer/
    │       ├── CustomerHomeScreen.tsx
    │       ├── CastSearchScreen.tsx
    │       ├── MapScreen.tsx
    │       └── TonightSendScreen.tsx
    ├── components/
    │   ├── common/
    │   │   ├── Avatar.tsx           # アバター（頭文字フォールバック・オンラインドット）
    │   │   ├── Button.tsx           # ボタン（primary/secondary/ghost/danger）
    │   │   ├── StatusBadge.tsx      # ステータスバッジ
    │   │   └── LoadingSpinner.tsx   # ローディング
    │   ├── cast/
    │   │   ├── CastCard.tsx         # キャストカード（Sponsoredバッジ対応）
    │   │   └── WorkStatusToggle.tsx # 出勤ステータス切替ボタン
    │   ├── timeline/
    │   │   ├── TimelineItem.tsx     # 投稿アイテム
    │   │   └── TimelinePostForm.tsx # 投稿フォーム
    │   └── messages/
    │       └── MessageBubble.tsx    # メッセージバブル
    └── utils/
        ├── imageUtils.ts            # 画像圧縮・アップロード
        └── dateUtils.ts             # 日付フォーマット・リマインダー判定
```

---

## 3. 残作業（次のセッションで対応が必要な項目）

### 3.1 DBマイグレーション ⚠️ 最優先（未実行）
アプリの通知・ブロック・通報・管理画面機能が動作しない。

1. **`supabase/migrations/001_push_block_report_admin.sql` を実行**  
   Supabaseダッシュボード → SQL Editor → ファイルの全内容を貼り付けて Run  
   作成されるテーブル: `push_tokens`, `blocks`, `reports`, `announcements`, `users_admin`  
   追加カラム: `users.is_blocked`

2. **（初回セットアップが未完了の場合）`supabase/schema.sql` も先に実行**  
   Supabase Storage バケット `avatars`, `media` も Public で作成する  
   pg_cron拡張を有効化: Supabase → Database → Extensions → `pg_cron` Enable

3. **モバイルアプリの `.env` に URL/Key を記入**  
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

### 3.2 管理Webアプリのセットアップ ⚠️ 最優先

1. **`Mistella-admin/.env.local` に値を記入**  
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← Supabase → Settings → Data API → service_role
   ```
   > ⚠️ `SUPABASE_SERVICE_ROLE_KEY` は絶対にクライアント側に露出させないこと。Server Action内のみで使用。

2. **管理者アカウントの作成**  
   - Supabase Dashboard → Authentication → Users → 「Add user」でメール/PW登録  
   - 作成されたユーザーのUUIDを `users_admin` テーブルに INSERT:
   ```sql
   INSERT INTO public.users_admin (id, email, name)
   VALUES ('<auth.users の UUID>', 'admin@example.com', '管理者名');
   ```

3. **管理Webアプリの起動確認**  
   ```bash
   cd Mistella-admin
   npm install
   npm run dev
   # → http://localhost:3000/login でログイン画面が表示されること
   ```

### 3.3 Supabase Edge Functionのデプロイ ⚠️

```bash
# Supabase CLIのインストール（未インストールの場合）
brew install supabase/tap/supabase

# ログイン
supabase login

# プロジェクトリンク（プロジェクトのREF IDはDashboard → Settings → General で確認）
supabase link --project-ref <YOUR_PROJECT_REF>

# Edge Functionをデプロイ
supabase functions deploy send-push-notification
supabase functions deploy send-announcement
```

> デプロイ後、Supabase Dashboard → Edge Functions でステータスが「Active」になることを確認。

### 3.4 動作確認チェックリスト

| 機能 | 確認内容 |
|---|---|
| ログイン/登録 | Supabase Auth接続確認 |
| タイムライン | Realtime購読の動作確認 |
| チャット | Realtimeメッセージ受信確認 |
| マップ | 位置情報取得・ピン表示確認 |
| キャスト検索 | `is_sponsored`優先表示確認 |
| プッシュ通知 | 実機でトークン取得 → `push_tokens`テーブルにレコード作成確認（iOSシミュレーター不可）|
| 通知設定 | ProfileScreen → 「通知設定」遷移 → トグル切替がDBに反映 |
| ブロック | 他ユーザープロフィール「…」→「ブロックする」→ `blocks`テーブル確認 |
| 通報 | 「通報する」→ 理由選択 → `reports`テーブル確認 |
| 管理画面ログイン | `/login` で `users_admin` 登録済みアカウントでログイン |
| 管理画面通報 | 通報一覧に表示・「対応済み」ボタンでステータス変更 |
| 管理画面ユーザー | is_premium / is_blocked の切替が保存 |
| お知らせ通知 | 「送信する」→ Edge Functionが呼ばれプッシュ通知が届く |
| 店舗管理 | `is_sponsored` 変更後にキャスト検索画面でSponsored表示が変わる |

### 3.5 将来実装予定（設計・フラグは対応済み）
- **男性向けプレミアムプラン**（`is_premium`フラグはDB・型定義・管理画面に存在。課金フロー未実装）
- **今夜行ける？のマップ一括送信の位置情報精度向上**（現在は ±0.01度オフセット）

---

## 4. 既知の問題・対処済みの不具合

| 問題 | 原因 | 対処 |
|---|---|---|
| `npm run ios`で何も起動しない | `package.json`の`main`が`expo-router/entry`だった | `node_modules/expo/AppEntry.js`に修正済 |
| `EMFILE: too many open files` | macOSのファイル監視数上限 | `watchman`をHomebrewでインストール済 |
| `getLoadedFonts is not a function` | `@expo/vector-icons`のpeer depが`expo-font@55`を引き込んだ | `expo-font@~12.0.10`を直接指定して固定済 |
| IDE上の型エラー（モジュール未解決） | `node_modules`インストール前の状態 | `npm install`後に全て解消される |

---

## 5. 設計上の重要な決定事項

- **位置情報のぼかし**: `castService.updateLocation()` 内で緯度・経度に`±0.01`のランダムオフセットを追加。精度は約1km圏内。
- **Realtime接続の最適化**: `ChatScreen`・`MapScreen`・`TonightRequestsScreen`・`TimelineScreen`のみ接続し、画面離脱時に必ず`unsubscribe()`する。
- **タイムライン削除**: DBトリガーではなく`pg_cron`で毎時0分に`expires_at < now()`のレコードを物理削除（Supabase無料枠のStorage節約）。
- **マッチング**: `trg_likes_create_match`トリガーが相互いいね検出時に自動で`matches`テーブルにinsert（`SECURITY DEFINER`でRLSをバイパス）。
