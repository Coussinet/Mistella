import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !secretKey) {
		throw new Error('Supabase管理APIの環境変数が設定されていません。')
	}

	return createClient(
		url,
		secretKey,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
				detectSessionInUrl: false,
			},
		},
	)
}
