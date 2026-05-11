import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function ShopEditPage({ params }: { params: { userId: string } }) {
  const supabase = await createClient()

  const [{ data: shop }, { data: user }] = await Promise.all([
    supabase.from('cast_profiles').select('*').eq('user_id', params.userId).single(),
    supabase.from('users').select('nickname').eq('id', params.userId).single(),
  ])

  if (!shop) redirect('/dashboard/shops')

  async function saveShop(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    await admin.from('cast_profiles').update({
      shop_name:    formData.get('shop_name') as string || null,
      shop_address: formData.get('shop_address') as string || null,
      price_info:   formData.get('price_info') as string || null,
      is_sponsored: formData.get('is_sponsored') === 'true',
    }).eq('user_id', params.userId)
    redirect('/dashboard/shops')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-2">店舗編集</h1>
      <p className="text-gray-400 text-sm mb-6">キャスト: {(user as any)?.nickname}</p>
      <form action={saveShop} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">店舗名</label>
          <input
            name="shop_name" defaultValue={shop.shop_name ?? ''}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">住所</label>
          <input
            name="shop_address" defaultValue={shop.shop_address ?? ''}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">料金情報</label>
          <textarea
            name="price_info" defaultValue={shop.price_info ?? ''}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-none"
          />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-700">
          <span className="text-sm text-amber-400">Sponsoredバッジ</span>
          <select
            name="is_sponsored" defaultValue={String(shop.is_sponsored)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white"
          >
            <option value="false">OFF</option>
            <option value="true">ON</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition"
          >
            保存する
          </button>
          <a href="/dashboard/shops"
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-center rounded-lg transition text-sm">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  )
}
