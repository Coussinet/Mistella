// ============================================================
// Mistella - Edge Function: line-callback
// LINEログイン(ウェブ)のコールバック先(https)。
// 認可コードをサーバー側でトークンに交換し、id_token を検証、
// Supabase ユーザーを作成/特定して token_hash を発行、
// アプリのカスタムスキーム(mistella://auth/line)へ戻す。
//
// LINE コンソールの「コールバックURL」にこの関数のURLを登録する:
//   https://<project-ref>.supabase.co/functions/v1/line-callback
//
// 必要な Secrets: LINE_CHANNEL_ID / LINE_CHANNEL_SECRET
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は自動付与)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_RETURN = 'mistella://auth/line';
// LINE に登録したコールバックURL。トークン交換の redirect_uri は
// 認可時と完全一致させる必要があるため固定値を使う（req.url からの再構築は不可）。
const REDIRECT_URI =
  'https://vmbspzivlcoxlmdgeawg.supabase.co/functions/v1/line-callback';

/** アプリへ戻すHTML(カスタムスキームへ即リダイレクト) */
function redirectToApp(params: Record<string, string>): Response {
  const qs = new URLSearchParams(params).toString();
  const target = `${APP_RETURN}?${qs}`;
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
</head><body>Mistella に戻っています…</body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const lineError = url.searchParams.get('error');

  if (lineError) {
    return redirectToApp({ error: lineError, state });
  }
  if (!code) {
    return redirectToApp({ error: 'no_code', state });
  }

  // state は "<nonce>:<role>" 形式。role は新規作成時のみ使用。
  const role = state.split(':')[1] === 'cast' ? 'cast' : 'customer';

  const channelId = Deno.env.get('LINE_CHANNEL_ID')!;
  const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET')!;

  try {
    // 1. 認可コード → トークン交換
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.id_token) {
      // LINE のエラー詳細を診断用に返す
      return redirectToApp({
        error: 'token_exchange_failed',
        detail: `${token.error ?? ''}:${token.error_description ?? ''}`.slice(0, 200),
        state,
      });
    }

    // 2. id_token 検証
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: token.id_token, client_id: channelId }),
    });
    const profile = await verifyRes.json();
    if (!verifyRes.ok || !profile.sub) {
      return redirectToApp({ error: 'verify_failed', state });
    }

    const lineSub: string = profile.sub;
    const email: string = profile.email ?? `line_${lineSub}@line.mistella.app`;
    const nickname: string = profile.name ?? 'LINEユーザー';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 3. ユーザー作成(既存ならスキップ)。トリガーが users/cast_profiles を作成。
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role, nickname, line_sub: lineSub, provider: 'line' },
    });
    const isNew = !createErr;

    // 4. セッション確立用 token_hash を発行
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkErr || !linkData?.properties) {
      return redirectToApp({ error: 'link_failed', state });
    }

    // 5. アプリへ戻す
    return redirectToApp({
      token_hash: linkData.properties.hashed_token,
      state,
      is_new: isNew ? '1' : '0',
    });
  } catch (_e) {
    return redirectToApp({ error: 'unexpected', state });
  }
});
