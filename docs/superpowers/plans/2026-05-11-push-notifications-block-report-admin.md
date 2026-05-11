# プッシュ通知・ブロック/通報・管理Webアプリ 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プッシュ通知（全5種類）・通知設定画面・ブロック/通報機能・Next.js管理Webアプリを実装する

**Architecture:** DBマイグレーションでスキーマを拡張し、Supabase Edge Functionでプッシュ通知を配信。モバイル側はserviceレイヤーからEdge Functionを直接呼び出す。管理WebアプリはMistella-admin/ディレクトリにNext.js 14 App Routerで実装し、同一Supabaseプロジェクトを共有する。

**Tech Stack:** React Native (Expo SDK 51), expo-notifications ~0.28, expo-device, Supabase (PostgreSQL + Edge Functions Deno), Next.js 14 App Router, TypeScript, Tailwind CSS, @supabase/ssr

---

## Phase 1: DBマイグレーション

### Task 1: DBマイグレーション SQL を作成・実行する

**Files:**
- Create: `supabase/migrations/001_push_block_report_admin.sql`

- [ ] **Step 1: マイグレーションファイルを作成する**

```sql
-- supabase/migrations/001_push_block_report_admin.sql

-- ============================================================
-- 既存テーブル変更
-- ============================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- ============================================================
-- 新規テーブル
-- ============================================================

-- 管理者テーブル（public.usersとは完全分離）
CREATE TABLE IF NOT EXISTS public.users_admin (
    id         UUID PRIMARY KEY,  -- auth.users.id と一致
    email      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- プッシュ通知トークン
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id                              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id                         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token                           TEXT        NOT NULL UNIQUE,
    platform                        TEXT        CHECK (platform IN ('ios', 'android')),
    notification_messages           BOOLEAN     DEFAULT true,
    notification_matches            BOOLEAN     DEFAULT true,
    notification_likes              BOOLEAN     DEFAULT true,
    notification_tonight_requests   BOOLEAN     DEFAULT true,
    notification_tonight_responses  BOOLEAN     DEFAULT true,
    created_at                      TIMESTAMPTZ DEFAULT now(),
    updated_at                      TIMESTAMPTZ DEFAULT now()
);

-- ブロック
CREATE TABLE IF NOT EXISTS public.blocks (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (blocker_id, blocked_id)
);

-- 通報
CREATE TABLE IF NOT EXISTS public.reports (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason           TEXT        NOT NULL CHECK (reason IN ('spam','inappropriate_content','harassment','other')),
    detail           TEXT,
    status           TEXT        DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
    created_at       TIMESTAMPTZ DEFAULT now(),
    reviewed_at      TIMESTAMPTZ,
    reviewed_by      UUID        REFERENCES public.users_admin(id)
);

-- お知らせ通知
CREATE TABLE IF NOT EXISTS public.announcements (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    title          TEXT        NOT NULL,
    body           TEXT        NOT NULL,
    target_type    TEXT        NOT NULL CHECK (target_type IN ('all_male','all_female','individual')),
    target_user_id UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    sent_at        TIMESTAMPTZ,
    created_by     UUID        NOT NULL REFERENCES public.users_admin(id),
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id  ON public.push_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id     ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id     ON public.blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_status        ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports (reported_user_id);

-- ============================================================
-- push_tokens の updated_at 自動更新トリガー
-- ============================================================

DROP TRIGGER IF EXISTS trg_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trg_push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS: ブロック・管理者ブロック対応
-- ============================================================

-- users: ブロックされたユーザーを非表示
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
    FOR SELECT USING (
        is_blocked = false
        AND id NOT IN (
            SELECT blocked_id FROM public.blocks WHERE blocker_id = auth.uid()
        )
        AND id NOT IN (
            SELECT blocker_id FROM public.blocks WHERE blocked_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS users_update_own_policy ON public.users;
CREATE POLICY users_update_own_policy ON public.users
    FOR UPDATE USING (id = auth.uid());

-- push_tokens: 本人のみ読み書き可
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_select_policy ON public.push_tokens;
CREATE POLICY push_tokens_select_policy ON public.push_tokens
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_insert_policy ON public.push_tokens;
CREATE POLICY push_tokens_insert_policy ON public.push_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_update_policy ON public.push_tokens;
CREATE POLICY push_tokens_update_policy ON public.push_tokens
    FOR UPDATE USING (user_id = auth.uid());

-- blocks: 本人のみ読み書き可
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blocks_select_policy ON public.blocks;
CREATE POLICY blocks_select_policy ON public.blocks
    FOR SELECT USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS blocks_insert_policy ON public.blocks;
CREATE POLICY blocks_insert_policy ON public.blocks
    FOR INSERT WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS blocks_delete_policy ON public.blocks;
CREATE POLICY blocks_delete_policy ON public.blocks
    FOR DELETE USING (blocker_id = auth.uid());

-- reports: 本人が書いたものを読める、誰でも作成可
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_insert_policy ON public.reports;
CREATE POLICY reports_insert_policy ON public.reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS reports_select_own_policy ON public.reports;
CREATE POLICY reports_select_own_policy ON public.reports
    FOR SELECT USING (reporter_id = auth.uid());

-- announcements: 認証済みユーザーは読み取り可（管理者が書き込む）
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select_policy ON public.announcements;
CREATE POLICY announcements_select_policy ON public.announcements
    FOR SELECT USING (auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Supabase ダッシュボードで SQL を実行する**

Supabase Dashboard → SQL Editor → 上記内容を貼り付けて Run  
期待: エラーなく全テーブル作成される

- [ ] **Step 3: コミット**

```bash
git add supabase/migrations/001_push_block_report_admin.sql
git commit -m "feat: DBマイグレーション - push_tokens/blocks/reports/announcements/users_adminテーブルを追加"
```

---

## Phase 2: プッシュ通知

### Task 2: expo-device インストール & 型定義を追加する

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: expo-device をインストールする**

```bash
npx expo install expo-device
```

期待: `package.json` の dependencies に `expo-device` が追加される

- [ ] **Step 2: `src/types/index.ts` に PushToken 型とナビゲーション型を追加する**

`src/types/index.ts` の末尾（`RootStackParamList` の後）に追加:

```typescript
export type ReportReason = 'spam' | 'inappropriate_content' | 'harassment' | 'other';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  notification_messages: boolean;
  notification_matches: boolean;
  notification_likes: boolean;
  notification_tonight_requests: boolean;
  notification_tonight_responses: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationSettingsKeys = Pick<
  PushToken,
  | 'notification_messages'
  | 'notification_matches'
  | 'notification_likes'
  | 'notification_tonight_requests'
  | 'notification_tonight_responses'
