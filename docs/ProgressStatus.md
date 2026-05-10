# 開発進捗ドキュメント：YoruConnect

> **最終更新日**: 2026-05-11  
> **担当**: y.araya@crea-lp.com  
> **ステータス**: フロントエンド全機能実装完了 / Supabaseセットアップ待ち

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

---

## 2. ファイル構成

```
YoruConnect/
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
│   └── schema.sql                   # DB定義・RLS・トリガー・pg_cron（未実行）
└── src/
    ├── constants/
    │   └── colors.ts                # デザインカラー定数
    ├── lib/
    │   └── supabase.ts              # Supabaseクライアント（SecureStore永続化）
    ├── types/
    │   └── index.ts                 # 全TypeScript型定義
    ├── store/
    │   ├── authStore.ts             # 認証状態（Zustand）
    │   └── appStore.ts              # 未読数など（Zustand）
    ├── services/
    │   ├── authService.ts           # 認証・プロフィールAPI
    │   ├── timelineService.ts       # タイムラインAPI
    │   ├── matchService.ts          # いいね・マッチ・キャスト検索API
    │   ├── messageService.ts        # メッセージAPI（Realtime購読含む）
    │   ├── castService.ts           # キャスト専用API（出勤・CRM・今夜リクエスト）
    │   └── customerService.ts       # 顧客専用API（お気に入り・足跡・今夜送信）
    ├── navigation/
    │   ├── AppNavigator.tsx         # ルートナビ（認証状態・role分岐）
    │   ├── AuthNavigator.tsx        # 認証フロー
    │   ├── CastTabNavigator.tsx     # キャスト用ボトムタブ（全実画面接続済）
    │   └── CustomerTabNavigator.tsx # 顧客用ボトムタブ（全実画面接続済）
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── common/
    │   │   ├── TimelineScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   ├── EditProfileScreen.tsx
    │   │   ├── MatchesScreen.tsx
    │   │   ├── ChatScreen.tsx
    │   │   ├── FavoritesScreen.tsx
    │   │   ├── FootprintsScreen.tsx
    │   │   └── UserProfileScreen.tsx
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

## 3. 残作業（次のPCで対応が必要な項目）

### 3.1 Supabaseセットアップ ⚠️ 最優先
以下を完了しないとアプリが動作しない。

1. **`.env`にURL/Keyを記入**  
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

2. **`supabase/schema.sql`をSQLエディタで実行**  
   Supabaseダッシュボード → SQL Editor → 内容を貼り付けて実行

3. **Supabase Storage バケットを作成（Public）**  
   - `avatars`（プロフィール画像）  
   - `media`（タイムライン投稿の画像・動画）

4. **pg_cron拡張を有効化**  
   Supabase → Database → Extensions → `pg_cron` を Enable

### 3.2 動作確認が必要な画面
| 画面 | 確認内容 |
|---|---|
| LoginScreen | Supabase Auth接続確認 |
| RegisterScreen | usersテーブルへのinsert確認 |
| TimelineScreen | Realtime購読の動作確認 |
| ChatScreen | Realtimeメッセージ受信確認 |
| MapScreen | 位置情報取得・マップ表示確認 |
| CastSearchScreen | `is_sponsored`優先表示確認 |

### 3.3 将来実装予定（設計は対応済み）
- **男性向けプレミアムプラン**（`is_premium`フラグはDB・型定義に存在）
- プッシュ通知（expo-notificationsインストール済み、初期化のみ）
- スパム・悪質ユーザーのブロック・通報

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
