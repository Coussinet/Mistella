// 公開ページ: 利用規約（LINE / App Store / Google Play 申請用）
// URL: https://<デプロイ先ドメイン>/terms

export const metadata = {
  title: 'Mistella 利用規約',
}

export default function TermsPage() {
  const sections: { title: string; body: string }[] = [
    {
      title: '第1条（適用）',
      body: '本規約は、Mistella（以下「本サービス」）の利用に関する条件を、本サービスを利用するすべての方（以下「利用者」）と運営者との間で定めるものです。利用者は、本サービスを利用することで本規約に同意したものとみなされます。',
    },
    {
      title: '第2条（利用資格）',
      body: '本サービスは18歳以上の方のみご利用いただけます。虚偽の年齢申告による登録は禁止します。',
    },
    {
      title: '第3条（アカウント）',
      body: '利用者は、自己の責任においてアカウントを管理するものとし、第三者に譲渡・貸与してはなりません。',
    },
    {
      title: '第4条（禁止事項）',
      body: '利用者は、法令または公序良俗に違反する行為、他の利用者への迷惑行為・誹謗中傷・ハラスメント、虚偽情報の登録、営業・勧誘・宗教活動その他本来の目的と異なる利用、売春・買春その他違法な取引を目的とする行為、運営者または第三者の権利を侵害する行為をしてはなりません。',
    },
    {
      title: '第5条（コンテンツの取り扱い）',
      body: '利用者が投稿したコンテンツの責任は利用者に帰属します。運営者は、不適切と判断したコンテンツを予告なく削除できるものとします。',
    },
    {
      title: '第6条（サービスの変更・停止）',
      body: '運営者は、利用者への事前通知なく本サービスの内容を変更または停止できるものとします。',
    },
    {
      title: '第7条（免責事項）',
      body: '運営者は、本サービスを通じて生じた利用者間のトラブルについて一切の責任を負いません。',
    },
    {
      title: '第8条（規約の変更）',
      body: '運営者は、必要に応じて本規約を変更できるものとします。変更後の規約は、本サービス上に表示した時点で効力を生じます。',
    },
  ]

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 leading-relaxed">
      <h1 className="border-b-2 border-amber-500 pb-3 text-2xl font-bold tracking-wide">
        Mistella 利用規約
      </h1>
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="mt-8 text-lg font-semibold text-amber-300">{s.title}</h2>
          <p>{s.body}</p>
        </section>
      ))}
      <p className="mt-10 text-sm text-gray-500">制定日：2026年7月</p>
    </main>
  )
}
