// ============================================================
// Mistella - Auth Service
// ============================================================

import { supabase } from '../lib/supabase';
import type { CastProfile, User, UserRole } from '../types';

// -----------------------------------------------------------
// サインアップ
// -----------------------------------------------------------

/**
 * 新規ユーザー登録。
 * Supabase Auth でアカウントを作成し、users テーブルにプロフィール行を挿入する。
 */
export async function signUp(
  email: string,
  password: string,
  nickname: string,
  role: UserRole,
): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error('サインアップ後にユーザーIDが取得できませんでした。');

  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    role,
    nickname,
    avatar_url: null,
    bio: null,
    is_premium: false,
  });
  if (insertError) throw insertError;
}

// -----------------------------------------------------------
// ログイン
// -----------------------------------------------------------

/** メールアドレスとパスワードでログインする。 */
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// -----------------------------------------------------------
// パスワードリセット
// -----------------------------------------------------------

/** パスワードリセットメールを送信する。 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
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
