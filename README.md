# YoruConnect (ヨルコネ)

夜職向けマッチングSNSアプリ。ガールズバー・コンカフェのキャスト（女性）と顧客（男性）をつなぐプラットフォーム。

## 技術スタック

- **フロントエンド**: React Native (Expo) + TypeScript
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query (React Query)
- **ナビゲーション**: React Navigation v6
- **位置情報**: expo-location + react-native-maps

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd YoruConnect
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env`を編集してSupabaseの認証情報を設定:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabaseデータベースの構築

[Supabase](https://supabase.com) でプロジェクトを作成後、`supabase/schema.sql` の内容をSQLエディタで実行してください。

> **注意**: pg_cronを使用するため、Supabase管理画面の「Extensions」から `pg_cron` を有効化してください。

### 4. Supabase Storageバケットの作成

Supabase管理画面のStorageで以下のバケットを作成（Public）:
- `avatars` - プロフィール画像
- `media` - タイムライン投稿の画像・動画

### 5. アプリの起動

```bash
# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Expo Go（実機）
npm start
```

## ディレクトリ構成

```
src/
├── components/
│   ├── cast/           # キャスト専用UIコンポーネント
│   ├── common/         # 共通UIコンポーネント
│   ├── messages/       # メッセージ関連コンポーネント
│   └── timeline/       # タイムライン関連コンポーネント
├── constants/
│   └── colors.ts       # デザインカラー定数
├── lib/
│   └── supabase.ts     # Supabaseクライアント
├── navigation/         # ナビゲーション設定
├── screens/
│   ├── auth/           # 認証画面
│   ├── cast/           # キャスト専用画面
│   ├── common/         # 共通画面
│   └── customer/       # 顧客専用画面
├── services/           # Supabase APIロジック
├── store/              # Zustand状態管理
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

## 機能一覧

### 共通機能
- メール/パスワード認証、新規登録、パスワードリセット
- プロフィール設定（アバター、ニックネーム、自己紹介）
- タイムライン投稿・閲覧（24時間で自動削除）
- スワイプ/リスト形式でのいいね → 相互いいねでマッチング
- マッチ後のダイレクトメッセージ（テキスト・画像、リアルタイム）
- お気に入り登録・足跡閲覧

### キャスト（女性）専用機能
- 出勤ステータス管理（出勤中 / 休憩中 / 退勤）
- 位置情報共有（ぼかし処理で「〇〇エリア周辺」として表示）
- 店舗情報管理（店舗名、住所、料金システム）
- 「今夜行ける？」リクエストの受信・承諾
- 顧客管理CRM（プライベートメモ、ボトル履歴、来店予定）
- 来店予定日・誕生日の自動リマインダー

### 顧客（男性）専用機能
- キャスト検索（エリア、出勤状況、店舗名、キーワード）
- **Sponsoredキャスト優先表示**（BtoB収益基盤）
- マップ表示（出勤中キャストを地図上に表示）
- 「今夜行ける？」アピール送信

## デザイン

- **テーマ**: モダン・ダーク（夜職の雰囲気に合わせた洗練されたUI）
- **カラー**: 背景 `#0A0A0F`、アクセント `#C9A84C`（ゴールド）
- **UX**: FAB・ボトムシート・マイクロアニメーションで高級感を演出

## ビルド（EAS）

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```
