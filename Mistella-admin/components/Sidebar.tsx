'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
	{ href: '/dashboard',               label: 'ダッシュボード', icon: '📊' },
	{ href: '/dashboard/reports',       label: '通報管理',       icon: '🚨' },
	{ href: '/dashboard/users/male',    label: '男性ユーザー',   icon: '👤' },
	{ href: '/dashboard/users/female',  label: '女性ユーザー',   icon: '👤' },
	{ href: '/dashboard/announcements', label: 'お知らせ',       icon: '📢' },
	{ href: '/dashboard/shops',         label: '店舗管理',       icon: '🏪' },
]

export default function Sidebar() {
	const pathname = usePathname()
	const router = useRouter()

	const handleSignOut = async () => {
		const supabase = createClient()
		await supabase.auth.signOut()
		router.push('/login')
	}

	return (
		<aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
			<div className="p-4 border-b border-gray-800">
				<span className="text-amber-400 font-bold text-lg">Mistella Admin</span>
			</div>
			<nav className="flex-1 p-3 space-y-1">
				{NAV_ITEMS.map((item) => (
					<Link
						key={item.href} href={item.href}
						className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
							pathname === item.href
								? 'bg-amber-500 text-gray-900 font-semibold'
								: 'text-gray-300 hover:bg-gray-800'
						}`}
					>
						<span>{item.icon}</span>
						{item.label}
					</Link>
				))}
			</nav>
			<div className="p-3 border-t border-gray-800">
				<button
					onClick={handleSignOut}
					className="w-full text-sm text-gray-400 hover:text-white py-2 rounded-lg hover:bg-gray-800 transition"
				>
					ログアウト
				</button>
			</div>
		</aside>
	)
}
