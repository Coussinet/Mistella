import { redirect } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'
import { requireAdmin } from '@/lib/admin/auth'
import { deleteUserCompletely } from '@/lib/admin/userDeletion'

interface Props {
	userId: string
	backPath: string
}

export default async function UserEditPage({ userId, backPath }: Props) {
	const { admin: supabase } = await requireAdmin()

	const { data: user } = await supabase
		.from('users')
		.select('*')
		.eq('id', userId)
		.single()

	if (!user) redirect(backPath)

	let castProfile = null
	let customerProfile = null
	if (user.role === 'cast') {
		const { data } = await supabase
			.from('cast_profiles')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle()
		castProfile = data
	} else {
		const { data } = await supabase
			.from('customer_profiles')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle()
		customerProfile = data
	}

	async function saveUser(formData: FormData) {
		'use server'
		const { admin } = await requireAdmin()
		await admin.from('users').update({
			nickname:   formData.get('nickname') as string,
			bio:        formData.get('bio') as string || null,
			is_premium: formData.get('is_premium') === 'true',
			is_blocked: formData.get('is_blocked') === 'true',
		}).eq('id', userId)

		if (user.role === 'cast') {
			await admin.from('cast_profiles').upsert({
				user_id: userId,
				age: nullableNumber(formData.get('age')),
				shop_name: nullableText(formData.get('shop_name')),
				shop_address: nullableText(formData.get('shop_address')),
				price_info: nullableText(formData.get('price_info')),
				hobbies: nullableText(formData.get('hobbies')),
				customer_message: nullableText(formData.get('customer_message')),
			}, { onConflict: 'user_id' })
		} else {
			await admin.from('customer_profiles').upsert({
				user_id: userId,
				age: nullableNumber(formData.get('age')),
				occupation: nullableText(formData.get('occupation')),
				annual_income: nullableText(formData.get('annual_income')),
				hobbies: nullableText(formData.get('hobbies')),
				preferred_area: nullableText(formData.get('preferred_area')),
				appeal_message: nullableText(formData.get('appeal_message')),
			}, { onConflict: 'user_id' })
		}
		redirect(backPath)
	}

	async function deleteUser() {
		'use server'
		const { admin } = await requireAdmin()
		await deleteUserCompletely(admin, userId)
		redirect(backPath)
	}

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">ユーザー編集</h1>
			<form action={saveUser} className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
				<div>
					<label className="block text-sm text-gray-400 mb-1">ニックネーム</label>
					<input
						name="nickname" defaultValue={user.nickname} required
						className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
					/>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
					<Field name="age" label="年齢" type="number" defaultValue={castProfile?.age ?? customerProfile?.age ?? ''} />
					{user.role === 'cast' ? (
						<>
							<Field name="shop_name" label="店舗名" defaultValue={castProfile?.shop_name ?? ''} />
							<Field name="shop_address" label="店舗住所" defaultValue={castProfile?.shop_address ?? ''} />
							<Field name="price_info" label="料金情報" defaultValue={castProfile?.price_info ?? ''} />
							<Field name="hobbies" label="趣味" defaultValue={castProfile?.hobbies ?? ''} />
							<Field name="customer_message" label="お客様へのメッセージ" defaultValue={castProfile?.customer_message ?? ''} />
						</>
					) : (
						<>
							<Field name="occupation" label="職業" defaultValue={customerProfile?.occupation ?? ''} />
							<Field name="annual_income" label="年収帯" defaultValue={customerProfile?.annual_income ?? ''} />
							<Field name="hobbies" label="趣味" defaultValue={customerProfile?.hobbies ?? ''} />
							<Field name="preferred_area" label="希望エリア" defaultValue={customerProfile?.preferred_area ?? ''} />
							<Field name="appeal_message" label="アピールメッセージ" defaultValue={customerProfile?.appeal_message ?? ''} />
						</>
					)}
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
			<div className="mt-8 border border-red-500/30 bg-red-500/5 rounded-2xl p-5">
				<h2 className="font-bold text-red-300">完全削除</h2>
				<p className="text-sm text-gray-400 mt-1 mb-4">プロフィール、投稿、メッセージ、画像、ログインアカウントを削除します。この操作は取り消せません。</p>
				<form action={deleteUser}>
					<ConfirmSubmitButton
						message={`${user.nickname}さんを完全に削除します。よろしいですか？`}
						className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold"
					>
						ユーザーを完全に削除
					</ConfirmSubmitButton>
				</form>
			</div>
		</div>
	)
}

function nullableText(value: FormDataEntryValue | null) {
	const text = String(value ?? '').trim()
	return text || null
}

function nullableNumber(value: FormDataEntryValue | null) {
	const text = String(value ?? '').trim()
	return text ? Number(text) : null
}

function Field({
	name,
	label,
	defaultValue,
	type = 'text',
}: {
	name: string
	label: string
	defaultValue: string | number
	type?: 'text' | 'number'
}) {
	return (
		<div>
			<label className="block text-sm text-gray-400 mb-1">{label}</label>
			<input
				name={name}
				type={type}
				defaultValue={defaultValue}
				className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
			/>
		</div>
	)
}
