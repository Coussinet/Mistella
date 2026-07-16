// ============================================================
// Mistella - Edge Function: line-login
// LINEログインのIDトークンを検証し、対応する Supabase ユーザーを
// 作成/特定して、クライアントがセッションを確立するための
// token_hash を返す。
//
// 必要な Secrets:
//   - LINE_CHANNEL_ID     : LINEログインチャネルのチャネルID
//   - SUPABASE_URL        : (自動付与)
//   - SUPABASE_SERVICE_ROLE_KEY : (自動付与)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { id_token, role, nickname } = await req.json();
    if (!id_token) return json({ error: 'id_token is required' }, 400);

    const channelId = Deno.env.get('LINE_CHANNEL_ID');
    if (!channelId) return json({ error: 'LINE_CHANNEL_ID not configured' }, 500);

    // 1. LINE で id_token を検証（audience = チャネルID の一致も検証される）
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token, client_id: channelId }),
    });
    const lineProfile = await verifyRes.json();
    if (!verifyRes.ok || !lineProfile.sub) {
      return json({ error: 'LINE token verification failed', detail: lineProfile }, 401);
    }

    const lineSub: string = lineProfile.sub;
    const lineName: string | undefined = lineProfile.name;
    const lineEmail: string | undefined = lineProfile.email;
    // メール未取得時は LINE の sub から安定した内部メールを生成
    const email = lineEmail ?? `line_${lineSub}@line.mistella.app`;
    const resolvedNickname = (nickname as string) || lineName || 'LINEユーザー';
    const resolvedRole = role === 'cast' ? 'cast' : 'customer';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 2. ユーザーを作成（既存なら既存を使う）。
    //    on_auth_user_created トリガーが public.users / cast_profiles を作成する。
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        role: resolvedRole,
        nickname: resolvedNickname,
        line_sub: lineSub,
        provider: 'line',
      },
    });
    // 既存ユーザー（email_exists）はエラーにしない
    if (createErr && !`${createErr.message}`.toLowerCase().includes('already')) {
      // createUser が別要因で失敗した場合のみエラー
      const code = (createErr as { code?: string }).code;
      if (code !== 'email_exists') {
        return json({ error: 'user creation failed', detail: createErr.message }, 500);
      }
    }

    // 3. セッション確立用のトークンを発行（generateLink の token_hash を返す）
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkErr || !linkData?.properties) {
      return json({ error: 'link generation failed', detail: linkErr?.message }, 500);
    }

    return json({
      email,
      token_hash: linkData.properties.hashed_token,
      is_new: !createErr, // createErr が無ければ新規作成
    });
  } catch (e) {
    return json({ error: 'unexpected error', detail: `${e}` }, 500);
  }
});
