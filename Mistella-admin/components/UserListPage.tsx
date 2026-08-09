import Link from 'next/link'
import type { AppUser } from '@/types'
import { requireAdmin } from '@/lib/admin/auth'

interface Props {
	role: 'customer' | 'cast'
	basePath: string
}

export default async function UserListPage({ role, basePath }: Props) {
	const { admin: supabase } = await requireAdmin()
	const { data: users } = await supabase
		.from('users')
		.select('id, nickname, bio, is_premium, is_blocked, created_at, avatar_url')
		.eq('role', role)
		.order('created_at', { ascending: false })

	const title = role === 'customer' ? '男性ユーザー一覧' : '女性ユーザー一覧'

	return (
		<div>
			<h1 className="text-2xl font-bold mb-2">{title}</h1>
			<p className="text-sm text-gray-500 mb-6">編集、利用停止、完全削除を管理できます。</p>
			<div className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-700 text-gray-400">
						<tr>
							<th className="text-left px-4 py-3">ニックネーム</th>
							<th className="text-left px-4 py-3">登録日</th>
							<th className="text-left px-4 py-3">プレミアム</th>
							<th className="text-left px-4 py-3">ステータス</th>
							<th className="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{(users as AppUser[] ?? []).map((u) => (
							<tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
								<td className="px-4 py-3 font-medium">
									<div>{u.nickname}</div>
									<div className="text-[10px] text-gray-600 font-mono">{u.id}</div>
								</td>
								<td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
								<td className="px-4 py-3">
									{u.is_premium
										? <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">プレミアム</span>
										: <span className="text-gray-500 text-xs">-</span>}
								</td>
								<td className="px-4 py-3">
									{u.is_blocked
										? <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">ブロック中</span>
										: <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">有効</span>}
								</td>
								<td className="px-4 py-3">
									<Link href={`${basePath}/${u.id}`} className="text-amber-400 hover:underline text-xs">編集</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
