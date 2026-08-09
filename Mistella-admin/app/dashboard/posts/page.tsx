import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'
import { requireAdmin } from '@/lib/admin/auth'
import { parseStoragePublicUrl, removeStorageTargets } from '@/lib/admin/storage'
import { revalidatePath } from 'next/cache'

export default async function PostsPage() {
  const { admin } = await requireAdmin()
  const { data: posts } = await admin
    .from('timelines')
    .select('id, content, media_url, media_type, created_at, expires_at, user:user_id(id, nickname, role)')
    .order('created_at', { ascending: false })
    .limit(300)

  async function deletePost(formData: FormData) {
    'use server'
    const postId = String(formData.get('post_id') ?? '')
    if (!postId) throw new Error('投稿IDが必要です。')
    const { admin } = await requireAdmin()
    const { data: post, error: findError } = await admin
      .from('timelines')
      .select('media_url')
      .eq('id', postId)
      .maybeSingle()
    if (findError) throw findError

    const { error: deleteError } = await admin.from('timelines').delete().eq('id', postId)
    if (deleteError) throw deleteError

    const target = parseStoragePublicUrl(post?.media_url ?? null)
    if (target) await removeStorageTargets(admin, [target])
    revalidatePath('/dashboard/posts')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">投稿管理</h1>
      <p className="text-sm text-gray-500 mb-6">最新300件を表示しています。削除時はStorageの画像・動画も削除されます。</p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(posts ?? []).map((post: any) => {
          const user = post.user
          const expired = new Date(post.expires_at).getTime() <= Date.now()
          return (
            <article key={post.id} className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-hidden flex min-h-44">
              <div className="w-36 sm:w-44 shrink-0 bg-gray-950 flex items-center justify-center">
                {post.media_url && post.media_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.media_url} alt="投稿画像" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-700">{post.media_type === 'video' ? '▶' : 'Aa'}</span>
                )}
              </div>
              <div className="p-4 flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user?.nickname ?? '削除済みユーザー'}</p>
                    <p className="text-xs text-gray-500">{user?.role === 'cast' ? '女性' : '男性'} · {new Date(post.created_at).toLocaleString('ja-JP')}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${expired ? 'bg-gray-700 text-gray-400' : 'bg-green-500/15 text-green-300'}`}>
                    {expired ? '期限切れ' : '公開中'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-4 whitespace-pre-wrap line-clamp-4">{post.content || 'メッセージなし'}</p>
                <form action={deletePost} className="mt-auto pt-4 text-right">
                  <input type="hidden" name="post_id" value={post.id} />
                  <ConfirmSubmitButton
                    message="この投稿と添付メディアを削除します。よろしいですか？"
                    className="text-xs px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
                  >
                    投稿を削除
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          )
        })}
      </div>
      {!posts?.length && <p className="text-center text-gray-500 py-16">投稿はありません</p>}
    </div>
  )
}
