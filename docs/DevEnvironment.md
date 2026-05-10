# 開発環境セットアップガイド：Mistella

> 別PCで開発を継続するための手順書。  
> 元PC（Mac）の環境をそのまま再現するために必要な設定をまとめています。

---

## 1. 元PC（Mac）の開発環境

| 項目 | バージョン |
|---|---|
| OS | macOS（Apple Silicon / arm64） |
| Node.js | v22.22.1 |
| npm | 10.9.4 |
| Expo CLI | 0.18.31 |
| Watchman | 2026.05.04.00 |
| Xcode | 26.4.1 (Build 17E202) |
| Expo SDK | ~51.0.28（実際にインストールされたのは51.0.39） |
| iOS シミュレーター | iPhone 17 Pro Max で動作確認済み |

---

## 2. 新しいPCでのセットアップ手順

### Step 1: 前提ツールのインストール（Mac の場合）

```bash
# Homebrew（未インストールの場合）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js（v22推奨。nvmを使う場合）
brew install nvm
nvm install 22
nvm use 22

# Watchman（必須: ないとEMFILEエラーが出る）
brew install watchman

# Xcode（Mac/iOS開発の場合）
# → App Storeからインストール後、下記を実行
sudo xcode-select --switch /Applications/Xcode.app
sudo xcodebuild -license accept
```

### Step 2: プロジェクトのセットアップ

```bash
# リポジトリをクローン（またはコピー）
cd Mistella

# パッケージインストール（必ず npm install を実行）
npm install
```

> ⚠️ **注意**: `package.json`に`expo-font: ~12.0.10`が直接指定されている。  
> これは `@expo/vector-icons` が `expo-font@55` を引き込む不具合を防ぐための意図的な固定。  
> **絶対に `expo-font` のバージョンを変えないこと。**

### Step 3: 環境変数の設定

`.env.example`をコピーして`.env`を作成する:

```bash
cp .env.example .env
```

`.env`を開いて、Supabase のプロジェクト設定から値を取得して記入:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**取得場所**: Supabase ダッシュボード → Project Settings → Data API → Project URL と anon public

### Step 4: Supabase のデータベースセットアップ

1. [supabase.com/dashboard](https://supabase.com/dashboard) でプロジェクトを開く
2. 左メニュー → **SQL Editor**
3. `supabase/schema.sql` の全内容をコピーして貼り付け → **Run**
4. 左メニュー → **Database → Extensions** → `pg_cron` を **Enable**

### Step 5: Supabase Storage のセットアップ

1. Supabase ダッシュボード → **Storage**
2. 以下の2つのバケットを **Public** で作成:
   - `avatars`（プロフィール画像）
   - `media`（タイムライン投稿の画像・動画）

### Step 6: アプリの起動確認

```bash
# iOS シミュレーターで起動
npm run ios

# Android エミュレーターで起動（Android Studio が必要）
npm run android

# Expo Go で実機確認（QRコード読み取り）
npm start
```

---

## 3. package.json の依存パッケージ（2026-05-11時点）

```json
{
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.11.0",
    "@supabase/supabase-js": "^2.45.4",
    "@tanstack/react-query": "^5.56.2",
    "expo": "~51.0.28",
    "expo-av": "~14.0.7",
    "expo-font": "~12.0.10",
    "expo-camera": "~15.0.16",
    "expo-document-picker": "~12.0.2",
    "expo-image-manipulator": "~12.0.5",
    "expo-image-picker": "~15.1.0",
    "expo-linear-gradient": "~13.0.2",
    "expo-linking": "~6.3.1",
    "expo-location": "~17.0.1",
    "expo-notifications": "~0.28.19",
    "expo-secure-store": "~13.0.2",
    "expo-splash-screen": "~0.27.5",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-maps": "1.14.0",
    "react-native-reanimated": "~3.10.1",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "@types/react-native": "~0.73.0",
    "typescript": "~5.3.3"
  }
}
```

---

## 4. 起動時のよくある問題と対処法

### 問題1: `EMFILE: too many open files, watch`
```bash
# 原因: watchman 未インストール
brew install watchman
```

### 問題2: `getLoadedFonts is not a function`
```bash
# 原因: expo-font@55 が入っている（互換性なし）
# 対処: package.json に "expo-font": "~12.0.10" が明示されていることを確認
npm install
cat node_modules/expo-font/package.json | grep '"version"'
# → 12.0.10 であること
```

### 問題3: Supabase接続エラー（`Invalid URL`など）
```bash
# 原因: .env が設定されていない
cat .env
# EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY が設定されているか確認
```

### 問題4: `Module not found: expo-router`
```bash
# 原因: app.json に expo-router プラグインが残っている場合
# 対処: app.json の plugins から "expo-router" を削除（すでに削除済みのはず）
```

### 問題5: iOS シミュレーターが起動しない
```bash
# Xcode のライセンスに同意する
sudo xcodebuild -license accept

# シミュレーターを手動起動
open -a Simulator
```

### 問題6: Android ビルドエラー
```bash
# Android Studio と Java（JDK 17推奨）が必要
brew install --cask android-studio
# → Android Studio → SDK Manager → Android SDK をインストール
# → ANDROID_HOME 環境変数を設定
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

---

## 5. 開発時の注意事項

### AIへの引き継ぎ時のプロンプト例

新しいPCで別の生成AIに開発を依頼する際、以下のドキュメントを必ず最初に読み込ませること:

1. `docs/RFP.md` — 要件定義書（アプリの全体像）
2. `docs/TechSpecs.md` — 技術仕様書
3. `docs/DatabaseSchema.md` — DB設計書
4. `docs/ProgressStatus.md` — **現在の開発進捗**（このファイルと対になっている）
5. `docs/DevEnvironment.md` — このファイル

プロンプト例:
```
「以下のドキュメントを読んで、Mistellaの開発状況を把握してください。
その上で[やりたいこと]を実装してください。」
→ 上記5つのドキュメントをすべて貼り付ける
```

### コーディング規約
- TypeScript strict mode（`strict: true`）
- スタイリングは **StyleSheet**（NativeWindは使用していない）
- アイコンは **`@expo/vector-icons` の `MaterialIcons`** のみ使用
- カラー定数は必ず `src/constants/colors.ts` の `COLORS` を参照
- Supabase接続は必ず `src/lib/supabase.ts` からimport
- 各サービス関数は `src/services/` 配下に集約

### Supabase 無料枠の制約への対応（設計済み）
| 制約 | 対応内容 |
|---|---|
| DB容量500MB | ページネーション必須・タイムライン24時間後物理削除 |
| Storage 1GB | アップロード前に画像を圧縮（600x600, JPEG q=0.7） |
| Realtime接続数 | 必要な画面を開いている時のみ接続、離脱時にunsubscribe |
