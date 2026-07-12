// -----------------------------------------------------------
// Mistella - 共通アニメーションヘルパー
// 一覧アイテムの出現アニメーションなど、画面横断で使う
// reanimated のプリセットをここに集約する。
// -----------------------------------------------------------

import { FadeInDown } from 'react-native-reanimated';

/** ステガー遅延を適用する最大インデックス（以降は同時に出現させる） */
const STAGGER_MAX_INDEX = 10;

/** 1件あたりのステガー遅延（ms） */
const STAGGER_DELAY_MS = 40;

/**
 * 一覧アイテム用の出現アニメーション。
 * FadeInDown 250ms + index に応じたステガー遅延（最初の10件まで）。
 * FlatList の renderItem 内で `entering={listItemEntering(index)}` として使う。
 */
export function listItemEntering(index: number) {
  return FadeInDown.duration(250).delay(
    Math.min(index, STAGGER_MAX_INDEX) * STAGGER_DELAY_MS,
  );
}
