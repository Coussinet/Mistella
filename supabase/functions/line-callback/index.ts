// ============================================================
// Mistella - Edge Function: line-callback
// LINEログイン(ウェブ)のコールバック先(https)。
// ここでは認可コードの交換は行わず、コードをアプリのカスタムスキーム
// (mistella://auth/line) へ転送するだけにする。
// （交換はアプリが line-exchange を1回だけ呼んで行う。認可コードは
//   単回使用のため、中継ページの二重読み込みでコードを消費しないようにする）
//
// LINE コンソールの「コールバックURL」にこの関数のURLを登録する:
//   https://<project-ref>.supabase.co/functions/v1/line-callback
// ============================================================

const APP_RETURN = 'mistella://auth/line';

function redirectToApp(params: Record<string, string>): Response {
  const qs = new URLSearchParams(params).toString();
  const target = `${APP_RETURN}?${qs}`;
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
</head><body>Mistella に戻っています…</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const lineError = url.searchParams.get('error');

  if (lineError) return redirectToApp({ error: lineError, state });
  if (!code) return redirectToApp({ error: 'no_code', state });

  // コードはそのままアプリへ転送（交換はしない）
  return redirectToApp({ code, state });
});
