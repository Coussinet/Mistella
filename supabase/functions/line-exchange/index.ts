// ============================================================
// Mistella - Edge Function: line-exchange
// アプリから認可コードを受け取り、LINEでトークン交換・id_token検証を行い、
// Supabase ユーザーを作成/特定して token_hash を返す。
// アプリが1回だけ呼ぶことで、認可コードの単回使用制約を守る。
//
// 必要な Secrets: LINE_CHANNEL_ID / LINE_CHANNEL_SECRET
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は自動付与)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 認可時と完全一致させる redirect_uri（line-callback の公開URL）
const REDIRECT_URI =
  'https://vmbspzivlcoxlmdgeawg.supabase.co/functions/v1/line-callback';

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { code, role } = await req.json();
    if (!code) return json({ error: 'code is required' }, 400);

    const channelId = Deno.env.get('LINE_CHANNEL_ID')!;
    const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET')!;
    const resolvedRole = role === 'cast' ? 'cast' : 'customer';

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
      return json(
        { error: 'token_exchange_failed', detail: `${token.error ?? ''}:${token.error_description ?? ''}` },
        401,
      );
    }

    // 2. id_token 検証
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: token.id_token, client_id: channelId }),
    });
    const profile = await verifyRes.json();
    if (!verifyRes.ok || !profile.sub) {
      return json({ error: 'verify_failed', detail: JSON.stringify(profile).slice(0, 200) }, 401);
    }

    const lineSub: string = profile.sub;
    const email: string = profile.email ?? `line_${lineSub}@line.mistella.app`;
    const nickname: string = profile.name ?? 'LINEユーザー';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 3. ユーザー作成（既存ならスキップ）。トリガーが users/cast_profiles を作成。
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: resolvedRole, nickname, line_sub: lineSub, provider: 'line' },
    });
    const isNew = !createErr;

    // 4. セッション確立用 token_hash を発行
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkErr || !linkData?.properties) {
      return json({ error: 'link_failed', detail: linkErr?.message }, 500);
    }

    return json({ token_hash: linkData.properties.hashed_token, is_new: isNew });
  } catch (e) {
    return json({ error: 'unexpected', detail: `${e}` }, 500);
  }
});
