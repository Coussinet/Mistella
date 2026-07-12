// -----------------------------------------------------------
// Mistella - エラー表示の一元化
// 各画面の try/catch → Alert.alert('エラー', ...) をここに集約する。
// 将来トースト表示に切り替える際はこのファイルだけ変更すればよい。
// -----------------------------------------------------------

import { Alert } from 'react-native';

/** Supabase / ネットワーク系エラーメッセージの日本語化マップ */
const MESSAGE_MAP: Array<[pattern: string, message: string]> = [
  ['Invalid login credentials', 'メールアドレスまたはパスワードが正しくありません。'],
  ['Email not confirmed', 'メールアドレスの確認が完了していません。確認メールをご確認ください。'],
  ['Too many requests', 'しばらく時間をおいてから再度お試しください。'],
  ['too many requests', 'しばらく時間をおいてから再度お試しください。'],
  ['rate limit', 'しばらく時間をおいてから再度お試しください。'],
  ['User already registered', 'このメールアドレスはすでに登録されています。'],
  ['already been registered', 'このメールアドレスはすでに登録されています。'],
  ['Password should be at least', 'パスワードは6文字以上で入力してください。'],
  ['Invalid email', '有効なメールアドレスを入力してください。'],
  ['Network request failed', 'ネットワークエラーが発生しました。接続を確認してください。'],
  ['JWT expired', 'セッションの有効期限が切れました。再度ログインしてください。'],
];

/** エラーからユーザー向けメッセージを組み立てる */
export function toErrorMessage(
  error: unknown,
  fallback = 'エラーが発生しました。時間をおいて再度お試しください。',
): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  if (!raw) return fallback;

  for (const [pattern, message] of MESSAGE_MAP) {
    if (raw.includes(pattern)) return message;
  }
  return raw;
}

/** エラーをユーザーに表示する（現状は Alert、将来はトーストへ差し替え） */
export function showError(error: unknown, fallback?: string): void {
  Alert.alert('エラー', toErrorMessage(error, fallback));
}
