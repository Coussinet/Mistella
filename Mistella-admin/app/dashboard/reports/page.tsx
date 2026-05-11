import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { ReportStatus } from '@/types'

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:   '未対応',
  reviewed:  '対応済み',
  dismissed: '却下',
}
const STATUS_COLOR: Record<ReportStatus, string> = {
  pending:   'bg-red-500/20 text-red-400',
  reviewed:  'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
}
const REASON_LABEL: Record<string, string> = {
  spam:                  'スパム',
  inappropriate_content: '不適切なコンテンツ',
  harassment:            '嫌がらせ',
  other:                 'その他',
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createClient()
  const statusFilter = (searchParams.status as ReportStatus) || 'pending'

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id, reason, status, created_at, detail,
      reporter:reporter_id(nickname),
      reported_user:reported_user_id(nickname)
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">通報管理</h1>
      <div className="flex gap-2 mb-6">
        {(['pending', 'reviewed', 'dismissed'] as ReportStatus[]).map((s) => (
          <Link
            key={s}
            href={`/dashboard/reports?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === s ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">通報者</th>
              <th className="text-left px-4 py-3">対象ユーザー</th>
              <th className="text-left px-4 py-3">理由</th>
              <th className="text-left px-4 py-3">日時</th>
              <th className="text-left px-4 py-3">ステータス</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3">{r.reporter?.nickname ?? '-'}</td>
                <td className="px-4 py-3">{r.reported_user?.nickname ?? '-'}</td>
                <td className="px-4 py-3">{REASON_LABEL[r.reason]}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLOR[r.status as ReportStatus]}`}>
                    {STATUS_LABEL[r.status as ReportStatus]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/reports/${r.id}`} className="text-amber-400 hover:underline text-xs">
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reports?.length && (
          <p className="text-center text-gray-500 py-12">通報はありません</p>
        )}
      </div>
    </div>
  )
}
