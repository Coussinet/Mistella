// ============================================================
// Mistella - LINE ログイン
// LINE のコールバックURLは https 必須のため、Edge Function `line-callback`
// を中継ページとして使う:
//   アプリ → LINE認可 → line-callback(https) → mistella://auth/line へ復帰
// line-callback がサーバー側でトークン交換・検証・ユーザー作成・token_hash
// 発行まで行うので、アプリは token_hash を verifyOtp するだけ。
//
// LINE Developers コンソール「LINEログイン設定」→「ウェブアプリでLINEログインを
// 利用する」→ コールバックURL に以下を登録すること:
//   https://vmbspzivlcoxlmdgeawg.supabase.co/functions/v1/line-callback
// ============================================================

import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// LINEログインチャネルのチャネルID（公開情報）
const LINE_CHANNEL_ID = '2010729150';
const CALLBACK_URL =
  'https://vmbspzivlcoxlmdgeawg.supabase.co/functions/v1/line-callback';
const APP_RETURN_URL = 'mistella://auth/line';

/** カスタムスキームURLのクエリを取り出す（Hermes の URL 非対応を回避した簡易パーサ） */
function parseQuery(url: string): Record<string, string> {
  const q = url.indexOf('?');
  const out: Record<string, string> = {};
  if (q === -1) return out;
  for (const pair of url.slice(q + 1).split('&')) {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
}

/**
 * LINE ログインを実行する。
 * @param role 新規ユーザー作成時のロール（既存ユーザーは無視される）
 * 成功時は Supabase セッションが確立され、App.tsx の onAuthStateChange が
 * 自動でログイン処理を行う。
 */
export async function signInWithLine(role: 'cast' | 'customer'): Promise<void> {
  const nonce = Crypto.randomUUID();
  const state = `${nonce}:${role}`;

  const authUrl =
    'https://access.line.me/oauth2/v2.1/authorize?response_type=code' +
    `&client_id=${LINE_CHANNEL_ID}` +
    `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent('profile openid')}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_RETURN_URL);

  if (result.type !== 'success' || !result.url) {
    throw new Error('cancelled');
  }

  const params = parseQuery(result.url);
  if (params.error) {
    throw new Error('LINEログインに失敗しました。');
  }
  // CSRF 対策: 戻ってきた state が送信した値と一致するか検証
  if (params.state !== state) {
    throw new Error('認証状態が一致しませんでした。もう一度お試しください。');
  }
  if (!params.token_hash) {
    throw new Error('LINEログインの認証に失敗しました。');
  }

  // token_hash で Supabase セッションを確立
  const { error } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: params.token_hash,
  });
  if (error) throw error;
}