>;

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  detail: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}
```

また、`CastStackParamList` と `CustomerStackParamList` に `NotificationSettings` ルートを追加:

```typescript
// CastStackParamList に追加
NotificationSettings: undefined;

// CustomerStackParamList に追加
NotificationSettings: undefined;
```

- [ ] **Step 3: コミット**

```bash
git add src/types/index.ts package.json
git commit -m "feat: PushToken・Block・Report型定義とナビゲーション型を追加"
```

---

### Task 3: notificationService.ts を実装する

**Files:**
- Create: `src/services/notificationService.ts`

- [ ] **Step 1: `src/services/notificationService.ts` を作成する**

```typescript
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NotificationSettingsKeys, PushToken } from '../types';

export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const { error } = await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform },
    { onConflict: 'token' },
  );
  if (error) throw error;
}

export async function getNotificationSettings(
  userId: string,
): Promise<PushToken | null> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as PushToken | null;
}

export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettingsKeys>,
): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .update(settings)
    .eq('user_id', userId);
  if (error) throw error;
}
```

- [ ] **Step 2: コミット**

```bash
git add src/services/notificationService.ts
git commit -m "feat: notificationService - プッシュトークン登録・通知設定CRUD"
```

---

### Task 4: App.tsx でログイン後にトークンを登録する

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: `App.tsx` の import に `registerPushToken` を追加し、セッション取得後に呼び出す**

`App.tsx` の import 行を変更:

```typescript
import { getProfile, getCastProfile } from './src/services/authService';
import { registerPushToken } from './src/services/notificationService';
```

`setProfile(profile);` の直後（両箇所）に追加:

```typescript
// セッション取得時（supabase.auth.getSession のコールバック内）
setProfile(profile);
registerPushToken(session.user.id).catch(() => {});
```

```typescript
// onAuthStateChange のコールバック内
setProfile(profile);
registerPushToken(session.user.id).catch(() => {});
```

- [ ] **Step 2: iOS 用に通知チャンネルの設定を追加する（Android 向け）**

`Notifications.setNotificationHandler` の直後に追加:

```typescript
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'デフォルト',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}
```

import に `Platform` を追加:

```typescript
import { Platform } from 'react-native';
```

- [ ] **Step 3: コミット**

```bash
git add App.tsx
git commit -m "feat: App.tsx - ログイン後のプッシュトークン自動登録"
```

---

### Task 5: NotificationSettingsScreen.tsx を実装する

**Files:**
- Create: `src/screens/common/NotificationSettingsScreen.tsx`

- [ ] **Step 1: `src/screens/common/NotificationSettingsScreen.tsx` を作成する**

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';
import type { NotificationSettingsKeys, PushToken } from '../../types';

type SettingItem = {
  key: keyof NotificationSettingsKeys;
  label: string;
  description: string;
};

const SETTINGS: SettingItem[] = [
  { key: 'notification_messages',          label: '新しいメッセージ',        description: 'DM受信時に通知' },
  { key: 'notification_matches',           label: 'マッチング成立',           description: '相互いいねが成立したとき' },
  { key: 'notification_likes',             label: 'いいね',                   description: 'いいねを受け取ったとき' },
  { key: 'notification_tonight_requests',  label: '今夜行ける？リクエスト',    description: 'リクエストを受信したとき（キャスト）' },
  { key: 'notification_tonight_responses', label: '今夜行ける？返答',          description: '承諾・辞退を受け取ったとき（顧客）' },
];

export default function NotificationSettingsScreen() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<PushToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<keyof NotificationSettingsKeys | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotificationSettings(user.id);
      setSettings(data);
    } catch {
      Alert.alert('エラー', '設定の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = async (key: keyof NotificationSettingsKeys, value: boolean) => {
    if (!user || !settings) return;
    setUpdating(key);
    const prev = { ...settings };
    setSettings({ ...settings, [key]: value });
    try {
      await updateNotificationSettings(user.id, { [key]: value });
    } catch {
      setSettings(prev);
      Alert.alert('エラー', '設定の更新に失敗しました。');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          プッシュ通知が有効になっていません。{'\n'}
          端末の設定からMistellaの通知を許可してください。
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>通知設定</Text>
      {SETTINGS.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
          <Switch
            value={settings[item.key]}
            onValueChange={(v) => handleToggle(item.key, v)}
            disabled={updating === item.key}
            trackColor={{ false: COLORS.border, true: COLORS.gold }}
            thumbColor={COLORS.text}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: 40 },
  center:    { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  sectionHeader: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '600',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  rowText:     { flex: 1, marginRight: 12 },
  label:       { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  description: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
```

- [ ] **Step 2: コミット**

```bash
git add src/screens/common/NotificationSettingsScreen.tsx
git commit -m "feat: NotificationSettingsScreen - 通知ON/OFF設定画面"
```

---

### Task 6: ナビゲーターに NotificationSettings ルートを追加する

**Files:**
- Modify: `src/navigation/CastTabNavigator.tsx`
- Modify: `src/navigation/CustomerTabNavigator.tsx`

- [ ] **Step 1: `CastTabNavigator.tsx` に NotificationSettings を追加する**

import 行に追加:
```typescript
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';
```

`ProfileStack.Navigator` 内の最後の `ProfileStack.Screen` の後に追加:
```typescript
<ProfileStack.Screen
  name="NotificationSettings"
  component={NotificationSettingsScreen}
  options={{ title: '通知設定' }}
/>
```

- [ ] **Step 2: `CustomerTabNavigator.tsx` に同様の変更を加える**

```bash
# CustomerTabNavigator.tsx を確認
```

`src/navigation/CustomerTabNavigator.tsx` の ProfileStackNavigator 内に同様に追加:
```typescript
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';
```
```typescript
<ProfileStack.Screen
  name="NotificationSettings"
  component={NotificationSettingsScreen}
  options={{ title: '通知設定' }}
/>
```

