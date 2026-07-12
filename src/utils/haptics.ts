// -----------------------------------------------------------
// Mistella - ハプティクス（触覚フィードバック）
// 主要アクションの手応えを統一する。失敗はサイレントに無視
// （シミュレータや非対応端末でも安全に呼べる）。
// -----------------------------------------------------------

import * as Haptics from 'expo-haptics';

/** 軽いタップ（選択・トグル・タブ切替） */
export function tapLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** 中程度のタップ（お気に入り・いいね） */
export function tapMedium(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** 成功（送信完了・マッチ成立・保存完了） */
export function success(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** 警告（削除確認など注意を促す操作） */
export function warning(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

/** エラー（操作失敗） */
export function error(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
