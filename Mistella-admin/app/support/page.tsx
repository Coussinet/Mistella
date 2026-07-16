// 公開ページ: サポート（App Store の Support URL 必須項目に使用）
// URL: https://<デプロイ先ドメイン>/support
// ※ SUPPORT_EMAIL は実際に受信できるアドレスに差し替えること。

const SUPPORT_EMAIL = 'support@example.com'

export const metadata = {
  title: 'Mistella サポート',
}

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 leading-relaxed">
      <h1 className="border-b-2 border-amber-500 pb-3 text-2xl font-bold tracking-wide">
        Mistella サポート
      </h1>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">お問い合わせ</h2>
      <p>
        ご利用中の不具合・ご質問・ご要望は、以下のメールアドレスまでお問い合わせください。
        原則3営業日以内に返信いたします。
      </p>
      <p className="mt-2">
        メール:{' '}
        <a className="text-amber-400 underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </p>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">よくあるお問い合わせ</h2>
      <ul className="list-disc pl-5">
        <li>ログインできない：ご登録のメールアドレス・パスワードをご確認ください。</li>
        <li>通知が届かない：端末の設定でMistellaの通知が許可されているかご確認ください。</li>
        <li>不適切なユーザーの報告：相手のプロフィール右上メニューから「通報」「ブロック」が可能です。</li>
        <li>アカウントの削除：下記「アカウント削除」をご参照ください。</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-amber-300">関連ページ</h2>
      <ul className="list-disc pl-5">
        <li>
          <a className="text-amber-400 underline" href="/privacy">
            プライバシーポリシー
          </a>
        </li>
        <li>
          <a className="text-amber-400 underline" href="/terms">
            利用規約
          </a>
        </li>
        <li>
          <a className="text-amber-400 underline" href="/account-deletion">
            アカウント削除について
          </a>
        </li>
      </ul>
    </main>
  )
}
