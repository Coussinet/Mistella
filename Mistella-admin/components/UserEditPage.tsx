import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

interface Props {
	userId: string
	backPath: string
}

export default async function UserEditPage({ userId, backPath }: Props) {
	const supabase = await createClient()

	const { data: user } = await supabase
		.from('users')
		.select('*')
		.eq('id', userId)
		.single()

	if (!user) redirect(backPath)

	let castProfile = null
	if (user.role === 'cast') {
		const { data } = await supabase
			.from('cast_profiles')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle()
		castProfile = data
	}

	async function saveUser(formData: FormData) {
		'use server'
		const admin = createAdminClient()
		await admin.from('users').update({
			nickname:   formData.get('nickname') as string,
			bio:        formData.get('bio') as string || null,
			is_premium: formData.get('is_premium') === 'true',
			is_blocked: formData.get('is_blocked') === 'true',
		}).eq('id', userId)
		redirect(backPath)
	}

	return (
		<div className="max-w-lg">
			<h1 className="text-2xl font-bold mb-6">ユーザー編集</h1>
			<form action={saveUser} className="bg-gray-800 rounded-xl p-6 space-y-4">
				<div>
					<label className="block text-sm text-gray-400 mb-1">ニックネーム</label>
					<input
						name="nickname" defaultValue={user.nickname} required
						className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
					/>
				</div>
				<div>
					<label className="block text-sm text-gray-400 mb-1">自己紹介</label>
					<textarea
						name="bio" defaultValue={user.bio ?? ''}
						rows={3}
						className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-none"
					/>
				</div>
				<div className="flex items-center justify-between py-2 border-t border-gray-700">
					<span className="text-sm">プレミアム会員</span>
					<select
						name="is_premium" defaultValue={String(user.is_premium)}
						className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
					>
						<option value="false">OFF</option>
						<option value="true">ON</option>
					</select>
				</div>
				<div className="flex items-center justify-between py-2 border-t border-gray-700">
					<span className="text-sm text-red-400">アカウントブロック</span>
					<select
						name="is_blocked" defaultValue={String(user.is_blocked)}
						className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
					>
						<option value="false">有効</option>
						<option value="true">ブロック中</option>
					</select>
				</div>
				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition"
					>
						保存する
					</button>
					<a href={backPath} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-center rounded-lg transition text-sm">
						キャンセル
					</a>
				</div>
			</form>
		</div>
	)
}
