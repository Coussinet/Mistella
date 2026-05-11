import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
	recipient_user_id: string;
	title: string;
	body: string;
	notification_key: 'notification_messages' | 'notification_matches' | 'notification_likes' | 'notification_tonight_requests' | 'notification_tonight_responses';
	data?: Record<string, string>;
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
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
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
			headers: { 'Content-Type': 'application/json', ...corsHeaders },
		})
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders },
		})
	}
})
