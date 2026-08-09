import type { SupabaseClient } from '@supabase/supabase-js'
import {
	parseStoragePublicUrl,
	removeStorageTargets,
	removeStorageTree,
} from '@/lib/admin/storage'

/** DB・Storage・Authの順序を管理し、利用ユーザーを稼働データから完全削除する。 */
export async function deleteUserCompletely(admin: SupabaseClient, userId: string) {
	const [userResult, photosResult, timelinesResult, matchesResult] = await Promise.all([
		admin.from('users').select('avatar_url').eq('id', userId).maybeSingle(),
		admin.from('profile_photos').select('photo_url').eq('user_id', userId),
		admin.from('timelines').select('media_url').eq('user_id', userId),
		admin.from('matches').select('id').or(`customer_id.eq.${userId},cast_id.eq.${userId}`),
	])

	const matchIds = (matchesResult.data ?? []).map((match) => match.id)
	const messagesResult = matchIds.length
		? await admin.from('messages').select('image_url').in('match_id', matchIds)
		: { data: [] as { image_url: string | null }[] }

	const referencedUrls = [
		userResult.data?.avatar_url,
		...(photosResult.data ?? []).map((photo) => photo.photo_url),
		...(timelinesResult.data ?? []).map((timeline) => timeline.media_url),
		...(messagesResult.data ?? []).map((message) => message.image_url),
	]
	const targets = referencedUrls
		.map((url) => parseStoragePublicUrl(url))
		.filter((target): target is NonNullable<typeof target> => target !== null)
	await removeStorageTargets(admin, targets)

	// URL参照が壊れている孤立ファイルも、現行/旧パスの両方から回収する。
	await Promise.all([
		removeStorageTree(admin, 'avatars', userId),
		removeStorageTree(admin, 'profile-photos', userId),
		removeStorageTree(admin, 'media', `${userId}/timelines`),
		removeStorageTree(admin, 'media', `timelines/${userId}`),
		removeStorageTree(admin, 'chat-images', userId),
	])

	// SET NULLになる個別お知らせは、ユーザーを特定できるうちに削除する。
	const { error: announcementError } = await admin
		.from('announcements')
		.delete()
		.eq('target_user_id', userId)
	if (announcementError) throw announcementError

	const { error: profileError } = await admin.from('users').delete().eq('id', userId)
	if (profileError) throw profileError

	// デモ表示専用ユーザーはauth.usersに存在しないため、その場合はDB削除で完了。
	const { data: authUser } = await admin.auth.admin.getUserById(userId)
	if (authUser.user) {
		const { error: authError } = await admin.auth.admin.deleteUser(userId, false)
		if (authError) throw authError
	}
}
