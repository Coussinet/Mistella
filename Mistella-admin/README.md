# Mistella Admin

Mistellaの運営者向けNext.js管理画面です。利用者アプリへ管理権限やSupabase Secretキーを配布せず、管理操作はServer Component / Server Actionから実行します。

## 主な機能

- 男性・女性ユーザーの検索、編集、利用停止、完全削除
- 全ユーザー・男性・女性・個別のお知らせ送信
- 投稿と添付メディアの削除
- 通報対応とブロック関係の確認
- 女性キャストの店舗情報・Sponsored設定

## 環境変数

`.env.local` に次を設定します。`SUPABASE_SERVICE_ROLE_KEY` はブラウザへ公開しないでください。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_OR_SECRET_KEY
```

## 管理者の登録

管理者本人をSupabase Authenticationへ登録後、同じUUIDを `public.users_admin` に追加します。

```sql
INSERT INTO public.users_admin (id, email, name)
VALUES ('AUTH_USER_UUID', 'admin@example.com', '運営管理者');
```

ログイン済みであっても `users_admin` に存在しないユーザーは管理画面・Server Action・お知らせ送信関数を利用できません。

## 起動・検証

```bash
npm install
npm run dev
npm run build
```

開発時は `http://localhost:3000` を開きます。本番公開前に、ルートプロジェクトのSupabaseマイグレーションと `send-announcement` Edge Functionを反映してください。
