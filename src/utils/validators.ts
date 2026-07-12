// -----------------------------------------------------------
// Mistella - フォームバリデーション
// 画面から独立した純粋関数として検証ロジックを集約する。
// エラーがあればメッセージ文字列、なければ null を返す。
// -----------------------------------------------------------

/** ニックネームの必須チェック */
export function validateNickname(nickname: string): string | null {
  if (!nickname.trim()) return 'ニックネームを入力してください。';
  return null;
}

/** プロフィール編集フォーム全体の検証。最初のエラーを返す */
export function validateProfileForm(input: { nickname: string }): string | null {
  return validateNickname(input.nickname);
}
