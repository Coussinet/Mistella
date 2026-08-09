import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'

export default async function AnnouncementsPage() {
  const { admin: supabase } = await requireAdmin()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  const TARGET_LABEL: Record<string, string> = {
    all: '全ユーザー', all_male: '男性全員', all_female: '女性全員', individual: '個別',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">お知らせ管理</h1>
        <Link
          href="/dashboard/announcements/new"
          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg text-sm transition"
        >
          + 新規作成
        </Link>
      </div>
      <div className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">タイトル</th>
              <th className="text-left px-4 py-3">送信先</th>
              <th className="text-left px-4 py-3">送信日時</th>
              <th className="text-left px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {(announcements ?? []).map((a: any) => (
              <tr key={a.id} className="border-t border-gray-700">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-gray-400">{TARGET_LABEL[a.target_type]}</td>
                <td className="px-4 py-3 text-gray-400">
                  {a.sent_at ? new Date(a.sent_at).toLocaleString('ja-JP') : '-'}
                </td>
                <td className="px-4 py-3">
                  {a.sent_at
                    ? <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">送信済み</span>
                    : <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">未送信</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!announcements?.length && (
          <p className="text-center text-gray-500 py-12">お知らせはありません</p>
        )}
      </div>
    </div>
  )
}
