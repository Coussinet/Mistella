import { requireAdmin } from '@/lib/admin/auth'

export default async function DashboardPage() {
	const { admin: supabase } = await requireAdmin()

	const [
		{ count: maleCount },
		{ count: femaleCount },
		{ count: pendingReports },
		{ count: postsCount },
		{ count: blocksCount },
	] = await Promise.all([
		supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
		supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'cast'),
		supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
		supabase.from('timelines').select('*', { count: 'exact', head: true }),
		supabase.from('blocks').select('*', { count: 'exact', head: true }),
	])

	const stats = [
		{ label: '男性ユーザー数', value: maleCount ?? 0,     color: 'text-blue-400' },
		{ label: '女性ユーザー数', value: femaleCount ?? 0,    color: 'text-pink-400' },
		{ label: '未対応の通報',   value: pendingReports ?? 0, color: 'text-red-400' },
		{ label: '公開・保存中の投稿', value: postsCount ?? 0, color: 'text-violet-400' },
		{ label: 'ブロック関係', value: blocksCount ?? 0, color: 'text-orange-400' },
	]

	return (
		<div>
			<h1 className="text-2xl font-bold mb-8">ダッシュボード</h1>
			<p className="text-sm text-gray-500 mb-8">ユーザーとコンテンツの現在状況</p>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
				{stats.map((s) => (
					<div key={s.label} className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 shadow-xl">
						<p className="text-gray-400 text-sm mb-2">{s.label}</p>
						<p className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
					</div>
				))}
			</div>
		</div>
	)
}
