// ============================================================
// Mistella - Auth Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import type { CastProfile, CustomerProfile, User, UserRole } from '@/types';

// -----------------------------------------------------------
// サインアップ
// -----------------------------------------------------------

/**
 * 新規ユーザー登録。
 * role・nickname をメタデータとして渡し、DBトリガー on_auth_user_created が
 * users / cast_profiles を自動作成する。
 * メール確認が必要な設定の場合 session は null になる。
 */
export async function signUp(
  email: string,
  password: string,
  nickname: string,
  role: UserRole,
): Promise<{ session: Session | null; user: SupabaseAuthUser; needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, nickname },
      // メール確認リンクからアプリに戻すためのディープリンク
      emailRedirectTo: 'mistella://auth/confirm',
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('アカウントの作成に失敗しました。');
  // Supabase 側でメール確認が有効な場合、session は null になる
  return {
    session: data.session,
    user: data.user,
    needsEmailConfirmation: data.session === null,
  };
}

// -----------------------------------------------------------
// ログイン
// -----------------------------------------------------------

/** メールアドレスとパスワードでログインし、セッションとプロフィールを返す。 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ session: Session; user: SupabaseAuthUser; profile: User | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session || !data.user) throw new Error('ログインに失敗しました。');

  let profile: User | null = null;
  try {
    profile = await getProfile(data.user.id);
  } catch {
    // プロフィール未作成でもログイン自体は成立させる（App 側の再取得に任せる）
  }
  return { session: data.session, user: data.user, profile };
}

// -----------------------------------------------------------
// パスワードリセット
// -----------------------------------------------------------

/** パスワードリセットメールを送信する。 */
export async function resetPassword(
  email: string,
  redirectTo?: string,
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );
  if (error) throw error;
}

// -----------------------------------------------------------
// プロフィール取得
// -----------------------------------------------------------

/** users テーブルからプロフィールを取得する。 */
export async function getProfile(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (!data) throw new Error('プロフィールが見つかりませんでした。');
  return data as User;
}

// -----------------------------------------------------------
// プロフィール更新
// -----------------------------------------------------------

/** users テーブルのプロフィールを部分更新する。 */
export async function updateProfile(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('更新後のプロフィールが取得できませんでした。');
  return data as User;
}

// -----------------------------------------------------------
// キャストプロフィール取得
// -----------------------------------------------------------

/** cast_profiles テーブルからキャストプロフィールを取得する。 */
export async function getCastProfile(userId: string): Promise<CastProfile> {
  const { data, error } = await supabase
    .from('cast_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  if (!data) throw new Error('キャストプロフィールが見つかりませんでした。');
  return data as CastProfile;
}

// -----------------------------------------------------------
// キャストプロフィール作成/更新
// -----------------------------------------------------------

/** cast_profiles テーブルへ UPSERT する。 */
export async function upsertCastProfile(
  userId: string,
  profile: Partial<CastProfile>,
): Promise<CastProfile> {
  const { data, error } = await supabase
    .from('cast_profiles')
    .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('キャストプロフィールの保存に失敗しました。');
  return data as CastProfile;
}

// -----------------------------------------------------------
// 顧客プロフィール取得
// -----------------------------------------------------------

/** customer_profiles テーブルから顧客プロフィールを取得する。 */
export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as CustomerProfile | null;
}

// -----------------------------------------------------------
// 顧客プロフィール作成/更新
// -----------------------------------------------------------

/** customer_profiles テーブルへ UPSERT する。 */
export async function upsertCustomerProfile(
  userId: string,
  profile: Partial<CustomerProfile>,
): Promise<CustomerProfile> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('顧客プロフィールの保存に失敗しました。');
  return data as CustomerProfile;
}
