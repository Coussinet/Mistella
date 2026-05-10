# 技術仕様書 (Tech Specs) : YoruConnect

本ドキュメントは、生成AIに対して「YoruConnect」の技術スタック、アーキテクチャ、および設計制約を指示するための仕様書です。

## 1. 技術スタック

### 1.1 フロントエンド (モバイルアプリ)

- **フレームワーク:** React Native (Expo Managed Workflow)
- **言語:** TypeScript (厳格な型定義によりAIのバグ生成を防ぐ)
- **スタイリング:** NativeWind (Tailwind CSS for React Native) または StyleSheet。モダンで洗練された日本向けUIを実現するため、余白設定や角丸（border-radius）を統一する。
- **ナビゲーション:** React Navigation v6/v7 (Bottom Tabs, Native Stack)
- **状態管理:** Zustand (軽量でAIが扱いやすい)
- **データフェッチ:** TanStack Query (React Query)
- **位置情報・マップ:** `expo-location`, `react-native-maps`

### 1.2 バックエンド (BaaS)

- **サービス:** Supabase
- **データベース:** PostgreSQL (Supabase Database)
- **認証:** Supabase Auth (Email/Password)
- **ストレージ:** Supabase Storage (アイコン、タイムライン画像/動画)
- **リアルタイム通信:** Supabase Realtime (DM機能、出勤ステータス、今夜行けるアピールの即時反映)

## 2. Supabase 無料枠（Free Plan）を前提とした設計方針

AIによるコード生成時は、以下の無料枠制限を意識した最適化を行うこと。

1. **データベース容量 (500MB) と APIリクエスト対策:**
    - アプリ起動時の不要な全件フェッチを避け、ページネーション（無限スクロール）を必須とする。
    - 「24時間で消えるタイムライン」は、フロントエンドでの非表示だけでなく、Supabaseの `pg_cron` 等を用いた物理削除バッチ処理を定義し、DB容量を節約する。
2. **ストレージ容量 (1GB) 対策:**
    - アップロードする画像は Expo の `expo-image-manipulator` を使用して、アップロード前にクライアント側でリサイズ・圧縮 (品質0.7等) を行うコードを生成する。
    - 動画（3秒制限）は特に容量を圧迫するため、厳格にバリデーションする。
3. **リアルタイム接続数対策:**
    - Supabase Realtimeのリスナーは、DM画面やマップ画面など「必要な画面を開いている時」のみ接続し、画面から離れたら適切に `unsubscribe` (切断) するロジックを強制する。

## 3. ディレクトリ構成 (推奨)

AIにコード生成を依頼する際、以下のディレクトリ構造に従う。

```
/
├── assets/             # 静的ファイル (画像、フォント等)
├── src/
│   ├── components/     # UIコンポーネント (洗練された日本向けデザインを意識)
│   ├── navigation/     # ルーター設定
│   ├── screens/        # 画面コンポーネント
│   │   ├── auth/       # ログイン・登録
│   │   ├── cast/       # キャスト用 (CRM、出勤管理)
│   │   └── customer/   # 顧客用 (検索、今夜行ける？送信等)
│   ├── services/       # Supabase API連携ロジック
│   ├── store/          # Zustandの状態管理
│   ├── types/          # TypeScriptの型定義ファイル
│   └── utils/          # 日付フォーマット等のヘルパー
├── App.tsx             # エントリーポイント
└── app.json            # Expo設定ファイル
```

## 4. UI/UX デザインの実装指針

- **カラーパレット:** ダークグレーの背景に、アクセントカラーとして上品なゴールドやネオンブルーを配置する。
- **タイポグラフィ:** 日本語が美しく見えるフォントウェイトの調整、十分な行間の確保。
- **コンポーネント:** 広告表示枠（BtoB収益用）は、通常のリストUIに自然に溶け込みつつ「Sponsored」タグ等を付与し、不快感を与えないリッチなデザインとする。