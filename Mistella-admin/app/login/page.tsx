'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		const supabase = createClient()

		const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
		if (signInError || !data.user) {
			setError('メールアドレスまたはパスワードが正しくありません。')
			setLoading(false)
			return
		}

		const response = await fetch('/api/admin/session', { cache: 'no-store' })
		if (!response.ok) {
			await supabase.auth.signOut()
			setError('管理者権限がありません。')
			setLoading(false)
			return
		}

		router.push('/dashboard')
		router.refresh()
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,#282116_0%,#080b12_45%)]">
			<div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-950/75 backdrop-blur-xl p-8 shadow-2xl">
				<p className="text-center text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-2">Operations Console</p>
				<h1 className="text-2xl font-bold text-center mb-8 text-amber-300">Mistella 管理画面</h1>
				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
						<input
							type="email" value={email} onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-400 mb-1">パスワード</label>
						<input
							type="password" value={password} onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
						/>
					</div>
					{error && <p className="text-red-400 text-sm">{error}</p>}
					<button
						type="submit" disabled={loading}
						className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-bold rounded-lg transition"
					>
						{loading ? 'ログイン中...' : 'ログイン'}
					</button>
				</form>
			</div>
		</div>
	)
}
