import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'

export default async function ShopsPage() {
  const { admin: supabase } = await requireAdmin()
  const { data: shops } = await supabase
    .from('cast_profiles')
    .select(`
      user_id, shop_name, shop_address, is_sponsored, work_status,
      user:user_id(nickname)
    `)
    .not('shop_name', 'is', null)
    .order('is_sponsored', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">店舗管理</h1>
      <div className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">店舗名</th>
              <th className="text-left px-4 py-3">キャスト名</th>
              <th className="text-left px-4 py-3">住所</th>
              <th className="text-left px-4 py-3">Sponsored</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(shops ?? []).map((s: any) => (
              <tr key={s.user_id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3 font-medium">{s.shop_name}</td>
                <td className="px-4 py-3 text-gray-400">{s.user?.nickname}</td>
                <td className="px-4 py-3 text-gray-400">{s.shop_address ?? '-'}</td>
                <td className="px-4 py-3">
                  {s.is_sponsored
                    ? <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">ON</span>
                    : <span className="text-gray-500 text-xs">-</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/shops/${s.user_id}`} className="text-amber-400 hover:underline text-xs">
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shops?.length && (
          <p className="text-center text-gray-500 py-12">店舗情報が登録されていません</p>
        )}
      </div>
    </div>
  )
}
