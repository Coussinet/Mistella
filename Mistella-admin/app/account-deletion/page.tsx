// 公開ページ: アカウント・データ削除の案内
// （Google Play「データ削除URL」要件 / Apple のアカウント削除要件に対応）
// URL: https://<デプロイ先ドメイン>/account-deletion
// ※ SUPPORT_EMAIL は実際に受信できるアドレスに差し替えること。

const SUPPORT_EMAIL = 'support@example.com'

export const metadata = {
  title: 'Mistella アカウント削除',
}

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 leading-relaxed">
      <h1 className="border-b-2 border-amber-500 pb-3 text-2xl font-bold tracking-wide">
        アカウント・データの削除
      </h1>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">アプリ内での削除手順</h2>
      <ol className="list-decimal pl-5">
        <li>Mistella アプリを開きます。</li>
        <li>「マイページ」タブを開きます。</li>
        <li>「アカウントを削除」を選択します。</li>
        <li>確認のうえ削除を実行すると、アカウントと関連データが削除されます。</li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">メールでの削除依頼</h2>
      <p>
        アプリにアクセスできない場合は、ご登録のメールアドレスから以下宛に「アカウント削除希望」と
        記載してご連絡ください。本人確認のうえ削除いたします。
      </p>
      <p className="mt-2">
        メール:{' '}
        <a className="text-amber-400 underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">削除されるデータ</h2>
      <ul className="list-disc pl-5">
        <li>プロフィール情報（ニックネーム・写真・自己紹介など）</li>
        <li>投稿・メッセージ・マッチング情報</li>
        <li>お気に入り・足跡・会った記録などの利用データ</li>
        <li>アカウント（認証情報）</li>
      </ul>
      <p className="mt-2 text-sm text-gray-400">
        ※ 法令上の保存義務がある情報、および不正利用防止のために必要な最小限の記録は、
        所定の期間保持される場合があります。
      </p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">処理期間</h2>
      <p>削除依頼を受領後、原則として30日以内に削除を完了します。</p>
    </main>
  )
}
