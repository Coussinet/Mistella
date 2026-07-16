// 公開ページ: プライバシーポリシー（LINE / App Store / Google Play 申請用）
// URL: https://<デプロイ先ドメイン>/privacy

export const metadata = {
  title: 'Mistella プライバシーポリシー',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 leading-relaxed">
      <h1 className="border-b-2 border-amber-500 pb-3 text-2xl font-bold tracking-wide">
        Mistella プライバシーポリシー
      </h1>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">1. 取得する情報</h2>
      <p>本サービスは、サービス提供のために以下の情報を取得します。</p>
      <ul className="list-disc pl-5">
        <li>メールアドレス、ニックネーム等の登録情報</li>
        <li>プロフィール情報、投稿内容、写真</li>
        <li>位置情報（出勤中の共有機能を利用する場合のみ）</li>
        <li>端末情報、プッシュ通知トークン</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">2. 利用目的</h2>
      <p>取得した情報は、以下の目的で利用します。</p>
      <ul className="list-disc pl-5">
        <li>本サービスの提供、本人確認、マッチング機能の実現</li>
        <li>通知の配信、機能改善、不正利用の防止</li>
        <li>お問い合わせへの対応</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">3. 第三者提供</h2>
      <p>運営者は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供しません。</p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">4. 位置情報</h2>
      <p>
        位置情報は、利用者が共有をオンにした場合のみ取得し、プライバシー保護のため概算エリアに変換して表示します。
      </p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">5. 情報の管理</h2>
      <p>運営者は、取得した情報を適切に管理し、漏えい・滅失・毀損の防止に努めます。</p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">6. 情報の削除</h2>
      <p>利用者は、アカウントを削除することでご自身の情報の削除を請求できます。</p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">7. お問い合わせ</h2>
      <p>本ポリシーに関するお問い合わせは、アプリ内のお問い合わせ窓口までご連絡ください。</p>

      <p className="mt-10 text-sm text-gray-500">制定日：2026年7月</p>
    </main>
  )
}
