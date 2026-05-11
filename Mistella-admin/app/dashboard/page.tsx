import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
	const supabase = await createClient()

	const [
		{ count: maleCount },
		{ count: femaleCount },
		{ count: pendingReports },
	] = await Promise.all([
		supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
		supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'cast'),
		supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
	])

	const stats = [
		{ label: '男性ユーザー数', value: maleCount ?? 0,     color: 'text-blue-400' },
		{ label: '女性ユーザー数', value: femaleCount ?? 0,    color: 'text-pink-400' },
		{ label: '未対応の通報',   value: pendingReports ?? 0, color: 'text-red-400' },
	]

	return (
		<div>
			<h1 className="text-2xl font-bold mb-8">ダッシュボード</h1>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{stats.map((s) => (
					<div key={s.label} className="bg-gray-800 rounded-xl p-6">
						<p className="text-gray-400 text-sm mb-2">{s.label}</p>
						<p className={`text-4xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
					</div>
				))}
			</div>
		</div>
	)
}
