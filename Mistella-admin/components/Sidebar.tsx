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
	{ href: '/dashboard/posts',         label: '投稿管理',       icon: '▦' },
	{ href: '/dashboard/blocks',        label: 'ブロック確認',   icon: '⊘' },
	{ href: '/dashboard/shops',         label: '店舗管理',       icon: '🏪' },
]

export default function Sidebar({ adminName }: { adminName: string }) {
	const pathname = usePathname()
	const router = useRouter()

	const handleSignOut = async () => {
		const supabase = createClient()
		await supabase.auth.signOut()
		router.push('/login')
	}

	return (
		<aside className="w-60 min-h-screen bg-gray-950/90 border-r border-white/10 flex flex-col sticky top-0">
			<div className="p-5 border-b border-white/10">
				<span className="text-amber-300 font-bold text-lg tracking-wide">Mistella</span>
				<p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mt-1">Operations Console</p>
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
			<div className="p-3 border-t border-white/10">
				<p className="px-3 pb-2 text-xs text-gray-500 truncate">{adminName}</p>
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
