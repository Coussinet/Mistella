import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(id, nickname, avatar_url, role),
      reported_user:reported_user_id(id, nickname, avatar_url, role)
    `)
    .eq('id', params.id)
    .single()

  if (!report) redirect('/dashboard/reports')

  const REASON_LABEL: Record<string, string> = {
    spam: 'スパム', inappropriate_content: '不適切なコンテンツ',
    harassment: '嫌がらせ', other: 'その他',
  }

  async function updateStatus(formData: FormData) {
    'use server'
    const status = formData.get('status') as string
    if (status !== 'reviewed' && status !== 'dismissed') throw new Error('Invalid status')
    const admin = createAdminClient()
    const { data: { user } } = await (await createClient()).auth.getUser()
    if (!user) throw new Error('Unauthorized')
    await admin.from('reports').update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq('id', params.id)
    redirect('/dashboard/reports')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">通報詳細</h1>
      <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">通報者</p>
            <p className="font-medium">{(report.reporter as any)?.nickname}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">対象ユーザー</p>
            <p className="font-medium">{(report.reported_user as any)?.nickname}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">理由</p>
          <p>{REASON_LABEL[report.reason]}</p>
        </div>
        {report.detail && (
          <div>
            <p className="text-xs text-gray-400 mb-1">補足</p>
            <p className="text-gray-300">{report.detail}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 mb-1">通報日時</p>
          <p>{new Date(report.created_at).toLocaleString('ja-JP')}</p>
        </div>
      </div>
      {report.status === 'pending' && (
        <div className="flex gap-3">
          <form action={updateStatus}>
            <input type="hidden" name="status" value="reviewed" />
            <button className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition">
              対応済みにする
            </button>
          </form>
          <form action={updateStatus}>
            <input type="hidden" name="status" value="dismissed" />
            <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition">
              却下する
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
