import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** CookieのAuthユーザーがusers_adminにも登録されているかをサーバーだけで検証する。 */
export async function getAdminContext() {
	const sessionClient = await createClient()
	const { data: { user }, error } = await sessionClient.auth.getUser()
	if (error || !user) return null

	const admin = createAdminClient()
	const { data: adminUser } = await admin
		.from('users_admin')
		.select('id, email, name')
		.eq('id', user.id)
		.maybeSingle()

	if (!adminUser) return null
	return { user, adminUser, admin, sessionClient }
}

/** Server Component / Server Action用。一般ユーザーの管理操作を必ず遮断する。 */
export async function requireAdmin() {
	const context = await getAdminContext()
	if (!context) redirect('/login?error=forbidden')
	return context
}
