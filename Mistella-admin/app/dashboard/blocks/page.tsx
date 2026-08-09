import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'

export default async function BlocksPage() {
  const { admin } = await requireAdmin()
  const { data: blocks } = await admin
    .from('blocks')
    .select(`
      id, created_at,
      blocker:blocker_id(id, nickname, role),
      blocked:blocked_id(id, nickname, role)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">ブロック確認</h1>
      <p className="text-sm text-gray-500 mb-6">誰が誰をブロックしているかを確認できます。</p>
      <div className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="text-left px-5 py-3">ブロックしたユーザー</th>
              <th className="text-left px-5 py-3">対象ユーザー</th>
              <th className="text-left px-5 py-3">日時</th>
            </tr>
          </thead>
          <tbody>
            {(blocks ?? []).map((row: any) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-5 py-4"><UserLink user={row.blocker} /></td>
                <td className="px-5 py-4"><UserLink user={row.blocked} /></td>
                <td className="px-5 py-4 text-gray-500">{new Date(row.created_at).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!blocks?.length && <p className="text-center text-gray-500 py-12">ブロック関係はありません</p>}
      </div>
    </div>
  )
}

function UserLink({ user }: { user: { id: string; nickname: string; role: 'cast' | 'customer' } | null }) {
  if (!user) return <span className="text-gray-600">削除済み</span>
  const segment = user.role === 'cast' ? 'female' : 'male'
  return (
    <Link href={`/dashboard/users/${segment}/${user.id}`} className="text-amber-300 hover:underline">
      {user.nickname} <span className="text-xs text-gray-600">（{user.role === 'cast' ? '女性' : '男性'}）</span>
    </Link>
  )
}
