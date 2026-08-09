import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AnnouncementPayload {
  announcement_id: string
  title: string
  body: string
  target_type: 'all' | 'all_male' | 'all_female' | 'individual'
  target_user_id?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const payload: AnnouncementPayload = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const caller = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authorization } } },
    )
    const { data: { user } } = await caller.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    )
    const { data: adminUser } = await supabase
      .from('users_admin')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    let tokensQuery = supabase.from('push_tokens').select('token, user:user_id(role)')

    if (payload.target_type === 'individual' && payload.target_user_id) {
      tokensQuery = tokensQuery.eq('user_id', payload.target_user_id)
    } else if (payload.target_type === 'all') {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('is_blocked', false)
      const ids = users?.map((u: { id: string }) => u.id) ?? []
      tokensQuery = tokensQuery.in('user_id', ids)
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