- [ ] **Step 3: コミット**

```bash
git add src/navigation/CastTabNavigator.tsx src/navigation/CustomerTabNavigator.tsx
git commit -m "feat: ナビゲーターにNotificationSettingsルートを追加"
```

---

### Task 7: ProfileScreen に通知設定へのリンクを追加する

**Files:**
- Modify: `src/screens/common/ProfileScreen.tsx`

- [ ] **Step 1: ProfileScreen.tsx を確認する**

`ProfileScreen.tsx` のナビゲーション型宣言と、設定リンク表示部分を特定する。  
`useNavigation` の型を `CastStackParamList | CustomerStackParamList` のいずれかで呼び出している箇所を確認する。

- [ ] **Step 2: 通知設定ボタンを追加する**

ProfileScreen の「編集」ボタン群（EditProfile, Favorites, Footprints など）が並ぶセクションに、以下のボタンを追加する:

```typescript
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => navigation.navigate('NotificationSettings' as never)}
>
  <MaterialIcons name="notifications" size={22} color={COLORS.gold} />
  <Text style={styles.menuItemText}>通知設定</Text>
  <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
</TouchableOpacity>
```

- [ ] **Step 3: コミット**

```bash
git add src/screens/common/ProfileScreen.tsx
git commit -m "feat: ProfileScreenに通知設定へのリンクを追加"
```

---

### Task 8: Supabase Edge Function `send-push-notification` を実装する

**Files:**
- Create: `supabase/functions/send-push-notification/index.ts`

- [ ] **Step 1: ディレクトリを作成する**

```bash
mkdir -p /Users/yaraya-mac/SourceCSN/Mistella/supabase/functions/send-push-notification
```

- [ ] **Step 2: Edge Function を作成する**

```typescript
// supabase/functions/send-push-notification/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  recipient_user_id: string;
  title: string;
  body: string;
  notification_key: 'notification_messages' | 'notification_matches' | 'notification_likes' | 'notification_tonight_requests' | 'notification_tonight_responses';
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: NotificationPayload = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', payload.recipient_user_id)
      .eq(payload.notification_key, true)

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
    }))

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    })

    const result = await expoRes.json()
    return new Response(JSON.stringify({ sent: messages.length, result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 3: Supabase CLI で Edge Function をデプロイする**

```bash
# Supabase CLI が未インストールの場合
npm install -g supabase

# ログイン・デプロイ
supabase login
supabase functions deploy send-push-notification --project-ref <YOUR_PROJECT_REF>
```

期待: Edge Function がデプロイされ Supabase Dashboard > Edge Functions に表示される

- [ ] **Step 4: コミット**

```bash
git add supabase/functions/send-push-notification/index.ts
git commit -m "feat: send-push-notification Edge Functionを実装"
```

---

### Task 9: service 層からプッシュ通知を送信する

**Files:**
- Modify: `src/services/messageService.ts`
- Modify: `src/services/matchService.ts`
- Modify: `src/services/castService.ts`
- Modify: `src/services/customerService.ts`

- [ ] **Step 1: 共通の通知送信ヘルパーを `notificationService.ts` に追加する**

`src/services/notificationService.ts` の末尾に追記（`import` は既存のものを使用。重複させない）:

```typescript
type NotificationKey =
  | 'notification_messages'
  | 'notification_matches'
  | 'notification_likes'
  | 'notification_tonight_requests'
  | 'notification_tonight_responses';

export async function sendPushNotification(params: {
  recipientUserId: string;
  title: string;
  body: string;
  notificationKey: NotificationKey;
  data?: Record<string, string>;
}): Promise<void> {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        recipient_user_id: params.recipientUserId,
        title: params.title,
        body: params.body,
        notification_key: params.notificationKey,
        data: params.data ?? {},
      },
    });
  } catch {
    // 通知の失敗はサイレントに処理（本体機能に影響させない）
  }
}
```

- [ ] **Step 2: `messageService.ts` にメッセージ通知を追加する**

`messageService.ts` の sendMessage 関数（INSERT後）に追加:

```typescript
import { sendPushNotification } from './notificationService';

// メッセージ送信後に相手への通知
// match から相手の user_id を取得して通知
const { data: match } = await supabase
  .from('matches')
  .select('customer_id, cast_id')
  .eq('id', matchId)
  .single();
if (match) {
  const recipientId = match.customer_id === senderId ? match.cast_id : match.customer_id;
  await sendPushNotification({
    recipientUserId: recipientId,
    title: '新しいメッセージ',
    body: content ?? '画像が届きました',
    notificationKey: 'notification_messages',
    data: { matchId },
  });
}
```

- [ ] **Step 3: `matchService.ts` にいいね・マッチ通知を追加する**

`matchService.ts` の sendLike 関数（INSERT後、matched 判定後）に追加:

```typescript
import { sendPushNotification } from './notificationService';

// いいね通知
await sendPushNotification({
  recipientUserId: toUserId,
  title: 'いいね！',
  body: 'あなたにいいねが届きました',
  notificationKey: 'notification_likes',
});

// マッチング通知（matched === true の場合）
if (matched) {
  await sendPushNotification({
    recipientUserId: toUserId,
    title: 'マッチング成立！',
    body: 'マッチングが成立しました。チャットを始めましょう！',
    notificationKey: 'notification_matches',
  });
  await sendPushNotification({
    recipientUserId: fromUserId,
    title: 'マッチング成立！',
    body: 'マッチングが成立しました。チャットを始めましょう！',
    notificationKey: 'notification_matches',
  });
}
```

- [ ] **Step 4: `customerService.ts` に今夜リクエスト送信通知を追加する**

`customerService.ts` の sendTonightRequest 関数（INSERT後）に追加:

```typescript
import { sendPushNotification } from './notificationService';

await sendPushNotification({
  recipientUserId: targetCastId,
  title: '今夜行ける？リクエスト',
  body: message ?? 'リクエストが届いています',
  notificationKey: 'notification_tonight_requests',
});
```

- [ ] **Step 5: `castService.ts` に今夜リクエスト承諾・辞退通知を追加する**

`castService.ts` の respondToTonightRequest 関数（UPDATE後）に追加:

```typescript
import { sendPushNotification } from './notificationService';

