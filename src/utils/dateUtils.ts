// -----------------------------------------------------------
// Mistella - 日付ユーティリティ
// -----------------------------------------------------------

// -----------------------------------------------------------
// 内部ヘルパー
// -----------------------------------------------------------

/**
 * 文字列または Date オブジェクトを Date に統一する。
 */
function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

// -----------------------------------------------------------
// 公開 API
// -----------------------------------------------------------

/**
 * 指定日時を「3分前」「2時間前」「昨日」「3日前」のような
 * 日本語の相対表示に変換する。
 *
 * @param date - 対象の日時（文字列または Date）
 * @returns 日本語の相対時間文字列
 */
export function formatRelativeTime(date: string | Date): string {
  const target = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'たった今';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  }
  if (diffHours < 24) {
    return `${diffHours}時間前`;
  }
  if (diffDays === 1) {
    return '昨日';
  }
  if (diffDays < 30) {
    return `${diffDays}日前`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}ヶ月前`;
  }
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}年前`;
}

/**
 * 指定した期限が現在時刻を過ぎているか判定する。
 *
 * @param expiresAt - 期限の日時（文字列または Date）
 * @returns 期限切れなら true
 */
export function isExpired(expiresAt: string | Date): boolean {
  return toDate(expiresAt).getTime() < Date.now();
}

/**
 * 指定した Date に hours 時間を加算した新しい Date を返す。
 *
 * @param date  - 基準日時
 * @param hours - 加算する時間数（負の値で減算）
 * @returns 加算後の Date
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * 日付を「2024年1月1日」形式の日本語文字列に変換する。
 * format パラメータを指定することで別のパターンも利用できる（将来拡張用）。
 *
 * 現在サポートするフォーマット:
 *   - `'YYYY年M月D日'`（デフォルト）
 *   - `'YYYY/MM/DD'`
 *   - `'MM/DD'`
 *
 * @param date   - 対象の日付（文字列または Date）
 * @param format - フォーマット文字列（省略時はデフォルト形式）
 * @returns フォーマット済みの日付文字列
 */
export function formatDate(
  date: string | Date,
  format: string = 'YYYY年M月D日',
): string {
  const d = toDate(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const monthPadded = String(month).padStart(2, '0');
  const dayPadded = String(day).padStart(2, '0');

  switch (format) {
    case 'YYYY/MM/DD':
      return `${year}/${monthPadded}/${dayPadded}`;
    case 'MM/DD':
      return `${monthPadded}/${dayPadded}`;
    case 'YYYY年M月D日':
    default:
      return `${year}年${month}月${day}日`;
  }
}

/**
 * 今日から指定日まで何日後かを返す。
 * 過去の日付の場合は負の値を返す。
 *
 * @param date - 対象の日付（文字列または Date）
 * @returns 今日から何日後（または前）か
 */
export function getDaysUntil(date: string | Date): number {
  const target = toDate(date);
  const now = new Date();

  // 時刻を 0:00 に揃えて日数のみ比較する
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = targetMidnight.getTime() - nowMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 指定した日付が今日かどうか判定する。
 *
 * @param date - 判定対象の日付（文字列または Date）
 * @returns 今日なら true
 */
export function isToday(date: string | Date): boolean {
  const target = toDate(date);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

/**
 * 誕生日が今日から daysThreshold 日以内に迫っているか判定する。
 * 年は無視して月日のみで判定する（毎年の誕生日に対応）。
 *
 * @param birthday      - 誕生日（文字列または Date）
 * @param daysThreshold - 何日前から「近い」とみなすか（デフォルト: 7）
 * @returns daysThreshold 日以内に誕生日が来るなら true
 */
export function isBirthdayApproaching(
  birthday: string | Date,
  daysThreshold: number = 7,
): boolean {
  const bd = toDate(birthday);
  const now = new Date();

  // 今年の誕生日を生成する
  let nextBirthday = new Date(
    now.getFullYear(),
    bd.getMonth(),
    bd.getDate(),
  );

  // 今年の誕生日がすでに過ぎていた場合は来年に繰り越す
  if (nextBirthday.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    nextBirthday = new Date(
      now.getFullYear() + 1,
      bd.getMonth(),
      bd.getDate(),
    );
  }

  const daysUntilBirthday = getDaysUntil(nextBirthday);
  return daysUntilBirthday >= 0 && daysUntilBirthday <= daysThreshold;
}
