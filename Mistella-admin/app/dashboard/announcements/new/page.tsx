import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'

type TargetType = 'all' | 'all_male' | 'all_female' | 'individual'

export default async function NewAnnouncementPage() {
  const { admin } = await requireAdmin()
  const { data: users } = await admin
    .from('users')
    .select('id, nickname, role')
    .eq('is_blocked', false)
    .order('nickname')

  async function sendAnnouncement(formData: FormData) {
    'use server'
    const { admin, adminUser, sessionClient } = await requireAdmin()
    const title = String(formData.get('title') ?? '').trim()
    const body = String(formData.get('body') ?? '').trim()
    const targetType = String(formData.get('target_type') ?? '') as TargetType
    const targetUserId = String(formData.get('target_user_id') ?? '').trim()
    const allowedTargets: TargetType[] = ['all', 'all_male', 'all_female', 'individual']

    if (!title || !body || !allowedTargets.includes(targetType)) {
      throw new Error('入力内容が正しくありません。')
    }
    if (targetType === 'individual' && !targetUserId) {
      throw new Error('個別送信の対象ユーザーを選択してください。')
    }

    const { data: announcement, error: insertError } = await admin
      .from('announcements')
      .insert({
        title,
        body,
        target_type: targetType,
        target_user_id: targetType === 'individual' ? targetUserId : null,
        created_by: adminUser.id,
      })
      .select('id')
      .single()
    if (insertError || !announcement) throw insertError ?? new Error('お知らせを保存できませんでした。')

    const { error: functionError } = await sessionClient.functions.invoke('send-announcement', {
      body: {
        announcement_id: announcement.id,
        title,
        body,
        target_type: targetType,
        target_user_id: targetType === 'individual' ? targetUserId : undefined,
      },
    })
    if (functionError) {
      await admin.from('announcements').delete().eq('id', announcement.id)
      throw functionError
    }

    redirect('/dashboard/announcements')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">お知らせ作成</h1>
      <p className="text-sm text-gray-500 mb-6">全体・男女別・個別にプッシュ通知を送信します。</p>
      <form action={sendAnnouncement} className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1">タイトル</label>
          <input name="title" required maxLength={80} className="admin-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">本文</label>
          <textarea name="body" required maxLength={300} rows={5} className="admin-input resize-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">送信先</label>
          <select name="target_type" required defaultValue="all" className="admin-input">
            <option value="all">全ユーザー</option>
            <option value="all_male">男性全員</option>
            <option value="all_female">女性全員</option>
            <option value="individual">ユーザー個別</option>
          </select>
          <p className="text-xs text-gray-600 mt-2">個別送信を選んだ場合のみ、下のユーザーが使用されます。</p>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">個別送信先</label>
          <select name="target_user_id" defaultValue="" className="admin-input">
            <option value="">選択しない</option>
            {(users ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.nickname}（{user.role === 'cast' ? '女性' : '男性'}）
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl transition">
            送信する
          </button>
          <a href="/dashboard/announcements" className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-center rounded-xl transition">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  )
}