// request の customer_id を取得して通知
const statusLabel = status === 'accepted' ? '承諾' : '辞退';
await sendPushNotification({
  recipientUserId: customerId,
  title: `今夜行ける？の返答`,
  body: `リクエストが${statusLabel}されました`,
  notificationKey: 'notification_tonight_responses',
});
```

- [ ] **Step 6: コミット**

```bash
git add src/services/notificationService.ts src/services/messageService.ts \
        src/services/matchService.ts src/services/customerService.ts src/services/castService.ts
git commit -m "feat: 各サービスからプッシュ通知送信を追加"
```

---

## Phase 3a: ブロック・通報（モバイル）

### Task 10: blockService.ts を実装する

**Files:**
- Create: `src/services/blockService.ts`

- [ ] **Step 1: `src/services/blockService.ts` を作成する**

```typescript
import { supabase } from '../lib/supabase';
import type { ReportReason } from '../types';

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function isBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle();
  return data !== null;
}

export async function reportUser(params: {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  detail?: string;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: params.reporterId,
    reported_user_id: params.reportedUserId,
    reason: params.reason,
    detail: params.detail ?? null,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: コミット**

```bash
git add src/services/blockService.ts
git commit -m "feat: blockService - ブロック・通報API"
```

---

### Task 11: UserProfileScreen にブロック・通報UIを追加する

**Files:**
- Modify: `src/screens/common/UserProfileScreen.tsx`

- [ ] **Step 1: import に blockService と必要なコンポーネントを追加する**

`UserProfileScreen.tsx` の既存 import に追加:

```typescript
import { blockUser, reportUser } from '../../services/blockService';
import type { ReportReason } from '../../types';
```

`react-native` の import に `ActionSheetIOS` は使わず `Modal` は既存のものを流用する。

- [ ] **Step 2: 通報モーダルコンポーネントを追加する**

`TonightModal` の定義直後（`const modalStyles` の前）に追加:

```typescript
// ============================================================
// 通報モーダル
// ============================================================
type ReportModalProps = {
  visible: boolean;
  targetUserId: string;
  onClose: () => void;
};

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam',                   label: 'スパム' },
  { value: 'inappropriate_content',  label: '不適切なコンテンツ' },
  { value: 'harassment',             label: '嫌がらせ' },
  { value: 'other',                  label: 'その他' },
];

function ReportModal({ visible, targetUserId, onClose }: ReportModalProps) {
  const { user } = useAuthStore();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !reason) return;
    setSending(true);
    try {
      await reportUser({
        reporterId: user.id,
        reportedUserId: targetUserId,
        reason,
        detail: detail.trim() || undefined,
      });
      Alert.alert('通報完了', '通報を受け付けました。ご協力ありがとうございます。');
      setReason(null);
      setDetail('');
      onClose();
    } catch {
      Alert.alert('エラー', '通報に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={reportStyles.overlay}>
        <View style={reportStyles.sheet}>
          <Text style={reportStyles.title}>通報する</Text>
          <Text style={reportStyles.subtitle}>理由を選択してください</Text>
          {REPORT_REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[reportStyles.reasonRow, reason === r.value && reportStyles.reasonRowSelected]}
              onPress={() => setReason(r.value)}
            >
              <MaterialIcons
                name={reason === r.value ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={reason === r.value ? COLORS.gold : COLORS.textMuted}
              />
              <Text style={[reportStyles.reasonText, reason === r.value && { color: COLORS.gold }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={reportStyles.input}
            placeholder="補足（任意・200文字以内）"
            placeholderTextColor={COLORS.textMuted}
            value={detail}
            onChangeText={setDetail}
            multiline
            maxLength={200}
          />
          <View style={reportStyles.actions}>
            <TouchableOpacity style={reportStyles.cancelButton} onPress={onClose}>
              <Text style={reportStyles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[reportStyles.sendButton, (!reason || sending) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!reason || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color={COLORS.background} />
                : <Text style={reportStyles.sendText}>通報する</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const reportStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet:    { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, width: '100%' },
  title:    { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 16 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  reasonRowSelected: { backgroundColor: 'transparent' },
  reasonText:        { color: COLORS.text, fontSize: 14 },
  input: {
    backgroundColor: COLORS.surfaceLight, color: COLORS.text, borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 64, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border, marginTop: 12, marginBottom: 16,
  },
  actions:      { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText:   { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  sendButton:   { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: COLORS.error, alignItems: 'center' },
  sendText:     { color: COLORS.text, fontSize: 14, fontWeight: '700' },
});
```

- [ ] **Step 3: `UserProfileScreen` のメイン部分にブロック・通報の状態と処理を追加する**

`useState` の宣言群に追加:

```typescript
const [reportModalVisible, setReportModalVisible] = useState(false);
```

`handleFavorite` の後に追加:

```typescript
const handleBlock = () => {
  if (!currentUser) return;
  Alert.alert(
    'ブロックしますか？',
    'ブロックすると相手はあなたのプロフィールや投稿を閲覧できなくなります。',
    [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ブロック',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(currentUser.id, userId);
            Alert.alert('ブロックしました', '', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch {
            Alert.alert('エラー', 'ブロックに失敗しました。');
          }
        },
      },
    ],
  );
};
```

`import { useNavigation }` を追加（まだない場合）:

```typescript
import { useNavigation } from '@react-navigation/native';
```

- [ ] **Step 4: ヘッダー右上に「…」メニューボタンを追加する**

`UserProfileScreen` コンポーネントの `useEffect` の上に追加:

```typescript
const navigation = useNavigation();

useEffect(() => {
  if (currentUser?.id === userId) return;
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity
        onPress={() =>
          Alert.alert('', '', [
            { text: '通報する', onPress: () => setReportModalVisible(true) },
            { text: 'ブロックする', style: 'destructive', onPress: handleBlock },
            { text: 'キャンセル', style: 'cancel' },
          ])
        }
        style={{ paddingRight: 16 }}
      >
        <MaterialIcons name="more-vert" size={24} color={COLORS.text} />
      </TouchableOpacity>
    ),
  });
}, [userId, currentUser]);
```

- [ ] **Step 5: `ReportModal` を JSX の末尾に追加する**

`TonightModal` の下に追加:

```typescript
<ReportModal
  visible={reportModalVisible}
  targetUserId={userId}
  onClose={() => setReportModalVisible(false)}
/>
```

- [ ] **Step 6: コミット**

```bash
git add src/screens/common/UserProfileScreen.tsx
git commit -m "feat: UserProfileScreenにブロック・通報UIを追加"
```

---

## Phase 3b: 管理Webアプリ（Next.js）

### Task 12: Mistella-admin プロジェクトをセットアップする

**Files:**
- Create: `Mistella-admin/` (以下すべて新規)

- [ ] **Step 1: Next.js プロジェクトを作成する**

```bash
cd /Users/yaraya-mac/SourceCSN/Mistella
npx create-next-app@14 Mistella-admin \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

期待: `Mistella-admin/` ディレクトリが作成される

- [ ] **Step 2: 必要なパッケージをインストールする**

```bash
cd Mistella-admin
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 3: `.env.local` を作成する**

```bash
# Mistella-admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

※ `.gitignore` に `.env.local` が含まれていることを確認する

- [ ] **Step 4: Supabase クライアントを作成する**

`Mistella-admin/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

`Mistella-admin/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    },
  )
}
```

`Mistella-admin/lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
```

- [ ] **Step 5: 共通型定義を作成する**

`Mistella-admin/types/index.ts`:
```typescript
export interface AdminUser {
  id: string
  email: string
  name: string
  created_at: string
}

export interface AppUser {
  id: string
  role: 'cast' | 'customer'
  nickname: string
  avatar_url: string | null
  bio: string | null
  is_premium: boolean
  is_blocked: boolean
  created_at: string
}

export interface CastProfile {
  user_id: string
  shop_name: string | null
  shop_address: string | null
  price_info: string | null
  is_sponsored: boolean
  is_working: boolean
  work_status: 'working' | 'break' | 'off'
}

export type ReportReason = 'spam' | 'inappropriate_content' | 'harassment' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: ReportReason
  detail: string | null
  status: ReportStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  reporter?: AppUser
  reported_user?: AppUser
}

export interface Announcement {
  id: string
  title: string
  body: string
  target_type: 'all_male' | 'all_female' | 'individual'
  target_user_id: string | null
  sent_at: string | null
  created_by: string
  created_at: string
}
```

- [ ] **Step 6: コミット**

```bash
cd /Users/yaraya-mac/SourceCSN/Mistella
git add Mistella-admin/
git commit -m "feat: Mistella-admin Next.jsプロジェクト初期セットアップ"
```

---

### Task 13: 管理画面の認証を実装する（ログイン + middleware）

**Files:**
- Create: `Mistella-admin/middleware.ts`
- Create: `Mistella-admin/app/login/page.tsx`
- Create: `Mistella-admin/app/layout.tsx`

- [ ] **Step 1: `middleware.ts` を作成する**

```typescript
// Mistella-admin/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
```

- [ ] **Step 2: `app/layout.tsx` を作成する**

```typescript
// Mistella-admin/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mistella 管理画面',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: ログインページを作成する**

`Mistella-admin/app/login/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !data.user) {
      setError('メールアドレスまたはパスワードが正しくありません。')
      setLoading(false)
      return
    }

    const { data: adminUser } = await supabase
      .from('users_admin')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!adminUser) {
      await supabase.auth.signOut()
      setError('管理者権限がありません。')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8 text-amber-400">Mistella 管理画面</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">パスワード</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-bold rounded-lg transition"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add Mistella-admin/middleware.ts Mistella-admin/app/
git commit -m "feat: 管理画面ログイン・middleware認証を実装"
```

---

### Task 14: ダッシュボードレイアウトとサマリーページを実装する

**Files:**
- Create: `Mistella-admin/app/dashboard/layout.tsx`
- Create: `Mistella-admin/app/dashboard/page.tsx`
- Create: `Mistella-admin/components/Sidebar.tsx`

- [ ] **Step 1: サイドバーコンポーネントを作成する**

`Mistella-admin/components/Sidebar.tsx`:
```typescript
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',                    label: 'ダッシュボード', icon: '📊' },
  { href: '/dashboard/reports',            label: '通報管理',       icon: '🚨' },
  { href: '/dashboard/users/male',         label: '男性ユーザー',   icon: '👤' },
  { href: '/dashboard/users/female',       label: '女性ユーザー',   icon: '👤' },
  { href: '/dashboard/announcements',      label: 'お知らせ',       icon: '📢' },
  { href: '/dashboard/shops',              label: '店舗管理',       icon: '🏪' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <span className="text-amber-400 font-bold text-lg">Mistella Admin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              pathname === item.href
                ? 'bg-amber-500 text-gray-900 font-semibold'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full text-sm text-gray-400 hover:text-white py-2 rounded-lg hover:bg-gray-800 transition"
        >
          ログアウト
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: ダッシュボードレイアウトを作成する**

`Mistella-admin/app/dashboard/layout.tsx`:
```typescript
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: サマリーページを作成する**

`Mistella-admin/app/dashboard/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: maleCount },
    { count: femaleCount },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'cast'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { label: '男性ユーザー数',  value: maleCount ?? 0,     color: 'text-blue-400' },
    { label: '女性ユーザー数',  value: femaleCount ?? 0,    color: 'text-pink-400' },
    { label: '未対応の通報',    value: pendingReports ?? 0, color: 'text-red-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">ダッシュボード</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">{s.label}</p>
            <p className={`text-4xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add Mistella-admin/components/ Mistella-admin/app/dashboard/
git commit -m "feat: 管理画面ダッシュボードレイアウト・サマリーページ"
```

---

### Task 15: 通報管理ページを実装する

**Files:**
- Create: `Mistella-admin/app/dashboard/reports/page.tsx`
- Create: `Mistella-admin/app/dashboard/reports/[id]/page.tsx`

- [ ] **Step 1: 通報一覧ページを作成する**

`Mistella-admin/app/dashboard/reports/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { ReportStatus } from '@/types'

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:   '未対応',
  reviewed:  '対応済み',
  dismissed: '却下',
}
const STATUS_COLOR: Record<ReportStatus, string> = {
  pending:   'bg-red-500/20 text-red-400',
  reviewed:  'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
}
const REASON_LABEL: Record<string, string> = {
  spam:                  'スパム',
  inappropriate_content: '不適切なコンテンツ',
  harassment:            '嫌がらせ',
  other:                 'その他',
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createClient()
  const statusFilter = (searchParams.status as ReportStatus) || 'pending'

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id, reason, status, created_at, detail,
      reporter:reporter_id(nickname),
      reported_user:reported_user_id(nickname)
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">通報管理</h1>
      <div className="flex gap-2 mb-6">
        {(['pending', 'reviewed', 'dismissed'] as ReportStatus[]).map((s) => (
          <Link
            key={s}
            href={`/dashboard/reports?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === s ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">通報者</th>
              <th className="text-left px-4 py-3">対象ユーザー</th>
              <th className="text-left px-4 py-3">理由</th>
              <th className="text-left px-4 py-3">日時</th>
              <th className="text-left px-4 py-3">ステータス</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3">{r.reporter?.nickname ?? '-'}</td>
                <td className="px-4 py-3">{r.reported_user?.nickname ?? '-'}</td>
                <td className="px-4 py-3">{REASON_LABEL[r.reason]}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLOR[r.status as ReportStatus]}`}>
                    {STATUS_LABEL[r.status as ReportStatus]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/reports/${r.id}`} className="text-amber-400 hover:underline text-xs">
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reports?.length && (
          <p className="text-center text-gray-500 py-12">通報はありません</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 通報詳細ページを作成する**

`Mistella-admin/app/dashboard/reports/[id]/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(id, nickname, avatar_url, role),
      reported_user:reported_user_id(id, nickname, avatar_url, role)
    `)
    .eq('id', params.id)
    .single()

  if (!report) redirect('/dashboard/reports')

  const REASON_LABEL: Record<string, string> = {
    spam: 'スパム', inappropriate_content: '不適切なコンテンツ',
    harassment: '嫌がらせ', other: 'その他',
  }

  async function updateStatus(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const status = formData.get('status') as string
    const { data: { user } } = await (await createClient()).auth.getUser()
    await admin.from('reports').update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq('id', params.id)
    redirect('/dashboard/reports')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">通報詳細</h1>
      <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">通報者</p>
            <p className="font-medium">{(report.reporter as any)?.nickname}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">対象ユーザー</p>
            <p className="font-medium">{(report.reported_user as any)?.nickname}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">理由</p>
          <p>{REASON_LABEL[report.reason]}</p>
        </div>
        {report.detail && (
          <div>
            <p className="text-xs text-gray-400 mb-1">補足</p>
            <p className="text-gray-300">{report.detail}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 mb-1">通報日時</p>
          <p>{new Date(report.created_at).toLocaleString('ja-JP')}</p>
        </div>
      </div>
      {report.status === 'pending' && (
        <div className="flex gap-3">
          <form action={updateStatus}>
            <input type="hidden" name="status" value="reviewed" />
            <button className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition">
              対応済みにする
            </button>
          </form>
          <form action={updateStatus}>
            <input type="hidden" name="status" value="dismissed" />
            <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition">
              却下する
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add Mistella-admin/app/dashboard/reports/
git commit -m "feat: 管理画面通報一覧・詳細ページ"
```

---

### Task 16: ユーザー管理ページを実装する（男性・女性共通）

**Files:**
- Create: `Mistella-admin/app/dashboard/users/male/page.tsx`
- Create: `Mistella-admin/app/dashboard/users/male/[id]/page.tsx`
- Create: `Mistella-admin/app/dashboard/users/female/page.tsx`
- Create: `Mistella-admin/app/dashboard/users/female/[id]/page.tsx`
- Create: `Mistella-admin/components/UserListPage.tsx`
- Create: `Mistella-admin/components/UserEditPage.tsx`

- [ ] **Step 1: 共通ユーザー一覧コンポーネントを作成する**

`Mistella-admin/components/UserListPage.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { AppUser } from '@/types'

interface Props {
  role: 'customer' | 'cast'
  basePath: string
}

export default async function UserListPage({ role, basePath }: Props) {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, bio, is_premium, is_blocked, created_at, avatar_url')
    .eq('role', role)
    .order('created_at', { ascending: false })

  const title = role === 'customer' ? '男性ユーザー一覧' : '女性ユーザー一覧'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">ニックネーム</th>
              <th className="text-left px-4 py-3">登録日</th>
              <th className="text-left px-4 py-3">プレミアム</th>
              <th className="text-left px-4 py-3">ステータス</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(users as AppUser[] ?? []).map((u) => (
              <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3 font-medium">{u.nickname}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-4 py-3">
                  {u.is_premium
                    ? <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">プレミアム</span>
                    : <span className="text-gray-500 text-xs">-</span>}
                </td>
                <td className="px-4 py-3">
                  {u.is_blocked
                    ? <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">ブロック中</span>
                    : <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">有効</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`${basePath}/${u.id}`} className="text-amber-400 hover:underline text-xs">編集</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 共通ユーザー編集コンポーネントを作成する**

`Mistella-admin/components/UserEditPage.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

interface Props {
  userId: string
  backPath: string
}

export default async function UserEditPage({ userId, backPath }: Props) {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) redirect(backPath)

  let castProfile = null
  if (user.role === 'cast') {
    const { data } = await supabase
      .from('cast_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    castProfile = data
  }

  async function saveUser(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    await admin.from('users').update({
      nickname:   formData.get('nickname') as string,
      bio:        formData.get('bio') as string || null,
      is_premium: formData.get('is_premium') === 'true',
      is_blocked: formData.get('is_blocked') === 'true',
    }).eq('id', userId)
    redirect(backPath)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">ユーザー編集</h1>
      <form action={saveUser} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">ニックネーム</label>
          <input
            name="nickname" defaultValue={user.nickname} required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">自己紹介</label>
          <textarea
            name="bio" defaultValue={user.bio ?? ''}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-none"
          />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-700">
          <span className="text-sm">プレミアム会員</span>
          <select
            name="is_premium" defaultValue={String(user.is_premium)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
          >
            <option value="false">OFF</option>
            <option value="true">ON</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-700">
          <span className="text-sm text-red-400">アカウントブロック</span>
          <select
            name="is_blocked" defaultValue={String(user.is_blocked)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
          >
            <option value="false">有効</option>
            <option value="true">ブロック中</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition"
          >
            保存する
          </button>
          <a href={backPath} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-center rounded-lg transition text-sm">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: 男性・女性のページファイルを作成する**

`Mistella-admin/app/dashboard/users/male/page.tsx`:
```typescript
import UserListPage from '@/components/UserListPage'
export default function MaleUsersPage() {
  return <UserListPage role="customer" basePath="/dashboard/users/male" />
}
```

`Mistella-admin/app/dashboard/users/male/[id]/page.tsx`:
```typescript
import UserEditPage from '@/components/UserEditPage'
export default function EditMalePage({ params }: { params: { id: string } }) {
  return <UserEditPage userId={params.id} backPath="/dashboard/users/male" />
}
```

`Mistella-admin/app/dashboard/users/female/page.tsx`:
```typescript
import UserListPage from '@/components/UserListPage'
export default function FemaleUsersPage() {
  return <UserListPage role="cast" basePath="/dashboard/users/female" />
}
```

`Mistella-admin/app/dashboard/users/female/[id]/page.tsx`:
```typescript
import UserEditPage from '@/components/UserEditPage'
export default function EditFemalePage({ params }: { params: { id: string } }) {
  return <UserEditPage userId={params.id} backPath="/dashboard/users/female" />
}
```

- [ ] **Step 4: コミット**

```bash
git add Mistella-admin/components/UserListPage.tsx Mistella-admin/components/UserEditPage.tsx \
        Mistella-admin/app/dashboard/users/
git commit -m "feat: 管理画面ユーザー一覧・編集ページ（男性・女性）"
```

---

### Task 17: お知らせ通知ページ + send-announcement Edge Function を実装する

**Files:**
- Create: `Mistella-admin/app/dashboard/announcements/page.tsx`
- Create: `Mistella-admin/app/dashboard/announcements/new/page.tsx`
- Create: `supabase/functions/send-announcement/index.ts`

- [ ] **Step 1: send-announcement Edge Function を作成する**

`supabase/functions/send-announcement/index.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AnnouncementPayload {
  announcement_id: string
  title: string
  body: string
  target_type: 'all_male' | 'all_female' | 'individual'
  target_user_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: AnnouncementPayload = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let tokensQuery = supabase.from('push_tokens').select('token, user:user_id(role)')

    if (payload.target_type === 'individual' && payload.target_user_id) {
      tokensQuery = tokensQuery.eq('user_id', payload.target_user_id)
    } else if (payload.target_type === 'all_male') {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer')
        .eq('is_blocked', false)
      const ids = users?.map((u: { id: string }) => u.id) ?? []
      tokensQuery = tokensQuery.in('user_id', ids)
    } else if (payload.target_type === 'all_female') {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'cast')
        .eq('is_blocked', false)
      const ids = users?.map((u: { id: string }) => u.id) ?? []
      tokensQuery = tokensQuery.in('user_id', ids)
    }

    const { data: tokens } = await tokensQuery
    if (!tokens || tokens.length === 0) {
      await supabase.from('announcements')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', payload.announcement_id)
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      sound: 'default',
    }))

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    })

    await supabase.from('announcements')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', payload.announcement_id)

    return new Response(JSON.stringify({ sent: messages.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Edge Function をデプロイする**

```bash
supabase functions deploy send-announcement --project-ref <YOUR_PROJECT_REF>
```

- [ ] **Step 3: お知らせ一覧ページを作成する**

`Mistella-admin/app/dashboard/announcements/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  const TARGET_LABEL: Record<string, string> = {
    all_male: '男性全員', all_female: '女性全員', individual: '個別',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">お知らせ管理</h1>
        <Link
          href="/dashboard/announcements/new"
          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg text-sm transition"
        >
          + 新規作成
        </Link>
      </div>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">タイトル</th>
              <th className="text-left px-4 py-3">送信先</th>
              <th className="text-left px-4 py-3">送信日時</th>
              <th className="text-left px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {(announcements ?? []).map((a: any) => (
              <tr key={a.id} className="border-t border-gray-700">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-gray-400">{TARGET_LABEL[a.target_type]}</td>
                <td className="px-4 py-3 text-gray-400">
                  {a.sent_at ? new Date(a.sent_at).toLocaleString('ja-JP') : '-'}
                </td>
                <td className="px-4 py-3">
                  {a.sent_at
                    ? <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">送信済み</span>
                    : <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">未送信</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!announcements?.length && (
          <p className="text-center text-gray-500 py-12">お知らせはありません</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: お知らせ作成ページを作成する**

`Mistella-admin/app/dashboard/announcements/new/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TargetType = 'all_male' | 'all_female' | 'individual'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('all_male')
  const [targetUserId, setTargetUserId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; nickname: string }[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!userSearch.trim()) return
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, nickname')
      .ilike('nickname', `%${userSearch}%`)
      .limit(10)
    setSearchResults(data ?? [])
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !body) return
    if (targetType === 'individual' && !targetUserId) {
      setError('個別送信の場合は対象ユーザーを選択してください。')
      return
    }
    setSending(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('認証エラー'); setSending(false); return }

    const { data: announcement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        title, body,
        target_type: targetType,
        target_user_id: targetType === 'individual' ? targetUserId : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError || !announcement) {
      setError('保存に失敗しました。')
      setSending(false)
      return
    }

    const { error: fnError } = await supabase.functions.invoke('send-announcement', {
      body: {
        announcement_id: announcement.id,
        title, body, target_type: targetType,
        target_user_id: targetType === 'individual' ? targetUserId : undefined,
      },
    })

    if (fnError) {
      setError('送信に失敗しました。')
      setSending(false)
      return
    }

    router.push('/dashboard/announcements')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">お知らせ作成</h1>
      <form onSubmit={handleSend} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">タイトル</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">本文</label>
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} required rows={4}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">送信先</label>
          <div className="flex gap-3">
            {([['all_male','男性全員'], ['all_female','女性全員'], ['individual','個別']] as const).map(([v, l]) => (
              <button
                key={v} type="button"
                onClick={() => setTargetType(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  targetType === v ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {targetType === 'individual' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">ユーザー検索</label>
            <div className="flex gap-2">
              <input
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ニックネームで検索"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
              />
              <button type="button" onClick={handleSearch}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition">
                検索
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="mt-2 bg-gray-900 rounded-lg border border-gray-700">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => { setTargetUserId(u.id); setUserSearch(u.nickname); setSearchResults([]) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition ${
                        targetUserId === u.id ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {u.nickname}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit" disabled={sending}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-bold rounded-lg transition"
        >
          {sending ? '送信中...' : '送信する'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: コミット**

```bash
git add supabase/functions/send-announcement/ \
        Mistella-admin/app/dashboard/announcements/
git commit -m "feat: お知らせ通知ページ・send-announcement Edge Function"
```

---

### Task 18: 店舗管理ページを実装する

**Files:**
- Create: `Mistella-admin/app/dashboard/shops/page.tsx`
- Create: `Mistella-admin/app/dashboard/shops/[userId]/page.tsx`

- [ ] **Step 1: 店舗一覧ページを作成する**

`Mistella-admin/app/dashboard/shops/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ShopsPage() {
  const supabase = await createClient()
  const { data: shops } = await supabase
    .from('cast_profiles')
    .select(`
      user_id, shop_name, shop_address, is_sponsored, work_status,
      user:user_id(nickname)
    `)
    .not('shop_name', 'is', null)
    .order('is_sponsored', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">店舗管理</h1>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">店舗名</th>
              <th className="text-left px-4 py-3">キャスト名</th>
              <th className="text-left px-4 py-3">住所</th>
              <th className="text-left px-4 py-3">Sponsored</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(shops ?? []).map((s: any) => (
              <tr key={s.user_id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3 font-medium">{s.shop_name}</td>
                <td className="px-4 py-3 text-gray-400">{s.user?.nickname}</td>
                <td className="px-4 py-3 text-gray-400">{s.shop_address ?? '-'}</td>
                <td className="px-4 py-3">
                  {s.is_sponsored
                    ? <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">ON</span>
                    : <span className="text-gray-500 text-xs">-</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/shops/${s.user_id}`} className="text-amber-400 hover:underline text-xs">
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shops?.length && (
          <p className="text-center text-gray-500 py-12">店舗情報が登録されていません</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 店舗編集ページを作成する**

`Mistella-admin/app/dashboard/shops/[userId]/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function ShopEditPage({ params }: { params: { userId: string } }) {
  const supabase = await createClient()

  const [{ data: shop }, { data: user }] = await Promise.all([
    supabase.from('cast_profiles').select('*').eq('user_id', params.userId).single(),
    supabase.from('users').select('nickname').eq('id', params.userId).single(),
  ])

  if (!shop) redirect('/dashboard/shops')

  async function saveShop(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    await admin.from('cast_profiles').update({
      shop_name:    formData.get('shop_name') as string || null,
      shop_address: formData.get('shop_address') as string || null,
      price_info:   formData.get('price_info') as string || null,
      is_sponsored: formData.get('is_sponsored') === 'true',
    }).eq('user_id', params.userId)
    redirect('/dashboard/shops')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-2">店舗編集</h1>
      <p className="text-gray-400 text-sm mb-6">キャスト: {(user as any)?.nickname}</p>
      <form action={saveShop} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">店舗名</label>
          <input
            name="shop_name" defaultValue={shop.shop_name ?? ''}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">住所</label>
          <input
            name="shop_address" defaultValue={shop.shop_address ?? ''}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">料金情報</label>
          <textarea
            name="price_info" defaultValue={shop.price_info ?? ''}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-none"
          />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-700">
          <span className="text-sm text-amber-400">Sponsoredバッジ</span>
          <select
            name="is_sponsored" defaultValue={String(shop.is_sponsored)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
          >
            <option value="false">OFF</option>
            <option value="true">ON</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition"
          >
            保存する
          </button>
          <a href="/dashboard/shops"
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-center rounded-lg transition text-sm">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add Mistella-admin/app/dashboard/shops/
git commit -m "feat: 管理画面店舗一覧・編集ページ"
```

---

## 動作確認チェックリスト

### Phase 1
- [ ] Supabase Dashboard でテーブルが作成されている（push_tokens, blocks, reports, announcements, users_admin）
- [ ] `users` テーブルに `is_blocked` カラムが追加されている
- [ ] RLS ポリシーが適用されている

### Phase 2
- [ ] 実機でアプリを起動してプッシュ通知の権限ダイアログが表示される
- [ ] `push_tokens` テーブルにレコードが作成される
- [ ] ProfileScreen から「通知設定」に遷移できる
- [ ] 通知設定画面でトグルの切り替えが `push_tokens` テーブルに反映される
- [ ] 2台の実機またはシミュレーター + 実機でメッセージ送信 → 通知が届く

### Phase 3a
- [ ] 他ユーザーのプロフィール画面で「…」ボタンが表示される
- [ ] 「通報する」からモーダルが開き、理由を選んで送信できる
- [ ] `reports` テーブルにレコードが作成される
- [ ] 「ブロックする」で `blocks` テーブルにレコードが作成され、前画面に戻る
- [ ] ブロック後、相手がタイムラインや検索から非表示になる

### Phase 3b
- [ ] `cd Mistella-admin && npm run dev` で起動する
- [ ] `/login` でメール/PWでログインできる（users_admin に登録済みのユーザー）
- [ ] `/dashboard` でユーザー数・通報数が表示される
- [ ] ユーザー編集でプレミアム/ブロックの切り替えが保存される
- [ ] 通報詳細で「対応済みにする」がクリックできる
- [ ] お知らせ作成で送信先を選んで送信するとプッシュ通知が届く
- [ ] 店舗編集で店舗名・is_sponsored が保存される

---

## 注意事項

1. **管理者アカウントの作成**: Supabase Dashboard > Authentication > Users から手動でユーザーを作成し、そのIDを `users_admin` テーブルに INSERT する
2. **Edge Function のデプロイ**: Supabase CLI で `supabase login` 後に `supabase functions deploy` を実行する
3. **expo-device**: iOS シミュレーターではプッシュ通知トークンが取得できない。実機でテストする
4. **`.env.local`**: `Mistella-admin/.env.local` はコミットしない（.gitignore 確認済み）
