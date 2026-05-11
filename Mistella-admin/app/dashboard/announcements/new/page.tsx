'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TargetType = 'all_male' | 'all_female' | 'individual'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('all_male')
  const [targetUserId, setTargetUserId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; nickname: string }[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!userSearch.trim()) return
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, nickname')
      .ilike('nickname', `%${userSearch}%`)
      .limit(10)
    setSearchResults(data ?? [])
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !body) return
    if (targetType === 'individual' && !targetUserId) {
      setError('個別送信の場合は対象ユーザーを選択してください。')
      return
    }
    setSending(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('認証エラー'); setSending(false); return }

    const { data: announcement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        title, body,
        target_type: targetType,
        target_user_id: targetType === 'individual' ? targetUserId : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError || !announcement) {
      setError('保存に失敗しました。')
      setSending(false)
      return
    }

    const { error: fnError } = await supabase.functions.invoke('send-announcement', {
      body: {
        announcement_id: announcement.id,
        title, body, target_type: targetType,
        target_user_id: targetType === 'individual' ? targetUserId : undefined,
      },
    })

    if (fnError) {
      setError('送信に失敗しました。')
      setSending(false)
      return
    }

    router.push('/dashboard/announcements')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">お知らせ作成</h1>
      <form onSubmit={handleSend} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">タイトル</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">本文</label>
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} required rows={4}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">送信先</label>
          <div className="flex gap-3">
            {([['all_male','男性全員'], ['all_female','女性全員'], ['individual','個別']] as const).map(([v, l]) => (
              <button
                key={v} type="button"
                onClick={() => setTargetType(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  targetType === v ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {targetType === 'individual' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">ユーザー検索</label>
            <div className="flex gap-2">
              <input
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ニックネームで検索"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
              />
              <button type="button" onClick={handleSearch}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition">
                検索
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="mt-2 bg-gray-900 rounded-lg border border-gray-700">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => { setTargetUserId(u.id); setUserSearch(u.nickname); setSearchResults([]) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition ${
                        targetUserId === u.id ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {u.nickname}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit" disabled={sending}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-bold rounded-lg transition"
        >
          {sending ? '送信中...' : '送信する'}
        </button>
      </form>
    </div>
  )
}
