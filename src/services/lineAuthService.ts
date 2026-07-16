// ============================================================
// Mistella - LINE ログイン
// expo-auth-session で LINE OAuth 2.1 (OIDC) を実行して id_token を取得し、
// Edge Function `line-login` に渡して Supabase セッションを確立する。
//
// LINE Developers コンソールで、下記 makeRedirectUri が返すコールバックURL
// （EASビルドでは mistella://auth/line）を「コールバックURL」に登録すること。
// ============================================================

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

WebBrowser.maybeCompleteAuthSession();

// LINEログインチャネルのチャネルID（公開情報）
const LINE_CHANNEL_ID = '2010729150';

const LINE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize',
  tokenEndpoint: 'https://api.line.me/oauth2/v2.1/token',
};

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'mistella',
  path: 'auth/line',
});

/** LINE OAuth のコールバックURL（コンソール登録用に参照可能） */
export const LINE_REDIRECT_URI = redirectUri;

export interface LineLoginResult {
  profile: User | null;
  isNew: boolean;
}

/**
 * LINE ログインを実行する。
 * @param role 新規ユーザー作成時のロール（既存ユーザーは無視される）
 */
export async function signInWithLine(
  role: 'cast' | 'customer' = 'customer',
): Promise<LineLoginResult> {
  // 1. LINE の認可リクエスト（PKCE 付き）
  const request = new AuthSession.AuthRequest({
    clientId: LINE_CHANNEL_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ['profile', 'openid', 'email'],
    usePKCE: true,
  });

  const result = await request.promptAsync(LINE_DISCOVERY);

  if (result.type !== 'success' || !result.params.code) {
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('cancelled');
    }
    throw new Error('LINEログインに失敗しました。');
  }

  // 2. 認可コードをトークンに交換
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: LINE_CHANNEL_ID,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : {},
    },
    LINE_DISCOVERY,
  );

  const idToken = tokenResult.idToken;
  if (!idToken) {
    throw new Error('LINEのIDトークンを取得できませんでした。');
  }

  // 3. Edge Function で検証し、セッション確立用の token_hash を取得
  const { data, error } = await supabase.functions.invoke('line-login', {
    body: { id_token: idToken, role },
  });
  if (error) throw new Error('LINEログインの検証に失敗しました。');
  const { email, token_hash, is_new } = data as {
    email: string;
    token_hash: string;
    is_new: boolean;
  };

  // 4. token_hash で Supabase セッションを確立
  // （generateLink type:'magiclink' に対応する検証タイプ）
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash,
  });
  if (verifyErr) throw verifyErr;

  // 5. プロフィール取得（トリガーで作成済み）
  const { data: sessionData } = await supabase.auth.getUser();
  let profile: User | null = null;
  if (sessionData.user) {
    const { data: p } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .maybeSingle();
    profile = (p as unknown as User) ?? null;
  }

  return { profile, isNew: !!is_new, email } as LineLoginResult & { email: string };
}
